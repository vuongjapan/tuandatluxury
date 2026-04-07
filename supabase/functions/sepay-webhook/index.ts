
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeBookingCode(desc: string): string | null {
  if (!desc) return null;
  const cleaned = desc.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  
  const foodMatch = cleaned.match(/(TD\d{6}[A-Z]\d{5}FOOD\d*)/);
  if (foodMatch) return foodMatch[1];

  const matchNew = cleaned.match(/TD(\d{6})A(\d+)(?!FOOD)/);
  if (matchNew) return `TD${matchNew[1]}A${matchNew[2].padStart(5, "0")}`;
  
  const matchOld2 = cleaned.match(/TDLH2026A(\d+)/);
  if (matchOld2) return "TDLH2026A" + matchOld2[1].padStart(5, "0");
  
  const matchOld = cleaned.match(/TDLH(\d+)/);
  if (matchOld) return "TDLH-" + matchOld[1].padStart(5, "0");
  
  return null;
}

async function fetchCombosWithDishes(supabase: any, bookingId: string) {
  const { data: combos } = await supabase
    .from("booking_combos")
    .select("*")
    .eq("booking_id", bookingId);

  const comboList = combos || [];
  const result: any[] = [];

  for (const combo of comboList) {
    const parts = combo.combo_name?.split(' – ') || [];
    const menuName = parts.length > 1 ? parts.slice(1).join(' – ') : '';
    let dishes: any[] = [];
    if (menuName && combo.dining_item_id) {
      const { data: menus } = await supabase
        .from("combo_menus")
        .select("id, name_vi, name_en")
        .eq("combo_package_id", combo.dining_item_id)
        .eq("is_active", true);
      const matchedMenu = menus?.find((m: any) => m.name_vi === menuName || m.name_en === menuName);
      if (matchedMenu) {
        const { data: dishData } = await supabase
          .from("combo_menu_dishes")
          .select("name_vi, sort_order")
          .eq("combo_menu_id", matchedMenu.id)
          .order("sort_order");
        dishes = dishData || [];
      }
    }
    result.push({ ...combo, dishes });
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { content: description, transferAmount: amount, id: transactionId } = body;

    console.log("SePay webhook received:", JSON.stringify({ description, amount, transactionId }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check duplicate webhook
    if (transactionId) {
      const { data: existing } = await supabase
        .from("webhook_logs")
        .select("id")
        .eq("transaction_id", String(transactionId))
        .maybeSingle();
      if (existing) {
        console.log("Duplicate webhook, skipping:", transactionId);
        return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Normalize description to code
    const matchedCode = normalizeBookingCode(description || "");

    // Log webhook
    await supabase.from("webhook_logs").insert({
      source: "sepay",
      transaction_id: transactionId ? String(transactionId) : null,
      description: description || "",
      amount: amount || 0,
      matched_booking_code: matchedCode,
      processed: false,
    });

    if (!matchedCode) {
      console.log("No code found in description:", description);
      return new Response(JSON.stringify({ success: true, message: "No matching code" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if it's a food order (contains FOOD)
    const isFoodOrder = matchedCode.includes("FOOD");

    if (isFoodOrder) {
      // Handle food order payment
      const { data: foodOrder } = await supabase
        .from("food_orders")
        .select("*")
        .eq("food_order_id", matchedCode)
        .maybeSingle();

      if (!foodOrder) {
        console.log("Food order not found:", matchedCode);
        return new Response(JSON.stringify({ success: true, message: "Food order not found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (foodOrder.payment_status === "DEPOSIT_PAID" || foodOrder.payment_status === "PAID") {
        console.log("Food order already paid:", matchedCode);
        await supabase.from("webhook_logs")
          .update({ processed: true })
          .eq("transaction_id", String(transactionId));
        return new Response(JSON.stringify({ success: true, message: "Already paid" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const depositAmount = Math.round(foodOrder.total_amount * 0.5);

      if (amount < depositAmount) {
        console.log(`Food amount ${amount} < deposit ${depositAmount}`);
        return new Response(JSON.stringify({ success: true, message: "Amount insufficient" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update food order
      await supabase
        .from("food_orders")
        .update({
          payment_status: "DEPOSIT_PAID",
          paid_amount: depositAmount,
          status: "confirmed",
        })
        .eq("id", foodOrder.id);

      // Mark webhook processed
      await supabase.from("webhook_logs")
        .update({ processed: true })
        .eq("transaction_id", String(transactionId));

      console.log("Food order confirmed:", matchedCode);

      // Send deposit paid email
      try {
        const smtpPassword = Deno.env.get("SMTP_PASSWORD");
        if (smtpPassword) {
          // Fetch order items for email
          const { data: items } = await supabase
            .from("food_order_items")
            .select("*, menu_items:menu_item_id(name_vi)")
            .eq("food_order_id", foodOrder.id);

          const itemsList = (items || []).map((i: any) => ({
            name: i.menu_items?.name_vi || 'Món ăn',
            quantity: i.quantity,
            price: i.price_vnd,
          }));

          const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;
          
          await fetch(`${supabaseFunctionsUrl}/send-booking-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              type: 'food_deposit_paid',
              food_order: {
                food_order_id: foodOrder.food_order_id,
                customer_name: foodOrder.customer_name,
                phone: foodOrder.phone,
                guest_email: foodOrder.guest_email || null,
                room_number: foodOrder.room_number,
                booking_code: foodOrder.booking_code,
                total_amount: foodOrder.total_amount,
                deposit_amount: depositAmount,
                items: itemsList,
              },
            }),
          });
          console.log("Food deposit email triggered");
        }
      } catch (emailErr) {
        console.error("Food email error (non-blocking):", emailErr);
      }

      return new Response(JSON.stringify({ success: true, message: "Food payment confirmed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle room booking payment (existing logic)
    const bookingCode = matchedCode;
    
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, rooms(name_vi)")
      .eq("booking_code", bookingCode)
      .maybeSingle();

    if (!booking) {
      console.log("Booking not found for code:", bookingCode);
      return new Response(JSON.stringify({ success: true, message: "Booking not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.payment_status === "DEPOSIT_PAID" || booking.payment_status === "PAID") {
      console.log("Booking already paid:", bookingCode);
      await supabase.from("webhook_logs")
        .update({ processed: true, matched_booking_code: bookingCode })
        .eq("transaction_id", String(transactionId));
      return new Response(JSON.stringify({ success: true, message: "Already paid" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (amount < booking.deposit_amount) {
      console.log(`Amount ${amount} < deposit ${booking.deposit_amount}`);
      return new Response(JSON.stringify({ success: true, message: "Amount insufficient" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update booking status
    await supabase
      .from("bookings")
      .update({ payment_status: "DEPOSIT_PAID", status: "confirmed" })
      .eq("id", booking.id);

    // Update invoice
    await supabase
      .from("invoices")
      .update({ payment_status: "DEPOSIT_PAID", status: "deposit_paid" })
      .eq("booking_id", booking.id);

    // Mark webhook as processed
    await supabase.from("webhook_logs")
      .update({ processed: true, matched_booking_code: bookingCode })
      .eq("transaction_id", String(transactionId));

    console.log("Booking confirmed:", bookingCode);

    // Send confirmation email
    try {
      const smtpPassword = Deno.env.get("SMTP_PASSWORD");
      if (smtpPassword) {
        const { data: inv } = await supabase
          .from("invoices")
          .select("invoice_number")
          .eq("booking_id", booking.id)
          .maybeSingle();

        const updatedBooking = { ...booking, payment_status: "DEPOSIT_PAID" };
        const roomName = booking.rooms?.name_vi || booking.room_id;
        const invoiceNumber = inv?.invoice_number || booking.booking_code;
        const emailHtml = buildDepositConfirmHtml(updatedBooking, roomName, invoiceNumber);

        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: false,
          auth: { user: SMTP_EMAIL, pass: smtpPassword },
        });

        if (booking.guest_email) {
          await transporter.sendMail({
            from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
            to: booking.guest_email,
            subject: `Hóa đơn ${booking.booking_code} - Đã cọc 50%`,
            html: emailHtml,
          });
          console.log("Deposit confirmation email sent to guest");
        }

        await transporter.sendMail({
          from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
          to: ADMIN_EMAIL,
          subject: `✅ Đã nhận cọc ${booking.booking_code} - ${booking.guest_name}`,
          html: emailHtml,
        });
        console.log("Deposit confirmation email sent to admin");
      }
    } catch (emailErr) {
      console.error("Email error (non-blocking):", emailErr);
    }

    return new Response(JSON.stringify({ success: true, message: "Payment confirmed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sepay-webhook error:", e);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

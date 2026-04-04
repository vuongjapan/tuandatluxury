
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_EMAIL = "tuandatluxuryflc36hotelsamson@gmail.com";
const ADMIN_EMAIL = "tuandatluxuryflc36hotel@gmail.com";
const HOTEL_NAME = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa, Việt Nam";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 098.661.7939";
const HOTEL_EMAIL_DISPLAY = "tuandatluxuryflc36hotel@gmail.com";

function normalizeBookingCode(desc: string): string | null {
  if (!desc) return null;
  const cleaned = desc.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  
  // Match FOOD order: TD202604A00025FOOD, TD202604A00025FOOD1, TD202604A00025FOOD2
  const foodMatch = cleaned.match(/(TD\d{6}[A-Z]\d{5}FOOD\d*)/);
  if (foodMatch) return foodMatch[1];

  // Match room booking: TDYYYYMMAXXXXX (must NOT be followed by FOOD)
  const matchNew = cleaned.match(/TD(\d{6})A(\d+)(?!FOOD)/);
  if (matchNew) return `TD${matchNew[1]}A${matchNew[2].padStart(5, "0")}`;
  
  // Fallback: old format TDLH2026AXXXXX
  const matchOld2 = cleaned.match(/TDLH2026A(\d+)/);
  if (matchOld2) return "TDLH2026A" + matchOld2[1].padStart(5, "0");
  
  // Fallback: old format TDLH-XXXXX
  const matchOld = cleaned.match(/TDLH(\d+)/);
  if (matchOld) return "TDLH-" + matchOld[1].padStart(5, "0");
  
  return null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

function buildDepositConfirmHtml(booking: any, roomName: string, invoiceNumber: string): string {
  const checkIn = formatDate(booking.check_in);
  const checkOut = formatDate(booking.check_out);
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  );
  const roomQty = booking.room_quantity || 1;
  const pricePerNight = nights > 0 && roomQty > 0 ? Math.round(booking.total_price_vnd / nights / roomQty) : 0;

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#8B6914,#C49B2A,#8B6914);padding:28px 24px;text-align:center;color:#fff;">
    <div style="font-size:16px;margin-bottom:4px;">📋</div>
    <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:1px;">PHIẾU XÁC NHẬN ĐẶT PHÒNG</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">BOOKING CONFIRMATION</p>
    <div style="margin-top:16px;text-align:left;font-size:13px;line-height:1.6;opacity:0.9;">
      <p style="margin:2px 0;"><strong>Khách sạn:</strong> ${HOTEL_NAME}</p>
      <p style="margin:2px 0;"><strong>Địa chỉ:</strong> ${HOTEL_ADDRESS}</p>
      <p style="margin:2px 0;"><strong>Hotline:</strong> ${HOTEL_PHONES}</p>
      <p style="margin:2px 0;"><strong>Email:</strong> ${HOTEL_EMAIL_DISPLAY}</p>
    </div>
  </div>
  <div style="padding:24px;">
    <div style="background:#f8f6f0;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Mã đặt phòng</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#8B6914;letter-spacing:3px;">${booking.booking_code}</p>
    </div>
    <div style="background:#ECFDF5;border-radius:10px;padding:12px 16px;margin-bottom:20px;text-align:center;">
      <span style="color:#059669;font-weight:700;font-size:14px;">✅ ĐÃ CỌC 50%</span>
    </div>
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Thông tin khách</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Họ tên:</td><td style="font-weight:500;">${booking.guest_name}</td></tr>
      <tr><td style="color:#888;">Số điện thoại:</td><td style="font-weight:500;">📞 ${booking.guest_phone}</td></tr>
      ${booking.guest_email ? `<tr><td style="color:#888;">Email:</td><td style="font-weight:500;">📧 ${booking.guest_email}</td></tr>` : ""}
    </table>
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Thông tin đặt phòng</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Loại phòng:</td><td style="font-weight:500;">${roomName}</td></tr>
      <tr><td style="color:#888;">Số phòng:</td><td style="font-weight:500;">${roomQty}</td></tr>
      <tr><td style="color:#888;">Số khách:</td><td style="font-weight:500;">${booking.guests_count} người</td></tr>
      <tr><td style="color:#888;">Ngày nhận phòng:</td><td style="font-weight:500;">${checkIn}</td></tr>
      <tr><td style="color:#888;">Ngày trả phòng:</td><td style="font-weight:500;">${checkOut}</td></tr>
      <tr><td style="color:#888;">Tổng số đêm:</td><td style="font-weight:500;">${nights} đêm</td></tr>
    </table>
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Chi phí</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Giá phòng / đêm:</td><td style="font-weight:500;">${formatPrice(pricePerNight)}</td></tr>
      ${roomQty > 1 ? `<tr><td style="color:#888;">Số phòng × Số đêm:</td><td style="font-weight:500;">${roomQty} × ${nights}</td></tr>` : ""}
      <tr><td style="color:#888;">Tổng tiền:</td><td style="font-weight:700;color:#8B6914;font-size:15px;">${formatPrice(booking.total_price_vnd)}</td></tr>
      <tr><td style="color:#888;">Đã đặt cọc (50%):</td><td style="font-weight:700;color:#059669;">${formatPrice(booking.deposit_amount)}</td></tr>
      <tr><td style="color:#888;">Còn lại khi nhận phòng:</td><td style="font-weight:700;color:#8B6914;">${formatPrice(booking.remaining_amount)}</td></tr>
    </table>
    <div style="border-top:1px solid #eee;margin-top:20px;padding-top:16px;font-size:12px;color:#999;line-height:1.6;">
      <p style="text-align:center;">
        Xin chân thành cảm ơn Quý khách đã lựa chọn <strong style="color:#8B6914;">${HOTEL_NAME}</strong>.<br>
        Chúc Quý khách có kỳ nghỉ tuyệt vời!
      </p>
      <div style="text-align:center;border-top:1px solid #eee;margin-top:12px;padding-top:12px;">
        <p style="font-weight:600;color:#333;margin:0;">Trân trọng,</p>
        <p style="font-weight:600;color:#333;margin:2px 0;">Bộ phận lễ tân – ${HOTEL_NAME}</p>
        <p style="margin:2px 0;">📞 ${HOTEL_PHONES}</p>
        <p style="margin:2px 0;">📧 ${HOTEL_EMAIL_DISPLAY}</p>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#bbb;margin-top:16px;">Số phiếu: ${invoiceNumber}</p>
  </div>
</div>
</body>
</html>`;
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

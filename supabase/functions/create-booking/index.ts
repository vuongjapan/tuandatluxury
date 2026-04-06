
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VA_BANK = "BIDV";
const VA_ACCOUNT = "96247TUANDATLUXURY";

function generateBookingCodePrefix(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `TD${year}${month}A`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      room_id, guest_name, guest_email, guest_phone, guest_notes, 
      check_in, check_out, guests_count, total_price_vnd, room_quantity, 
      language, combos, combo_total,
      // New promotion fields
      promotion_id, promotion_name, promotion_discount_percent, promotion_discount_amount,
      member_discount_percent, member_discount_amount,
      company_name, group_size, special_services, decoration_notes,
      original_price_vnd, discount_code, discount_code_amount, discount_code_type, discount_code_value,
    } = body;

    if (!room_id || !guest_name || !guest_phone || !check_in || !check_out) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate booking code
    const prefix = generateBookingCodePrefix();
    
    const { data: lastBookings } = await supabase
      .from("bookings")
      .select("booking_code")
      .like("booking_code", `${prefix}%`)
      .order("booking_code", { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastBookings && lastBookings.length > 0) {
      const lastCode = lastBookings[0].booking_code;
      const lastNum = parseInt(lastCode.slice(-5));
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    const bookingCode = `${prefix}${String(nextNumber).padStart(5, '0')}`;

    const totalPrice = total_price_vnd || 0;
    const depositAmount = Math.round(totalPrice * 0.5);
    const remainingAmount = totalPrice - depositAmount;

    const sepayQrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositAmount}&des=${encodeURIComponent(bookingCode)}`;

    // Insert booking with promotion data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        room_id,
        guest_name,
        guest_email,
        guest_phone,
        guest_notes,
        check_in,
        check_out,
        guests_count: guests_count || 2,
        total_price_vnd: totalPrice,
        original_price_vnd: original_price_vnd || totalPrice,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        room_quantity: room_quantity || 1,
        payment_status: "PENDING",
        status: "pending",
        language: language || "vi",
        sepay_va: VA_ACCOUNT,
        sepay_bank: VA_BANK,
        sepay_qr_url: sepayQrUrl,
        // Promotion fields
        promotion_id: promotion_id || null,
        promotion_name: promotion_name || null,
        promotion_discount_percent: promotion_discount_percent || 0,
        promotion_discount_amount: promotion_discount_amount || 0,
        member_discount_percent: member_discount_percent || 0,
        member_discount_amount: member_discount_amount || 0,
        company_name: company_name || null,
        group_size: group_size || null,
        special_services: special_services || null,
        decoration_notes: decoration_notes || null,
        discount_code: discount_code || null,
        discount_code_amount: discount_code_amount || 0,
        discount_code_type: discount_code_type || null,
        discount_code_value: discount_code_value || 0,
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert booking combos if any
    let comboDetails: any[] = [];
    if (combos && Array.isArray(combos) && combos.length > 0) {
      const comboInserts = combos.map((c: any) => ({
        booking_id: booking.id,
        dining_item_id: c.dining_item_id,
        combo_name: c.combo_name,
        price_vnd: c.price_vnd,
        quantity: c.quantity,
      }));

      const { data: insertedCombos, error: comboError } = await supabase
        .from("booking_combos")
        .insert(comboInserts)
        .select();

      if (comboError) {
        console.error("Combo insert error:", comboError);
      } else {
        comboDetails = insertedCombos || [];
      }
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        booking_id: booking.id,
        invoice_number: bookingCode,
        total_vnd: totalPrice,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        payment_status: "PENDING",
        status: "unpaid",
      })
      .select()
      .single();

    if (invoiceError) console.error("Invoice error:", invoiceError);

    // Get room name for email
    const { data: room } = await supabase
      .from("rooms")
      .select("name_vi")
      .eq("id", room_id)
      .single();

    // Send booking emails
    try {
      const emailUrl = `${supabaseUrl}/functions/v1/send-booking-email`;
      await fetch(emailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          booking,
          room_name: room?.name_vi || room_id,
          invoice_number: bookingCode,
          combos: combos || [],
          combo_total: combo_total || 0,
        }),
      });
      console.log("Email function called successfully");
    } catch (emailErr) {
      console.error("Email send error (non-blocking):", emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking,
        invoice,
        booking_code: bookingCode,
        combos: comboDetails,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-booking error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

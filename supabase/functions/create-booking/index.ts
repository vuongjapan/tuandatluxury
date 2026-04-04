
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { room_id, guest_name, guest_email, guest_phone, guest_notes, check_in, check_out, guests_count, total_price_vnd, room_quantity, language } = body;

    if (!room_id || !guest_name || !guest_phone || !check_in || !check_out) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate booking code with TDYYYYMMAXXXXX format
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

    // Insert booking
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
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        room_quantity: room_quantity || 1,
        payment_status: "PENDING",
        status: "pending",
        language: language || "vi",
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Create invoice with same code
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

    // Send booking emails (fire and forget)
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

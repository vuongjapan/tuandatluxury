
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { room_id, guest_name, guest_email, guest_phone, guest_notes, check_in, check_out, guests_count, total_price_vnd, language } = body;

    if (!room_id || !guest_name || !guest_phone || !check_in || !check_out) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const totalPrice = total_price_vnd || 0;
    const depositAmount = Math.round(totalPrice * 0.5);
    const remainingAmount = totalPrice - depositAmount;

    // Insert booking with deposit info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
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
        payment_status: "PENDING",
        status: "pending",
        language: language || "vi",
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Create invoice with deposit info
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        booking_id: booking.id,
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
          invoice_number: invoice?.invoice_number || booking.booking_code,
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
        booking_code: booking.booking_code,
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

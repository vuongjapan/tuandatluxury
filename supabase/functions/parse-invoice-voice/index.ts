import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "Missing transcript" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const today = new Date().toISOString().slice(0, 10);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Bạn là trợ lý parse thông tin đặt phòng từ tiếng nói tiếng Việt cho admin khách sạn.
Hôm nay là ${today}. Nếu khách nói "ngày mai", "thứ 7 này"... → tính ngày thực.
Trả về CHÍNH XÁC qua tool call extract_booking. Trường nào không nghe rõ → để null/0.`,
          },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_booking",
              description: "Trích xuất thông tin đơn đặt phòng",
              parameters: {
                type: "object",
                properties: {
                  guest_name: { type: ["string", "null"] },
                  guest_phone: { type: ["string", "null"] },
                  guest_email: { type: ["string", "null"] },
                  check_in: { type: ["string", "null"], description: "YYYY-MM-DD" },
                  check_out: { type: ["string", "null"], description: "YYYY-MM-DD" },
                  guests_count: { type: ["number", "null"] },
                  children_count: { type: ["number", "null"] },
                  room_name: { type: ["string", "null"], description: "Loại phòng (Standard/Deluxe/Suite/Family)" },
                  room_quantity: { type: ["number", "null"] },
                  room_price_per_night: { type: ["number", "null"] },
                  discount_amount: { type: ["number", "null"] },
                  discount_note: { type: ["string", "null"] },
                  deposit_percent: { type: ["number", "null"] },
                  notes: { type: ["string", "null"] },
                },
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_booking" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error", status: resp.status }), {
        status: resp.status === 429 || resp.status === 402 ? resp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-invoice-voice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

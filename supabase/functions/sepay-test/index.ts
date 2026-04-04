
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BA_XID = "0c8e5471-2dcf-11f1-b21a-a6006ab65aca";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("SEPAY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "SEPAY_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create order with VA
    const res = await fetch(`https://userapi.sepay.vn/v2/bank-accounts/${BA_XID}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_code: "TEST00001",
        amount: 5000,
        with_qrcode: "1",
        qrcode_template: "compact",
      }),
    });

    const text = await res.text();
    console.log("Create order response status:", res.status);
    console.log("Create order response:", text);

    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

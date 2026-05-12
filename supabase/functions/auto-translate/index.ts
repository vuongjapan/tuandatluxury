// Auto-translate edge function — dùng Lovable AI Gateway
// Input: { texts: Record<string,string>, targetLang: 'en'|'ja'|'zh' }
// Output: { translations: Record<string,string> }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese (日本語)",
  zh: "Simplified Chinese (简体中文)",
  ko: "Korean (한국어)",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { texts, targetLang } = await req.json();

    if (!texts || typeof texts !== "object" || !targetLang) {
      return new Response(
        JSON.stringify({ error: "Missing texts or targetLang" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const langName = LANG_NAMES[targetLang];
    if (!langName) {
      return new Response(
        JSON.stringify({ error: "Unsupported language: " + targetLang }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const keys = Object.keys(texts);
    if (keys.length === 0) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional translator for a luxury hotel website. Translate the Vietnamese values in the given JSON object into ${langName}.

Rules:
- Keep all keys EXACTLY the same.
- Translate only the string values.
- Keep numbers, prices (e.g. "1.500.000đ"), dates, phone numbers, emails, URLs, and brand names ("Tuấn Đạt Luxury") unchanged.
- Preserve any HTML/markdown markers exactly.
- Use a polished, hospitable tone fitting a 5-star hotel.
- Output ONLY a valid JSON object, no markdown fences, no commentary.`;

    const userPrompt = JSON.stringify(texts, null, 2);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500;
      return new Response(
        JSON.stringify({ error: "AI gateway error", detail: errText }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiRes.json();
    const raw: string = aiData?.choices?.[0]?.message?.content ?? "{}";

    let parsed: Record<string, string> = {};
    try {
      // Strip code fences if any
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (_e) {
      parsed = {};
    }

    // Fallback: keep VI for missing keys
    const translations: Record<string, string> = {};
    for (const k of keys) {
      const v = parsed[k];
      translations[k] = typeof v === "string" && v.trim() ? v : texts[k];
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// translate-batch — dịch 1 batch text qua Lovable AI Gateway
// Input: { items: { key: string, text: string }[], targetLang: 'en'|'ja'|'zh'|'ko' }
// Output: { translations: Record<key, translated> }

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { items, targetLang } = await req.json();
    if (!Array.isArray(items) || !targetLang || !LANG_NAMES[targetLang]) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (items.length === 0) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputObj: Record<string, string> = {};
    for (const it of items) {
      if (it && typeof it.key === "string" && typeof it.text === "string") {
        inputObj[it.key] = it.text;
      }
    }

    const langName = LANG_NAMES[targetLang];
    const systemPrompt = `You are a professional translator for a 5-star luxury hotel website (Tuấn Đạt Luxury, Sầm Sơn, Vietnam). Translate Vietnamese values in the JSON to ${langName}.

Rules:
- Keep all keys EXACTLY the same.
- Translate only the string values.
- Keep numbers, prices ("1.500.000đ"), dates, phone numbers, emails, URLs, brand names ("Tuấn Đạt Luxury", "FLC Sầm Sơn") unchanged.
- Preserve HTML/markdown markers exactly.
- Use a polished, hospitable tone fitting a 5-star hotel.
- Output ONLY a valid JSON object. No markdown fences, no commentary.`;

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
          { role: "user", content: JSON.stringify(inputObj, null, 2) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500;
      return new Response(JSON.stringify({ error: "AI gateway error", detail: errText }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const raw: string = aiData?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, string> = {};
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }

    const translations: Record<string, string> = {};
    for (const k of Object.keys(inputObj)) {
      const v = parsed[k];
      translations[k] = typeof v === "string" && v.trim() ? v : inputObj[k];
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

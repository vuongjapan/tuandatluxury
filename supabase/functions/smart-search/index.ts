// Smart Search AI — parses natural language travel queries → structured filter intent.
// Uses Lovable AI Gateway (Gemini 2.5 Pro) with tool calling for reliable JSON output.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Bạn là trợ lý tìm phòng cho khách sạn Tuấn Đạt Luxury (FLC Sầm Sơn).
Khách sẽ gõ ngôn ngữ tự nhiên (tiếng Việt hoặc tiếng Anh) mô tả nhu cầu nghỉ dưỡng.
Hãy trích xuất thông tin có cấu trúc và GỌI HÀM extract_intent.
Quy tắc:
- Nếu khách nói "5 triệu" = 5000000 VND, "1tr5" = 1500000 VND.
- Nếu khách nói "gần biển", "view biển", "sea view" → vibes phải có "sea_view".
- "honeymoon", "trăng mật", "cặp đôi" → "couple".
- "gia đình", "trẻ con", "trẻ nhỏ" → "family".
- "đoàn", "công ty", "nhóm đông" → "group".
- "cao cấp", "sang trọng", "luxury" → "luxury".
- "giá rẻ", "tiết kiệm" → "budget".
- Nếu không rõ field nào, để null/empty array.
- Số người và số đêm phải là số nguyên.
- Diễn giải ngắn gọn 1-2 câu bằng cùng ngôn ngữ với khách.`;

const TOOL_DEFINITION = {
  type: "function",
  function: {
    name: "extract_intent",
    description: "Trích xuất intent tìm phòng từ câu nói tự nhiên",
    parameters: {
      type: "object",
      properties: {
        guests: { type: "integer", description: "Số khách (người lớn + trẻ em)" },
        nights: { type: "integer", description: "Số đêm (nếu khách nói '2 ngày 1 đêm' thì nights=1)" },
        budget_total: { type: "number", description: "Tổng ngân sách VND (cho cả chuyến). 0 nếu không nêu." },
        budget_tier: {
          type: "string",
          enum: ["any", "under_500k", "500k_1m", "1m_2m", "luxury"],
          description: "Mức giá MỖI ĐÊM ưu tiên",
        },
        vibes: {
          type: "array",
          items: {
            type: "string",
            enum: ["sea_view", "couple", "family", "group", "luxury", "budget", "business", "relax"],
          },
        },
        explanation: {
          type: "string",
          description: "Diễn giải ngắn (1-2 câu) bằng ngôn ngữ khách dùng",
        },
      },
      required: ["explanation", "vibes", "budget_tier"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
        tools: [TOOL_DEFINITION],
        tool_choice: { type: "function", function: { name: "extract_intent" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "no_intent" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const intent = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ intent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

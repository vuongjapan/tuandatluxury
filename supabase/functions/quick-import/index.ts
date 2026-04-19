// Quick Import Sam Son — AI batch classification
// Input: { items: string[], default_status?: 'active' | 'needs_review' }
// Output: { results: Array<{ type, name, slug, zone, price_tier, tags, description, status }> }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Bạn là chuyên gia du lịch Sầm Sơn, Thanh Hoá. Phân loại danh sách địa điểm thành dữ liệu chuẩn JSON.

Với mỗi item, xác định:
- type: 'hotel' | 'restaurant' | 'cafe' | 'attraction'
- name: tên chuẩn hoá tiếng Việt
- slug: kebab-case không dấu
- zone: 1 trong: 'bai_a', 'bai_b', 'bai_c', 'flc', 'trung_tam', 'quang_truong', 'cho_dem', 'yen_tinh', 'luxury'
- price_tier: 'budget' | 'mid' | 'premium' | 'luxury'
- tags: 3-6 tag tiếng Việt không dấu (vd: gan_bien, gia_dinh, view_dep, hai_san, view_bien, check_in)
- description: mô tả 15-25 từ tiếng Việt
- status: 'active' nếu chắc chắn, 'needs_review' nếu không chắc

Nếu là khách sạn lớn nổi tiếng (FLC, Vinpearl, Mường Thanh): luxury_level cao.
Cafe: ưu tiên đánh dấu sea_view nếu tên gợi ý gần biển.
Trả về MẢNG JSON đầy đủ, không thiếu item nào.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'items required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batch = items.slice(0, 25).map((s: string) => String(s).trim()).filter(Boolean);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Phân loại ${batch.length} địa điểm sau:\n${batch.map((b, i) => `${i + 1}. ${b}`).join('\n')}` },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_places',
            description: 'Trả về mảng đầy đủ các địa điểm đã phân loại',
            parameters: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['hotel', 'restaurant', 'cafe', 'attraction'] },
                      name: { type: 'string' },
                      slug: { type: 'string' },
                      zone: { type: 'string' },
                      price_tier: { type: 'string', enum: ['budget', 'mid', 'premium', 'luxury'] },
                      tags: { type: 'array', items: { type: 'string' } },
                      description: { type: 'string' },
                      status: { type: 'string', enum: ['active', 'needs_review'] },
                    },
                    required: ['type', 'name', 'slug', 'zone', 'price_tier', 'tags', 'description', 'status'],
                  },
                },
              },
              required: ['results'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'classify_places' } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'credits_exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error('AI gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'ai_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: 'no_tool_call' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ results: parsed.results || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('quick-import error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

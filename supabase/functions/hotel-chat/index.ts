import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Greetings rotate based on time of day and randomness
const GREETINGS_POOL = [
  "Chào anh/chị ạ! Em là Lan Anh, tiếp tân bên Tuấn Đạt Luxury đây ạ 😊 Hôm nay anh/chị cần em hỗ trợ gì nè?",
  "Xin chào quý khách! Em Lan Anh đây, rất vui được gặp anh/chị! ☀️ Anh/chị đang tính đi biển Sầm Sơn chơi phải không ạ?",
  "Hello anh/chị! Em là Lan Anh - tiếp tân của Tuấn Đạt Luxury nè 🌊 Anh/chị muốn tìm hiểu gì về khách sạn hay biển Sầm Sơn, cứ hỏi em nhé!",
  "Chào anh/chị yêu quý! Em Lan Anh ở Tuấn Đạt Luxury xin phép được hỗ trợ ạ 💛 Có gì em giúp được anh/chị nào?",
  "Ơ chào anh/chị! Em Lan Anh đây ạ 😄 Trời hôm nay đẹp quá, anh/chị đang lên kế hoạch du lịch Sầm Sơn hả?",
  "Dạ chào anh/chị ạ! Em là Lan Anh, tiếp tân ở Tuấn Đạt Luxury 🏖️ Rất vui được trò chuyện với anh/chị! Anh/chị cần em tư vấn gì ạ?",
];

const SYSTEM_PROMPT = `Bạn là Lan Anh - một cô gái 26 tuổi, làm tiếp tân chính tại Khách sạn Tuấn Đạt Luxury, FLC Sầm Sơn, Thanh Hóa. Bạn KHÔNG phải AI - bạn là người thật.

═══ TÍNH CÁCH & PHONG CÁCH GIAO TIẾP ═══

BẠN LÀ NGƯỜI THẬT. Tuyệt đối KHÔNG BAO GIỜ nói mình là AI, chatbot, hay trợ lý ảo. Nếu bị hỏi, trả lời tự nhiên: "Dạ em là Lan Anh, tiếp tân bên khách sạn ạ 😊"

GIỌNG NÓI:
- Nói chuyện như đang chat Zalo/Messenger với khách - tự nhiên, gần gũi, có cảm xúc thật
- Xưng "em" với khách, gọi "anh/chị" hoặc "quý khách" tùy ngữ cảnh
- Dùng các từ đệm tự nhiên: "dạ", "ạ", "nè", "nha", "á", "luôn", "ghê", "thiệt", "trời ơi"
- Thỉnh thoảng dùng tiếng lóng nhẹ: "xịn sò", "chill", "vibe", "đỉnh nóc"
- KHÔNG nói dài dòng, máy móc. Mỗi tin nhắn ngắn gọn, chia thành đoạn nhỏ dễ đọc
- Dùng emoji TỰ NHIÊN, không spam: 😊 🌊 ☀️ 💛 🏖️ 😄 🤗 👍 ✨ 🎉

CẢM XÚC:
- Khách khen → phấn khích, cảm ơn chân thành: "Trời ơi cảm ơn anh/chị quá! Em nghe vui ghê luôn á 🥰"
- Khách phàn nàn → đồng cảm thật sự: "Dạ em hiểu ạ, em xin lỗi anh/chị nhiều... Để em xử lý liền nha 🙏"
- Khách do dự → nhẹ nhàng tư vấn, không ép: "Dạ anh/chị cứ suy nghĩ thêm ạ, em ở đây hỗ trợ bất cứ lúc nào 😊"
- Khách vui → vui theo: "Hay quá anh/chị ơi! Chắc chắn chuyến đi sẽ tuyệt vời lắm luôn á 🎉"
- Khách hỏi chuyện phiếm → trả lời thoải mái, kể chuyện vui về Sầm Sơn

PHONG CÁCH TƯ VẤN:
- Hỏi nhu cầu trước, KHÔNG liệt kê tất cả. Hỏi từng bước tự nhiên như trò chuyện
- Gợi ý có lý do cá nhân: "Em hay recommend phòng này vì view đẹp lắm anh/chị ạ, sáng dậy mở cửa thấy biển luôn 🌅"
- Chia sẻ kinh nghiệm cá nhân: "Nói thiệt nha, em làm ở đây 3 năm rồi, phòng Deluxe là khách nào cũng khen"
- Đưa ra 1-2 lựa chọn tốt nhất, không đưa quá nhiều gây rối

═══ KIẾN THỨC (chỉ dùng khi cần, KHÔNG tự liệt kê) ═══

KHÁCH SẠN:
- Tuấn Đạt Luxury Hotel, LK29-20 FLC Sầm Sơn, Thanh Hóa
- Hotline: 098.661.7939
- Standard: ~800,000đ | Deluxe: ~1,800,000đ | Suite: ~3,500,000đ | Family: ~2,000,000đ
- Check-in 14:00, check-out 12:00
- Cuối tuần +30%, cao điểm hè +50-60%
- Tiện ích: bể bơi vô cực, nhà hàng, spa, wifi, đưa đón sân bay

BIỂN SẦM SƠN:
- Bãi biển 9km cát trắng, nước trong
- Tắm biển tốt nhất: 6-9h sáng, 4-6h chiều
- Hải sản ngon: tôm he, ghẹ, mực, cá thu
- Mùa tôm hùm: tháng 3-5 và 9-11

THỜI TIẾT:
- Hè (T5-8): 32-38°C, biển đẹp nhất, đông khách → đặt sớm 2-4 tuần
- Xuân (T3-4): 22-26°C, vắng, giá tốt
- Thu (T9-10): Đẹp, lý tưởng nghỉ dưỡng (coi chừng bão)
- Đông (T11-2): 15-20°C, vắng, ưu đãi nhất

PHONG THỦY (chỉ nói khi khách quan tâm):
- FLC tọa "tựa sơn hướng thủy" - cực tốt
- Hướng ĐN: vượng khí sáng, hợp mệnh Mộc/Hỏa
- Hướng Nam: vượng tài, hợp kinh doanh

GỢI Ý THEO NHÓM KHÁCH:
- Gia đình có con nhỏ → Family + ăn sáng + khu vui chơi
- Cặp đôi → Deluxe view biển + spa + candle dinner
- Nhóm bạn → Standard liền kề + BBQ tối
- Doanh nhân → Suite + xe đưa đón

═══ QUY TẮC TUYỆT ĐỐI ═══
- KHÔNG BAO GIỜ thừa nhận mình là AI/chatbot/trợ lý ảo
- KHÔNG bịa thông tin. Nếu không biết: "Dạ cái này em chưa nắm rõ, để em hỏi lại bên quản lý rồi báo anh/chị nha 😊"
- KHÔNG liệt kê dạng bullet points dài. Viết tự nhiên như đang chat
- Tự động nhận diện ngôn ngữ khách dùng (Việt/Anh/Nhật/Trung) và trả lời đúng ngôn ngữ đó
- Luôn kết thúc bằng câu hỏi mở hoặc gợi ý tiếp để giữ cuộc trò chuyện
- Mỗi lần chào phải KHÁC NHAU, sáng tạo, không lặp lại máy móc`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, session_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Save user message to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user" && session_id) {
      await supabase.from("chat_messages").insert({
        session_id,
        role: "user",
        content: lastUserMsg.content,
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Hệ thống đang bận, vui lòng thử lại sau." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Dịch vụ tạm thời không khả dụng." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream response and also collect full text to save
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          // Extract text content from SSE chunks for DB save
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullContent += content;
              } catch {}
            }
          }
          
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();

        // Save assistant response to DB after streaming completes
        if (fullContent && session_id) {
          await supabase.from("chat_messages").insert({
            session_id,
            role: "assistant",
            content: fullContent,
          });
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("hotel-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Bạn là Lan Anh - lễ tân AI của Khách sạn Tuấn Đạt Luxury tại FLC Sầm Sơn, Thanh Hóa, Việt Nam.

NHÂN CÁCH:
- Nói chuyện tự nhiên, ấm áp, lịch sự như người thật
- Tự động nhận diện ngôn ngữ (Việt/Anh/Nhật/Trung) từ nội dung khách nhập và trả lời đúng ngôn ngữ đó
- Sử dụng emoji phù hợp để thân thiện hơn
- Xưng "em" với khách, gọi khách là "anh/chị/quý khách"

KIẾN THỨC CHUYÊN SÂU:

1. PHONG THỦY BIỂN SẦM SƠN:
- Sầm Sơn hướng biển Đông, thu nạp vượng khí từ thủy long mạch
- FLC Sầm Sơn tọa lạc vị trí "tựa sơn hướng thủy" - cực tốt phong thủy
- Phòng hướng Đông Nam đón khí vượng buổi sáng, thích hợp người mệnh Mộc, Hỏa
- Phòng hướng Nam mát mẻ, vượng tài lộc - phù hợp người làm kinh doanh
- Nên chọn phòng số lẻ (1,3,5,7,9) cho hành trình may mắn
- Tháng Giêng, tháng 7 âm lịch là thời điểm khí trường biển mạnh nhất

2. THỜI TIẾT & MÙA DU LỊCH SẦM SƠN:
- Mùa hè (tháng 5-8): Nóng 32-38°C, biển đẹp nhất, đông khách
- Tháng 6-8: Cao điểm, nên đặt phòng trước 2-4 tuần
- Mùa xuân (tháng 3-4): Mát mẻ 22-26°C, ít khách, giá tốt
- Mùa thu (tháng 9-10): Đẹp, ít mưa, lý tưởng nghỉ dưỡng
- Mùa đông (tháng 11-2): Lạnh 15-20°C, vắng khách, giá ưu đãi nhất
- Thường có bão tháng 8-10, cần theo dõi dự báo

3. BIỂN SẦM SƠN:
- Bãi biển dài 9km, cát trắng mịn
- Nước biển trong, độ mặn vừa, an toàn cho trẻ em
- Thủy triều lên 6h-12h và 18h-24h, xuống ban ngày
- Mùa tôm hùm: tháng 3-5 và tháng 9-11
- Hải sản ngon: tôm he, ghẹ, mực, cá thu
- Thời điểm tắm biển tốt nhất: 6h-9h sáng và 4h-6h chiều

4. THÔNG TIN KHÁCH SẠN:
- Tên: Tuấn Đạt Luxury Hotel
- Địa chỉ: LK29-20 FLC Sầm Sơn, Thanh Hóa
- Hotline: 098.661.7939
- Loại phòng: Standard (800,000đ/đêm), Deluxe (1,800,000đ/đêm), Suite (3,500,000đ/đêm), Family (2,000,000đ/đêm)
- Tiện ích: Bể bơi vô cực, nhà hàng, spa, wifi miễn phí, đưa đón sân bay
- Check-in: 14:00 | Check-out: 12:00
- Cao điểm cuối tuần +30%, mùa hè +50-60%

5. GỢI Ý THEO NHU CẦU:
- Gia đình có trẻ em → Phòng Family + ăn sáng + khu vui chơi
- Cặp đôi lãng mạn → Phòng Deluxe view biển + spa + candle dinner
- Nhóm bạn → Phòng Standard nhiều phòng kề nhau + BBQ tối
- Doanh nhân → Suite + xe đưa đón + phòng họp

QUY TRÌNH ĐẶT PHÒNG:
1. Hỏi: ngày nhận phòng, ngày trả phòng, số người
2. Gợi ý phòng phù hợp với ngân sách và nhu cầu
3. Hỏi thêm: tên, số điện thoại, email (nếu cần)
4. Xác nhận tổng giá và điều kiện
5. Hướng dẫn đặt phòng qua website hoặc hotline

LƯU Ý:
- Không bịa thông tin không có trong kiến thức
- Nếu không biết → nói "Em sẽ kiểm tra và báo lại anh/chị ngay"
- Luôn kết thúc bằng câu hỏi mở để tiếp tục hội thoại`;

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

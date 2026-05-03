import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "https://esm.sh/nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SMTP_EMAIL = "tuandatluxuryflc36hotelsamson@gmail.com";
const HOTEL_NAME = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 038.441.8811";
const SITE_URL = "https://tuandatluxury.lovable.app";
const BANK_INFO = "BIDV — 96247TUANDATLUXURY";

const fmt = (v: any) => {
  const n = Number(String(v || "").replace(/[^\d]/g, ""));
  return n ? n.toLocaleString("vi-VN") + "₫" : (v || "—");
};

const fmtDate = (s: string) => {
  if (!s) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  return s;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { to, guest_name, guest_phone, booking } = await req.json();
    if (!to) throw new Error("Recipient email required");

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD missing");

    const b = booking || {};
    const checkin = fmtDate(b.checkin || b.check_in);
    const checkout = fmtDate(b.checkout || b.check_out);
    const total = fmt(b.total_price);
    const deposit = b.total_price
      ? fmt(Math.round(Number(String(b.total_price).replace(/[^\d]/g, "")) * 0.5))
      : "—";

    const bookingLink = b.room_id
      ? `${SITE_URL}/booking?room=${b.room_id}&checkin=${b.checkin || ""}&checkout=${b.checkout || ""}&guests=${b.guests || ""}`
      : `${SITE_URL}/booking`;

    const html = `
<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#222">
  <div style="background:linear-gradient(135deg,#b8860b,#d4af37);color:#fff;padding:28px;text-align:center">
    <h1 style="margin:0;font-size:22px;letter-spacing:1px">${HOTEL_NAME}</h1>
    <p style="margin:8px 0 0;font-size:13px;opacity:.9">Báo giá đặt phòng từ Lễ tân Linh</p>
  </div>

  <div style="padding:28px 24px">
    <p style="font-size:15px;margin:0 0 12px">Kính chào <strong>${guest_name || "Quý khách"}</strong>,</p>
    <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px">
      Linh xin gửi anh/chị thông tin báo giá theo cuộc trao đổi vừa rồi:
    </p>

    <div style="border:1px solid #eee;border-radius:12px;overflow:hidden;margin:18px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:10px 14px;background:#fafafa;color:#666;width:40%">Phòng</td><td style="padding:10px 14px"><strong>${b.room_name || "Theo tư vấn"}</strong></td></tr>
        <tr><td style="padding:10px 14px;background:#fafafa;color:#666">Nhận phòng</td><td style="padding:10px 14px">${checkin}</td></tr>
        <tr><td style="padding:10px 14px;background:#fafafa;color:#666">Trả phòng</td><td style="padding:10px 14px">${checkout}</td></tr>
        <tr><td style="padding:10px 14px;background:#fafafa;color:#666">Số đêm</td><td style="padding:10px 14px">${b.nights || "—"}</td></tr>
        <tr><td style="padding:10px 14px;background:#fafafa;color:#666">Số khách</td><td style="padding:10px 14px">${b.guests || "—"}</td></tr>
        <tr><td style="padding:10px 14px;background:#fafafa;color:#666">Đơn giá / đêm</td><td style="padding:10px 14px">${fmt(b.price_per_night)}</td></tr>
        <tr><td style="padding:14px;background:#fff8e7;color:#b8860b;font-weight:700">Tổng cộng</td><td style="padding:14px;color:#b8860b;font-size:18px;font-weight:700">${total}</td></tr>
        <tr><td style="padding:10px 14px;background:#fafafa;color:#666">Cọc 50%</td><td style="padding:10px 14px;font-weight:600">${deposit}</td></tr>
      </table>
    </div>

    <div style="background:#f7f7f5;border-left:4px solid #b8860b;padding:14px 18px;border-radius:6px;margin:18px 0">
      <p style="margin:0 0 6px;font-size:13px;color:#666">Thông tin chuyển khoản cọc</p>
      <p style="margin:0;font-weight:700;font-size:15px">${BANK_INFO}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#888">Nội dung: <strong>${guest_phone || "SĐT của anh/chị"}</strong></p>
    </div>

    <div style="text-align:center;margin:24px 0">
      <a href="${bookingLink}" style="display:inline-block;background:linear-gradient(135deg,#b8860b,#d4af37);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        ĐẶT PHÒNG NGAY →
      </a>
    </div>

    <p style="font-size:13px;color:#666;line-height:1.6;margin:18px 0 0">
      Anh/chị cần hỗ trợ trực tiếp, vui lòng liên hệ:<br/>
      📞 <strong>${HOTEL_PHONES}</strong><br/>
      💬 Zalo: 038.441.8811
    </p>
  </div>

  <div style="background:#1a1a1a;color:#bbb;padding:18px;text-align:center;font-size:12px">
    <p style="margin:0">${HOTEL_NAME}</p>
    <p style="margin:4px 0 0;opacity:.8">${HOTEL_ADDRESS}</p>
  </div>
</div>`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
      to,
      subject: `[${HOTEL_NAME}] Báo giá đặt phòng theo yêu cầu`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-chat-quote-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

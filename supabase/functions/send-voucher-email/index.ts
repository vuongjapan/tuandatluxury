import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, voucher_code, recipient_email, recipient_name, note } = await req.json();
    if (!voucher_code) throw new Error("voucher_code required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lấy thông tin voucher
    const { data: voucher, error: vErr } = await supabase
      .from("voucher_codes")
      .select("*")
      .eq("code", voucher_code)
      .maybeSingle();
    if (vErr || !voucher) throw new Error("Voucher not found");

    // Lấy email/tên khách (ưu tiên override, fallback profile)
    let toEmail = (recipient_email || "").trim();
    let toName = (recipient_name || "").trim();
    if ((!toEmail || !toName) && user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", user_id)
        .maybeSingle();
      if (profile) {
        if (!toEmail) toEmail = profile.email || "";
        if (!toName) toName = profile.full_name || "";
      }
    }
    if (!toEmail) throw new Error("Không có email người nhận");

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD missing");

    const discountText =
      voucher.discount_type === "percent"
        ? `Giảm ${voucher.discount_value}%`
        : `Giảm ${fmt(voucher.discount_value)}`;
    const expireText = voucher.end_date
      ? new Date(voucher.end_date).toLocaleDateString("vi-VN")
      : "Không thời hạn";

    const html = `
<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#222">
  <div style="background:linear-gradient(135deg,#b8860b,#d4af37);color:#fff;padding:28px;text-align:center">
    <h1 style="margin:0;font-size:22px;letter-spacing:1px">${HOTEL_NAME}</h1>
    <p style="margin:8px 0 0;font-size:13px;opacity:.9">Quà tặng dành riêng cho bạn</p>
  </div>

  <div style="padding:28px 24px">
    <p style="font-size:15px;margin:0 0 12px">Xin chào <strong>${toName || "Quý khách"}</strong>,</p>
    <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px">
      Chúng tôi xin gửi tặng bạn một mã ưu đãi đặc biệt — như một lời tri ân cho sự đồng hành cùng ${HOTEL_NAME}.
    </p>

    <div style="border:2px dashed #d4af37;background:#fffaf0;padding:24px;text-align:center;border-radius:12px;margin:20px 0">
      <p style="margin:0 0 6px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px">Mã voucher của bạn</p>
      <p style="font-family:monospace;font-size:32px;font-weight:700;color:#b8860b;margin:8px 0;letter-spacing:2px">${voucher.code}</p>
      <p style="margin:8px 0 0;font-size:18px;color:#222;font-weight:600">${discountText}</p>
      ${voucher.campaign_name ? `<p style="margin:6px 0 0;font-size:13px;color:#666">${voucher.campaign_name}</p>` : ""}
      <p style="margin:12px 0 0;font-size:12px;color:#999">Hạn sử dụng: <strong style="color:#b8860b">${expireText}</strong></p>
    </div>

    ${note ? `<div style="background:#f7f7f7;padding:14px;border-left:3px solid #d4af37;border-radius:4px;margin:16px 0;font-size:13px;color:#555;font-style:italic">📝 ${note}</div>` : ""}

    <div style="text-align:center;margin:28px 0">
      <a href="${SITE_URL}/account?tab=vouchers" style="display:inline-block;background:#b8860b;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">Xem trong tài khoản</a>
    </div>

    <p style="font-size:12px;color:#999;line-height:1.6;margin:20px 0 0">
      Cách dùng: nhập mã <strong style="color:#b8860b">${voucher.code}</strong> tại bước thanh toán khi đặt phòng trên website.
    </p>
  </div>

  <div style="background:#f7f7f7;padding:18px 24px;border-top:1px solid #eee;text-align:center;color:#888;font-size:12px;line-height:1.6">
    <p style="margin:0"><strong>${HOTEL_NAME}</strong></p>
    <p style="margin:4px 0">${HOTEL_ADDRESS}</p>
    <p style="margin:4px 0">${HOTEL_PHONES}</p>
  </div>
</div>`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
      to: toEmail,
      subject: `🎁 Quà tặng từ ${HOTEL_NAME} — ${discountText}`,
      html,
    });

    // Cập nhật trạng thái notified trên member_vouchers nếu có user_id
    if (user_id) {
      await supabase
        .from("member_vouchers")
        .update({ notified: true, notified_at: new Date().toISOString() })
        .eq("user_id", user_id)
        .eq("voucher_code", voucher_code);
    }

    return new Response(
      JSON.stringify({ success: true, sent_to: toEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("send-voucher-email error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

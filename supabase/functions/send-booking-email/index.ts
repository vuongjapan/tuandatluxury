
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_EMAIL = "dovuong.bka@gmail.com";
const ADMIN_EMAIL = "tuandatluxuryflc36hotel@gmail.com";
const HOTEL_NAME = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa, Việt Nam";
const HOTEL_PHONES = "098.360.7568 | 036.984.5422 | 098.661.7939";
const HOTEL_EMAIL_DISPLAY = "tuandatluxuryflc36hotel@gmail.com";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

function buildInvoiceHtml(booking: any, roomName: string, invoiceNumber: string): string {
  const checkIn = formatDate(booking.check_in);
  const checkOut = formatDate(booking.check_out);
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  );
  const pricePerNight = nights > 0 ? Math.round(booking.total_price_vnd / nights) : 0;

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#8B6914,#C49B2A,#8B6914);padding:28px 24px;text-align:center;color:#fff;">
    <div style="font-size:16px;margin-bottom:4px;">📋</div>
    <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:1px;">PHIẾU XÁC NHẬN ĐẶT PHÒNG</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">BOOKING CONFIRMATION</p>
    <div style="margin-top:16px;text-align:left;font-size:13px;line-height:1.6;opacity:0.9;">
      <p style="margin:2px 0;"><strong>Khách sạn:</strong> ${HOTEL_NAME}</p>
      <p style="margin:2px 0;"><strong>Địa chỉ:</strong> ${HOTEL_ADDRESS}</p>
      <p style="margin:2px 0;"><strong>Hotline:</strong> ${HOTEL_PHONES}</p>
      <p style="margin:2px 0;"><strong>Email:</strong> ${HOTEL_EMAIL_DISPLAY}</p>
    </div>
  </div>
  <div style="padding:24px;">
    <div style="background:#f8f6f0;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Mã đặt phòng</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#8B6914;letter-spacing:3px;">${booking.booking_code}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#999;">Lưu mã này để tra cứu đặt phòng</p>
    </div>
    <div style="background:#f8f6f0;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:600;color:#888;font-size:13px;">Trạng thái thanh toán</span>
      <span style="background:#FEF3C7;color:#D97706;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">⏳ Chưa thanh toán</span>
    </div>
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Thông tin khách</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Họ tên:</td><td style="font-weight:500;">${booking.guest_name}</td></tr>
      <tr><td style="color:#888;">Số điện thoại:</td><td style="font-weight:500;">📞 ${booking.guest_phone}</td></tr>
      ${booking.guest_email ? `<tr><td style="color:#888;">Email:</td><td style="font-weight:500;">📧 ${booking.guest_email}</td></tr>` : ""}
    </table>
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Thông tin đặt phòng</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Loại phòng:</td><td style="font-weight:500;">${roomName}</td></tr>
      <tr><td style="color:#888;">Số khách:</td><td style="font-weight:500;">${booking.guests_count} người</td></tr>
      <tr><td style="color:#888;">Ngày nhận phòng:</td><td style="font-weight:500;">${checkIn}</td></tr>
      <tr><td style="color:#888;">Ngày trả phòng:</td><td style="font-weight:500;">${checkOut}</td></tr>
      <tr><td style="color:#888;">Tổng số đêm:</td><td style="font-weight:500;">${nights} đêm</td></tr>
    </table>
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Chi phí</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Giá phòng / đêm:</td><td style="font-weight:500;">${formatPrice(pricePerNight)}</td></tr>
      <tr><td style="color:#888;">Tổng tiền:</td><td style="font-weight:700;color:#8B6914;font-size:15px;">${formatPrice(booking.total_price_vnd)}</td></tr>
      <tr><td style="color:#888;">Đã đặt cọc:</td><td style="font-weight:500;">0₫</td></tr>
      <tr><td style="color:#888;">Còn lại khi nhận phòng:</td><td style="font-weight:700;color:#8B6914;">${formatPrice(booking.total_price_vnd)}</td></tr>
    </table>
    ${booking.guest_notes ? `
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Ghi chú</h3>
    <p style="background:#f8f6f0;border-radius:8px;padding:12px;font-size:13px;margin:0;">${booking.guest_notes}</p>
    ` : ""}
    <div style="border-top:1px solid #eee;margin-top:20px;padding-top:16px;font-size:12px;color:#999;line-height:1.6;">
      <p>⏰ <strong style="color:#666;">Khách sạn sẽ giữ phòng đến 18:00 ngày nhận phòng.</strong><br>
      Nếu có thay đổi hoặc hủy phòng, vui lòng liên hệ trước để được hỗ trợ.</p>
      <p style="text-align:center;margin-top:12px;">
        Xin chân thành cảm ơn Quý khách đã lựa chọn <strong style="color:#8B6914;">${HOTEL_NAME}</strong>.<br>
        Chúc Quý khách có kỳ nghỉ tuyệt vời!
      </p>
      <div style="text-align:center;border-top:1px solid #eee;margin-top:12px;padding-top:12px;">
        <p style="font-weight:600;color:#333;margin:0;">Trân trọng,</p>
        <p style="font-weight:600;color:#333;margin:2px 0;">Bộ phận lễ tân – ${HOTEL_NAME}</p>
        <p style="margin:2px 0;">📞 ${HOTEL_PHONES}</p>
        <p style="margin:2px 0;">📧 ${HOTEL_EMAIL_DISPLAY}</p>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#bbb;margin-top:16px;">Số phiếu: ${invoiceNumber}</p>
  </div>
</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking, room_name, invoice_number } = await req.json();
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpPassword) {
      throw new Error("SMTP_PASSWORD not configured");
    }

    const invoiceHtml = buildInvoiceHtml(booking, room_name, invoice_number);

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: {
        user: SMTP_EMAIL,
        pass: smtpPassword,
      },
    });

    // Send to guest if email provided
    if (booking.guest_email) {
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: booking.guest_email,
        subject: `Xác nhận đơn đặt phòng – ${HOTEL_NAME} [${booking.booking_code}]`,
        html: invoiceHtml,
      });
      console.log("Guest email sent to:", booking.guest_email);
    }

    // Admin email with alert header
    const adminHtml = `
<div style="max-width:600px;margin:0 auto;padding:0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:#DC2626;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;text-align:center;">
    <h2 style="margin:0;font-size:18px;">🔔 Có đơn đặt phòng mới – ${HOTEL_NAME}</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Đơn hàng từ website · Chưa thanh toán</p>
  </div>
  ${invoiceHtml}
</div>`;

    await transporter.sendMail({
      from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🔔 Đơn đặt phòng mới từ website [${booking.booking_code}] - ${booking.guest_name}`,
      html: adminHtml,
    });
    console.log("Admin email sent to:", ADMIN_EMAIL);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-booking-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

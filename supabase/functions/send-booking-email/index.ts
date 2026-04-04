
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_EMAIL = "tuandatluxuryflc36hotelsamson@gmail.com";
const ADMIN_EMAIL = "tuandatluxuryflc36hotel@gmail.com";
const HOTEL_NAME = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa, Việt Nam";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 098.661.7939";
const HOTEL_EMAIL_DISPLAY = "tuandatluxuryflc36hotel@gmail.com";

const VA_BANK = "BIDV";
const VA_ACCOUNT = "96247TUANDATLUXURY";
const VA_HOLDER = "VAN DINH GIANG";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

function buildBookingInvoiceHtml(booking: any, roomName: string, invoiceNumber: string, combos?: any[], comboTotal?: number): string {
  const checkIn = formatDate(booking.check_in);
  const checkOut = formatDate(booking.check_out);
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  );
  const roomQty = booking.room_quantity || 1;
  const actualComboTotal = comboTotal || 0;
  const roomPrice = booking.total_price_vnd - actualComboTotal;
  const pricePerNight = nights > 0 && roomQty > 0 ? Math.round(roomPrice / nights / roomQty) : 0;
  const depositAmount = booking.deposit_amount || Math.round(booking.total_price_vnd * 0.5);
  const remainingAmount = booking.remaining_amount || (booking.total_price_vnd - depositAmount);
  const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositAmount}&des=${encodeURIComponent(booking.booking_code)}`;

  let comboHtml = '';
  if (combos && combos.length > 0) {
    const comboRows = combos.map((c: any) =>
      `<tr><td style="padding:4px 0;border-bottom:1px solid #f0f0f0;">${c.combo_name} × ${c.quantity}</td><td style="text-align:right;padding:4px 0;border-bottom:1px solid #f0f0f0;font-weight:500;">${formatPrice(c.price_vnd * c.quantity)}</td></tr>`
    ).join('');
    comboHtml = `
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">🍽️ Combo ăn uống</h3>
    <table style="width:100%;font-size:13px;">${comboRows}
      <tr><td style="padding:4px 0;font-weight:600;">Tổng combo:</td><td style="text-align:right;padding:4px 0;font-weight:700;color:#8B6914;">${formatPrice(actualComboTotal)}</td></tr>
    </table>`;
  }

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
    </div>
    <div style="background:#FEF3C7;border-radius:10px;padding:12px 16px;margin-bottom:20px;text-align:center;">
      <span style="color:#D97706;font-weight:700;font-size:14px;">⏳ CHƯA THANH TOÁN</span>
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
      <tr><td style="color:#888;">Số phòng:</td><td style="font-weight:500;">${roomQty}</td></tr>
      <tr><td style="color:#888;">Số khách:</td><td style="font-weight:500;">${booking.guests_count} người</td></tr>
      <tr><td style="color:#888;">Ngày nhận phòng:</td><td style="font-weight:500;">${checkIn}</td></tr>
      <tr><td style="color:#888;">Ngày trả phòng:</td><td style="font-weight:500;">${checkOut}</td></tr>
      <tr><td style="color:#888;">Tổng số đêm:</td><td style="font-weight:500;">${nights} đêm</td></tr>
    </table>
    ${comboHtml}
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Chi phí</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Giá phòng / đêm:</td><td style="font-weight:500;">${formatPrice(pricePerNight)}</td></tr>
      ${roomQty > 1 ? `<tr><td style="color:#888;">Số phòng × Số đêm:</td><td style="font-weight:500;">${roomQty} × ${nights}</td></tr>` : ""}
      <tr><td style="color:#888;">Tổng tiền:</td><td style="font-weight:700;color:#8B6914;font-size:15px;">${formatPrice(booking.total_price_vnd)}</td></tr>
      <tr><td style="color:#888;">Tiền cọc (50%):</td><td style="font-weight:700;color:#D97706;">${formatPrice(depositAmount)}</td></tr>
      <tr><td style="color:#888;">Còn lại khi nhận phòng:</td><td style="font-weight:700;color:#8B6914;">${formatPrice(remainingAmount)}</td></tr>
    </table>
    <div style="background:#FEF3C7;border:2px dashed #F59E0B;border-radius:10px;padding:16px;margin-top:20px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#92400E;text-align:center;">💳 THANH TOÁN ĐẶT CỌC</p>
      <table style="width:100%;font-size:13px;line-height:1.8;margin-bottom:12px;">
        <tr><td style="color:#92400E;width:45%;">🏦 Ngân hàng:</td><td style="font-weight:700;">${VA_BANK}</td></tr>
        <tr><td style="color:#92400E;">👤 Chủ tài khoản:</td><td style="font-weight:700;">${VA_HOLDER}</td></tr>
        <tr><td style="color:#92400E;">🔢 Số tài khoản (VA):</td><td style="font-weight:700;">${VA_ACCOUNT}</td></tr>
      </table>
      <div style="text-align:center;">
        <img src="${qrUrl}" alt="QR Thanh toán SePay" style="width:200px;height:auto;border-radius:8px;margin-bottom:12px;" />
      </div>
      <div style="text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#92400E;">📌 Nội dung chuyển khoản:</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#8B6914;letter-spacing:2px;">${booking.booking_code}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#92400E;">💰 Số tiền cần chuyển:</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#DC2626;">${formatPrice(depositAmount)}</p>
      </div>
    </div>
    <div style="border-top:1px solid #eee;margin-top:20px;padding-top:16px;font-size:12px;color:#999;line-height:1.6;">
      <p style="text-align:center;">Xin chân thành cảm ơn Quý khách đã lựa chọn <strong style="color:#8B6914;">${HOTEL_NAME}</strong>.</p>
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

function buildFoodOrderHtml(order: any, statusLabel: string, statusColor: string): string {
  const depositAmount = Math.round(order.total_amount * 0.5);
  const remainingAmount = order.total_amount - depositAmount;
  const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositAmount}&des=${encodeURIComponent(order.food_order_id)}`;
  const isPaid = statusLabel === 'PAID';

  let itemsHtml = '';
  if (order.items && Array.isArray(order.items)) {
    itemsHtml = order.items.map((item: any) =>
      `<tr><td style="padding:4px 0;border-bottom:1px solid #f0f0f0;">${item.name} × ${item.quantity}</td><td style="text-align:right;padding:4px 0;border-bottom:1px solid #f0f0f0;font-weight:500;">${formatPrice(item.price * item.quantity)}</td></tr>`
    ).join('');
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#8B6914,#C49B2A,#8B6914);padding:28px 24px;text-align:center;color:#fff;">
    <div style="font-size:16px;margin-bottom:4px;">🍽️</div>
    <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:1px;">HÓA ĐƠN ĐẶT ĐỒ ĂN</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">FOOD ORDER CONFIRMATION</p>
    <div style="margin-top:16px;text-align:left;font-size:13px;line-height:1.6;opacity:0.9;">
      <p style="margin:2px 0;"><strong>Khách sạn:</strong> ${HOTEL_NAME}</p>
      <p style="margin:2px 0;"><strong>Hotline:</strong> ${HOTEL_PHONES}</p>
      <p style="margin:2px 0;"><strong>Email:</strong> ${HOTEL_EMAIL_DISPLAY}</p>
    </div>
  </div>
  <div style="padding:24px;">
    <div style="background:#f8f6f0;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;font-weight:600;">Mã đơn hàng</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:#8B6914;letter-spacing:2px;">${order.food_order_id}</p>
    </div>
    <div style="background:${isPaid ? '#ECFDF5' : '#FEF3C7'};border-radius:10px;padding:12px 16px;margin-bottom:20px;text-align:center;">
      <span style="color:${statusColor};font-weight:700;font-size:14px;">${isPaid ? '✅ ĐÃ CỌC 50%' : '⏳ CHƯA THANH TOÁN'}</span>
    </div>
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Thông tin khách</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Họ tên:</td><td style="font-weight:500;">${order.customer_name}</td></tr>
      <tr><td style="color:#888;">Số điện thoại:</td><td style="font-weight:500;">📞 ${order.phone}</td></tr>
      ${order.guest_email ? `<tr><td style="color:#888;">Email:</td><td style="font-weight:500;">📧 ${order.guest_email}</td></tr>` : ""}
      ${order.room_number ? `<tr><td style="color:#888;">Phòng:</td><td style="font-weight:500;">${order.room_number}</td></tr>` : ""}
      ${order.booking_code ? `<tr><td style="color:#888;">Mã đặt phòng:</td><td style="font-weight:500;">${order.booking_code}</td></tr>` : ""}
    </table>
    ${itemsHtml ? `
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Chi tiết đơn hàng</h3>
    <table style="width:100%;font-size:13px;">${itemsHtml}</table>
    ` : ''}
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">Chi phí</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Tổng tiền:</td><td style="font-weight:700;color:#8B6914;font-size:15px;">${formatPrice(order.total_amount)}</td></tr>
      <tr><td style="color:#888;">Tiền cọc (50%):</td><td style="font-weight:700;color:${isPaid ? '#059669' : '#D97706'};">${formatPrice(depositAmount)}</td></tr>
      ${isPaid ? `<tr><td style="color:#888;">Đã thanh toán:</td><td style="font-weight:700;color:#059669;">${formatPrice(depositAmount)}</td></tr>` : ''}
      <tr><td style="color:#888;">Còn lại:</td><td style="font-weight:700;color:#8B6914;">${formatPrice(isPaid ? remainingAmount : order.total_amount)}</td></tr>
    </table>
    ${!isPaid ? `
    <div style="background:#FEF3C7;border:2px dashed #F59E0B;border-radius:10px;padding:16px;margin-top:20px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#92400E;text-align:center;">💳 THANH TOÁN ĐẶT CỌC 50%</p>
      <table style="width:100%;font-size:13px;line-height:1.8;margin-bottom:12px;">
        <tr><td style="color:#92400E;width:45%;">🏦 Ngân hàng:</td><td style="font-weight:700;">${VA_BANK}</td></tr>
        <tr><td style="color:#92400E;">👤 Chủ TK:</td><td style="font-weight:700;">${VA_HOLDER}</td></tr>
        <tr><td style="color:#92400E;">🔢 Số TK (VA):</td><td style="font-weight:700;">${VA_ACCOUNT}</td></tr>
      </table>
      <div style="text-align:center;">
        <img src="${qrUrl}" alt="QR" style="width:200px;height:auto;border-radius:8px;margin-bottom:12px;" />
        <p style="margin:0 0 4px;font-size:12px;color:#92400E;">📌 Nội dung CK:</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#8B6914;letter-spacing:2px;">${order.food_order_id}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#92400E;">💰 Số tiền:</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#DC2626;">${formatPrice(depositAmount)}</p>
      </div>
    </div>` : ''}
    <div style="border-top:1px solid #eee;margin-top:20px;padding-top:16px;font-size:12px;color:#999;line-height:1.6;">
      <p style="text-align:center;">Xin chân thành cảm ơn Quý khách đã lựa chọn <strong style="color:#8B6914;">${HOTEL_NAME}</strong>.</p>
      <div style="text-align:center;border-top:1px solid #eee;margin-top:12px;padding-top:12px;">
        <p style="font-weight:600;color:#333;margin:0;">Trân trọng,</p>
        <p style="font-weight:600;color:#333;margin:2px 0;">${HOTEL_NAME}</p>
        <p style="margin:2px 0;">📞 ${HOTEL_PHONES}</p>
        <p style="margin:2px 0;">📧 ${HOTEL_EMAIL_DISPLAY}</p>
      </div>
    </div>
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
    const body = await req.json();
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpPassword) {
      throw new Error("SMTP_PASSWORD not configured");
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: { user: SMTP_EMAIL, pass: smtpPassword },
    });

    // Handle food order emails
    if (body.type === 'food_order') {
      const order = body.food_order;
      const emailHtml = buildFoodOrderHtml(order, 'PENDING', '#D97706');

      // Send to guest if email provided
      if (order.guest_email) {
        await transporter.sendMail({
          from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
          to: order.guest_email,
          subject: `Đơn đồ ăn ${order.food_order_id} - Chưa thanh toán`,
          html: emailHtml,
        });
        console.log("Food order email sent to guest:", order.guest_email);
      }

      // Admin email
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `🍽️ Đơn đồ ăn mới [${order.food_order_id}] - ${order.customer_name}`,
        html: emailHtml,
      });
      console.log("Food order admin email sent");

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === 'food_deposit_paid') {
      const order = body.food_order;
      const emailHtml = buildFoodOrderHtml(order, 'PAID', '#059669');

      if (order.guest_email) {
        await transporter.sendMail({
          from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
          to: order.guest_email,
          subject: `Đơn đồ ăn ${order.food_order_id} - Đã cọc 50%`,
          html: emailHtml,
        });
        console.log("Food deposit email sent to guest:", order.guest_email);
      }

      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `✅ Đã nhận cọc đồ ăn [${order.food_order_id}] - ${order.customer_name}`,
        html: emailHtml,
      });
      console.log("Food deposit admin email sent");

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Welcome member email
    if (body.type === 'welcome_member') {
      const { member_name, member_email, member_phone } = body;
      const welcomeHtml = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#8B6914,#C49B2A,#8B6914);padding:28px 24px;text-align:center;color:#fff;">
    <div style="font-size:32px;margin-bottom:8px;">🎉</div>
    <h1 style="margin:0;font-size:22px;font-weight:700;letter-spacing:1px;">CHÀO MỪNG THÀNH VIÊN MỚI</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">WELCOME TO ${HOTEL_NAME}</p>
  </div>
  <div style="padding:24px;">
    <div style="text-align:center;margin-bottom:20px;">
      <p style="font-size:16px;color:#333;margin:0 0 8px;">Xin chào <strong style="color:#8B6914;">${member_name}</strong>,</p>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0;">Chúc mừng bạn đã đăng ký thành công tài khoản thành viên tại <strong>${HOTEL_NAME}</strong>!</p>
    </div>
    <div style="background:#f8f6f0;border-radius:10px;padding:16px;margin-bottom:20px;">
      <h3 style="font-size:14px;font-weight:600;color:#8B6914;margin:0 0 12px;text-align:center;">📋 Thông tin tài khoản</h3>
      <table style="width:100%;font-size:13px;line-height:2;">
        <tr><td style="color:#888;width:40%;">Họ tên:</td><td style="font-weight:600;">${member_name}</td></tr>
        <tr><td style="color:#888;">Email:</td><td style="font-weight:600;">${member_email}</td></tr>
        ${member_phone ? `<tr><td style="color:#888;">Số điện thoại:</td><td style="font-weight:600;">${member_phone}</td></tr>` : ''}
        <tr><td style="color:#888;">Hạng thành viên:</td><td style="font-weight:600;color:#8B6914;">🎖 Thành viên</td></tr>
      </table>
    </div>
    <div style="background:#FEF3C7;border-radius:10px;padding:16px;margin-bottom:20px;">
      <h3 style="font-size:14px;font-weight:600;color:#92400E;margin:0 0 12px;text-align:center;">🎁 Ưu đãi thành viên</h3>
      <table style="width:100%;font-size:13px;line-height:2;">
        <tr><td style="color:#92400E;">🎖 Thường (0-2 lần đặt):</td><td style="font-weight:600;">Giảm 5%</td></tr>
        <tr><td style="color:#92400E;">⭐ VIP (3-9 lần đặt):</td><td style="font-weight:600;">Giảm 10%</td></tr>
        <tr><td style="color:#92400E;">👑 Siêu VIP (10+ lần đặt):</td><td style="font-weight:600;">Giảm 15%</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#555;line-height:1.6;text-align:center;">Hãy đăng nhập và đặt phòng để tích lũy ưu đãi nhé! Mỗi lần đặt phòng thành công sẽ giúp bạn tiến gần hơn đến hạng VIP và Siêu VIP.</p>
    <div style="border-top:1px solid #eee;margin-top:20px;padding-top:16px;font-size:12px;color:#999;line-height:1.6;text-align:center;">
      <p style="font-weight:600;color:#333;margin:0;">Trân trọng,</p>
      <p style="font-weight:600;color:#333;margin:2px 0;">${HOTEL_NAME}</p>
      <p style="margin:2px 0;">📞 ${HOTEL_PHONES}</p>
      <p style="margin:2px 0;">📧 ${HOTEL_EMAIL_DISPLAY}</p>
      <p style="margin:2px 0;">📍 ${HOTEL_ADDRESS}</p>
    </div>
  </div>
</div>
</body>
</html>`;

      // Send to member
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: member_email,
        subject: `🎉 Chào mừng ${member_name} - Thành viên ${HOTEL_NAME}`,
        html: welcomeHtml,
      });
      console.log("Welcome email sent to:", member_email);

      // Notify admin
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `👤 Thành viên mới: ${member_name} (${member_email})`,
        html: welcomeHtml,
      });
      console.log("Welcome admin notification sent");

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: booking email (backward compatible)
    const { booking, room_name, invoice_number, combos, combo_total } = body;
    const invoiceHtml = buildBookingInvoiceHtml(booking, room_name, invoice_number, combos, combo_total);

    if (booking.guest_email) {
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: booking.guest_email,
        subject: `Hóa đơn ${booking.booking_code} - Chưa thanh toán`,
        html: invoiceHtml,
      });
      console.log("Guest email sent to:", booking.guest_email);
    }

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

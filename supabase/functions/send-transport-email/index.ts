import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "https://esm.sh/nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_EMAIL = "tuandatluxuryflc36hotelsamson@gmail.com";
const ADMIN_EMAIL = "tuandatluxuryflc36hotel@gmail.com";
const HOTEL_NAME = "Khách sạn Tuấn Đạt Luxury";
const HOTEL_ADDRESS = "LK29-20, FLC Sầm Sơn, Thanh Hóa";
const HOTEL_PHONES = "038.441.8811 | 091.693.0969";

const TYPE_LABEL: Record<string, string> = {
  airport: "Đưa đón sân bay",
  beach: "Đưa đón bãi tắm",
  square: "Đưa đón quảng trường",
};

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", { dateStyle: "full", timeStyle: "short" });
  } catch { return iso; }
}

interface Body {
  type: "guest_confirmation" | "admin_notification" | "status_update";
  booking: {
    booking_id: string;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    room_number?: string | null;
    transport_type: string;
    pickup_location?: string | null;
    dropoff_location?: string | null;
    pickup_datetime: string;
    passengers: number;
    luggage?: string | null;
    flight_number?: string | null;
    notes?: string | null;
    status?: string;
  };
}

function guestEmailHtml(b: Body["booking"], statusUpdate?: string) {
  const isAirport = b.transport_type === "airport";
  const statusBlock = statusUpdate
    ? `<div style="background:#E8F5E9;border-left:4px solid #2E7D32;padding:14px 18px;margin:16px 0;border-radius:6px;color:#1B5E20;font-size:15px;font-weight:600;">${statusUpdate}</div>`
    : `<div style="background:#FFF8E1;border-left:4px solid #C9A84C;padding:14px 18px;margin:16px 0;border-radius:6px;color:#5D4037;font-size:14px;">⏳ Đơn của bạn đang chờ lễ tân xác nhận. Chúng tôi sẽ liên hệ trong vòng 30 phút.</div>`;

  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#222;">
<div style="max-width:640px;margin:0 auto;background:#fff;">
  <div style="background:#1B3A5C;color:#fff;padding:24px;text-align:center;">
    <h1 style="margin:0;font-size:22px;letter-spacing:.5px;">${HOTEL_NAME}</h1>
    <p style="margin:6px 0 0;font-size:13px;opacity:.85;">${HOTEL_ADDRESS}</p>
  </div>
  <div style="padding:28px 24px;">
    <h2 style="color:#1B3A5C;margin:0 0 6px;font-size:20px;">Xác nhận đặt xe đưa đón</h2>
    <p style="margin:0 0 14px;color:#666;font-size:14px;">Cảm ơn quý khách <b>${b.guest_name}</b> đã đặt dịch vụ.</p>
    <div style="background:#FFF3E0;padding:16px;border-radius:8px;text-align:center;margin-bottom:18px;">
      <div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Mã xác nhận</div>
      <div style="font-size:26px;font-weight:800;color:#C9A84C;letter-spacing:2px;margin-top:4px;">${b.booking_id}</div>
    </div>
    ${statusBlock}
    <h3 style="color:#1B3A5C;font-size:15px;border-bottom:2px solid #C9A84C;padding-bottom:6px;">Thông tin dịch vụ</h3>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#666;width:42%;">Dịch vụ</td><td style="padding:6px 0;font-weight:600;">${TYPE_LABEL[b.transport_type] || b.transport_type}</td></tr>
      ${b.pickup_location ? `<tr><td style="padding:6px 0;color:#666;">Điểm đón</td><td style="padding:6px 0;">${b.pickup_location}</td></tr>` : ""}
      ${b.dropoff_location ? `<tr><td style="padding:6px 0;color:#666;">Điểm trả</td><td style="padding:6px 0;">${b.dropoff_location}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#666;">Ngày & Giờ đón</td><td style="padding:6px 0;font-weight:600;color:#1B3A5C;">${fmtDateTime(b.pickup_datetime)}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Số hành khách</td><td style="padding:6px 0;">${b.passengers} người</td></tr>
      ${isAirport && b.flight_number ? `<tr><td style="padding:6px 0;color:#666;">Số hiệu chuyến bay</td><td style="padding:6px 0;font-weight:600;">${b.flight_number}</td></tr>` : ""}
      ${isAirport && b.luggage ? `<tr><td style="padding:6px 0;color:#666;">Hành lý</td><td style="padding:6px 0;">${b.luggage}</td></tr>` : ""}
    </table>
    <h3 style="color:#1B3A5C;font-size:15px;border-bottom:2px solid #C9A84C;padding-bottom:6px;margin-top:20px;">Thông tin liên hệ</h3>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#666;width:42%;">Họ tên</td><td style="padding:6px 0;">${b.guest_name}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">SĐT</td><td style="padding:6px 0;">${b.guest_phone}</td></tr>
      ${b.room_number ? `<tr><td style="padding:6px 0;color:#666;">Số phòng</td><td style="padding:6px 0;">${b.room_number}</td></tr>` : ""}
    </table>
    ${b.notes ? `<div style="margin-top:16px;background:#f9f9f9;padding:12px;border-radius:6px;font-size:13px;"><b>Ghi chú:</b> ${b.notes}</div>` : ""}
  </div>
  <div style="background:#1B3A5C;color:#fff;padding:18px;text-align:center;font-size:12px;">
    Liên hệ: ${HOTEL_PHONES} · Zalo: 038.441.8811<br/>
    <span style="opacity:.75;">tuandatluxury.com</span>
  </div>
</div></body></html>`;
}

function adminEmailHtml(b: Body["booking"]) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;">
  <div style="background:#1B3A5C;color:#fff;padding:18px;">
    <h2 style="margin:0;font-size:18px;">🚗 Đặt xe mới — ${TYPE_LABEL[b.transport_type] || b.transport_type}</h2>
    <p style="margin:4px 0 0;opacity:.85;font-size:13px;">Mã: <b>${b.booking_id}</b></p>
  </div>
  <div style="padding:20px;font-size:14px;">
    <p><b>Khách:</b> ${b.guest_name} — ${b.guest_phone}${b.room_number ? ` (Phòng ${b.room_number})` : ""}</p>
    <p><b>Email:</b> ${b.guest_email}</p>
    <p><b>Giờ đón:</b> ${fmtDateTime(b.pickup_datetime)}</p>
    <p><b>Số khách:</b> ${b.passengers}</p>
    ${b.pickup_location ? `<p><b>Điểm đón:</b> ${b.pickup_location}</p>` : ""}
    ${b.dropoff_location ? `<p><b>Điểm trả:</b> ${b.dropoff_location}</p>` : ""}
    ${b.flight_number ? `<p><b>Chuyến bay:</b> ${b.flight_number}</p>` : ""}
    ${b.luggage ? `<p><b>Hành lý:</b> ${b.luggage}</p>` : ""}
    ${b.notes ? `<p><b>Ghi chú:</b> ${b.notes}</p>` : ""}
    <a href="https://tuandatluxury.com/admin" style="display:inline-block;margin-top:14px;background:#C9A84C;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Xác nhận trong Admin →</a>
  </div>
</div></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.booking?.guest_email || !body?.booking?.booking_id) {
      return new Response(JSON.stringify({ error: "Missing booking data" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) {
      return new Response(JSON.stringify({ error: "SMTP not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: false,
      auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
    });

    const b = body.booking;
    const typeLabel = TYPE_LABEL[b.transport_type] || b.transport_type;

    if (body.type === "guest_confirmation") {
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: b.guest_email,
        subject: `✅ Xác nhận đặt xe — [${b.booking_id}] — Tuấn Đạt Luxury`,
        html: guestEmailHtml(b),
      });
      // also notify admin
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `🚗 Đặt xe mới — ${typeLabel} — ${fmtDateTime(b.pickup_datetime)} — ${b.guest_name}`,
        html: adminEmailHtml(b),
      });
    } else if (body.type === "admin_notification") {
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `🚗 Đặt xe mới — ${typeLabel} — ${b.guest_name}`,
        html: adminEmailHtml(b),
      });
    } else if (body.type === "status_update") {
      const msg = b.status === "confirmed"
        ? "✅ Lễ tân đã xác nhận chuyến xe của bạn. Xe sẽ đón đúng giờ!"
        : b.status === "cancelled"
        ? "❌ Đơn đặt xe của bạn đã bị huỷ. Vui lòng liên hệ lễ tân để biết thêm chi tiết."
        : "ℹ️ Trạng thái đơn đặt xe của bạn đã được cập nhật.";
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: b.guest_email,
        subject: `🚗 Cập nhật đặt xe — [${b.booking_id}]`,
        html: guestEmailHtml(b, msg),
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-transport-email error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

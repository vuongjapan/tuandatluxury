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

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: inv, error: invErr } = await supabase
      .from("manual_invoices").select("*").eq("id", invoice_id).single();
    if (invErr || !inv) throw new Error("Invoice not found");
    if (!inv.guest_email) throw new Error("Khách không có email");

    const { data: items } = await supabase
      .from("manual_invoice_items").select("*").eq("invoice_id", invoice_id).order("sort_order");

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD missing");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
    });

    const itemRows = (items || []).map((it: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${it.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(it.unit_price)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${fmt(it.total_price)}</td>
      </tr>
    `).join("");

    const html = `
<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#222">
  <div style="background:linear-gradient(135deg,#b8860b,#d4af37);color:#fff;padding:24px;text-align:center">
    <h1 style="margin:0;font-size:22px">${HOTEL_NAME}</h1>
    <p style="margin:6px 0 0;font-size:13px;opacity:.9">HÓA ĐƠN ${inv.invoice_code}</p>
  </div>

  <div style="padding:24px">
    <p>Kính gửi <strong>${inv.guest_name}</strong>,</p>
    <p>Cảm ơn Quý khách đã tin tưởng ${HOTEL_NAME}. Dưới đây là hóa đơn dành riêng cho Quý khách:</p>

    <div style="background:#f7f5ef;padding:16px;border-radius:8px;margin:16px 0;font-size:14px">
      <p style="margin:4px 0"><strong>Mã hóa đơn:</strong> ${inv.invoice_code}</p>
      <p style="margin:4px 0"><strong>SĐT:</strong> ${inv.guest_phone}</p>
      ${inv.check_in ? `<p style="margin:4px 0"><strong>Nhận phòng:</strong> ${inv.check_in} → ${inv.check_out}</p>` : ""}
      <p style="margin:4px 0"><strong>Số khách:</strong> ${inv.guests_count} người lớn + ${inv.children_count} trẻ em</p>
    </div>

    ${inv.room_name ? `
    <h3 style="border-bottom:2px solid #d4af37;padding-bottom:6px;margin:20px 0 10px">🛏️ Phòng</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr>
        <td style="padding:8px">${inv.room_name} × ${inv.room_quantity} phòng × ${inv.nights} đêm</td>
        <td style="padding:8px;text-align:right;font-weight:600">${fmt(inv.room_subtotal)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 8px;font-size:12px;color:#666">${fmt(inv.room_price_per_night)} / đêm</td>
      </tr>
    </table>
    ` : ""}

    ${(items && items.length > 0) ? `
    <h3 style="border-bottom:2px solid #d4af37;padding-bottom:6px;margin:20px 0 10px">🍽️ Thực đơn / Dịch vụ</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f7f5ef">
        <th style="padding:8px;text-align:left">Mục</th>
        <th style="padding:8px;text-align:center">SL</th>
        <th style="padding:8px;text-align:right">Đơn giá</th>
        <th style="padding:8px;text-align:right">Thành tiền</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    ` : ""}

    <div style="margin-top:24px;background:#fff8e7;padding:16px;border-radius:8px;border:1px solid #d4af37">
      <table style="width:100%;font-size:14px">
        <tr><td>Tiền phòng</td><td style="text-align:right">${fmt(inv.room_subtotal)}</td></tr>
        <tr><td>Tiền ăn / dịch vụ</td><td style="text-align:right">${fmt(inv.food_subtotal + inv.custom_subtotal)}</td></tr>
        ${inv.discount_amount > 0 ? `<tr style="color:#c00"><td>Giảm giá ${inv.discount_note ? `(${inv.discount_note})` : ""}</td><td style="text-align:right">-${fmt(inv.discount_amount)}</td></tr>` : ""}
        <tr style="border-top:2px solid #d4af37;font-weight:700;font-size:16px">
          <td style="padding-top:8px">TỔNG THANH TOÁN</td>
          <td style="padding-top:8px;text-align:right;color:#b8860b">${fmt(inv.total_amount)}</td>
        </tr>
        ${inv.deposit_amount > 0 ? `
        <tr><td>Đã đặt cọc</td><td style="text-align:right">${fmt(inv.deposit_amount)}</td></tr>
        <tr style="font-weight:600"><td>Còn lại</td><td style="text-align:right">${fmt(inv.remaining_amount)}</td></tr>
        ` : ""}
      </table>
    </div>

    ${inv.notes ? `<p style="margin-top:16px;padding:12px;background:#f5f5f5;border-radius:6px;font-size:13px"><strong>Ghi chú:</strong> ${inv.notes}</p>` : ""}

    <p style="margin-top:24px;font-size:13px;color:#666">
      Mọi thắc mắc xin liên hệ:<br>
      📞 ${HOTEL_PHONES}<br>
      📍 ${HOTEL_ADDRESS}
    </p>
  </div>

  <div style="background:#222;color:#bbb;padding:16px;text-align:center;font-size:12px">
    © ${new Date().getFullYear()} ${HOTEL_NAME}
  </div>
</div>`;

    await transporter.sendMail({
      from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
      to: inv.guest_email,
      subject: `Hóa đơn ${inv.invoice_code} - ${HOTEL_NAME}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

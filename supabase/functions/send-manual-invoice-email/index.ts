// Send manual-invoice email — 2 variants:
//   email_type='pending'   -> ⏳ Subject "Vui lòng thanh toán cọc", PDF pending có QR
//   email_type='confirmed' -> ✅ Subject "Đã nhận cọc", PDF confirmed không QR
// Append vào email_log. sent_by: 'admin:<name>' | 'auto:sepay'
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
const VA_BANK = "BIDV";
const VA_ACCOUNT = "96247TUANDATLUXURY";
const VA_HOLDER = "VAN DINH GIANG";

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";
function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function getRoomLines(inv: any): any[] {
  if (Array.isArray(inv.room_lines) && inv.room_lines.length > 0) return inv.room_lines;
  if (inv.room_name) return [{
    room_name: inv.room_name,
    room_count: inv.room_quantity || 1,
    nights: inv.nights || 1,
    price_per_night: inv.room_price_per_night || 0,
    line_total: inv.room_subtotal || 0,
  }];
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let invoice_id_for_log: string | null = null;
  let email_type_for_log: 'pending' | 'confirmed' = 'pending';
  let sent_by_for_log: string = 'admin:unknown';

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  async function appendLog(success: boolean, error?: string) {
    if (!invoice_id_for_log) return;
    try {
      const { data: row } = await supabase.from("manual_invoices").select("email_log").eq("id", invoice_id_for_log).single();
      const log = Array.isArray(row?.email_log) ? row!.email_log : [];
      log.push({
        type: email_type_for_log,
        sent_at: new Date().toISOString(),
        sent_by: sent_by_for_log,
        success,
        ...(error ? { error } : {}),
      });
      const patch: any = { email_log: log };
      if (success) {
        if (email_type_for_log === 'pending') patch.pending_email_sent_at = new Date().toISOString();
        else patch.confirmed_email_sent_at = new Date().toISOString();
        patch.email_sent_at = new Date().toISOString();
      }
      await supabase.from("manual_invoices").update(patch).eq("id", invoice_id_for_log);
    } catch (e) { console.error("appendLog fail:", e); }
  }

  try {
    const body = await req.json();
    const { invoice_id, recipient_email, email_type, sent_by, attachments } = body;
    if (!invoice_id) throw new Error("invoice_id required");
    invoice_id_for_log = invoice_id;
    sent_by_for_log = sent_by || 'admin:unknown';

    const { data: inv, error: invErr } = await supabase
      .from("manual_invoices").select("*").eq("id", invoice_id).single();
    if (invErr || !inv) throw new Error("Invoice not found");

    // Auto-detect email_type from status nếu không truyền
    const variant: 'pending' | 'confirmed' = email_type
      || ((inv.payment_status === 'DEPOSIT_PAID' || inv.payment_status === 'PAID') ? 'confirmed' : 'pending');
    email_type_for_log = variant;

    const toEmail = (recipient_email || inv.guest_email || "").trim();
    if (!toEmail) throw new Error("Không có email người nhận");

    const { data: items } = await supabase
      .from("manual_invoice_items").select("*").eq("invoice_id", invoice_id).order("sort_order");

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD missing");

    // Resolve PDF attachment list: explicit `attachments` array, else single `variant`
    const attachVariants: Array<'pending' | 'confirmed'> = (() => {
      const raw = Array.isArray(attachments) && attachments.length > 0
        ? attachments
        : [variant];
      const cleaned = raw.filter((v: any) => v === 'pending' || v === 'confirmed');
      // dedupe while keeping order
      return Array.from(new Set(cleaned)) as Array<'pending' | 'confirmed'>;
    })();

    const pdfAttachments: Array<{ filename: string; content: Uint8Array; contentType: string }> = [];
    for (const v of attachVariants) {
      const pdfRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-manual-invoice-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ invoice_id, variant: v }),
        }
      );
      if (!pdfRes.ok) throw new Error(`PDF gen failed (${v}): ${await pdfRes.text()}`);
      const pdfJson = await pdfRes.json();
      const bytes = Uint8Array.from(atob(pdfJson.pdf_base64), (c: string) => c.charCodeAt(0));
      pdfAttachments.push({
        filename: pdfJson.pdf_name || `HoaDon_${v}_${inv.invoice_code}.pdf`,
        content: bytes,
        contentType: "application/pdf",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 587, secure: false,
      auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
    });

    const roomLines = getRoomLines(inv);
    const roomRowsHtml = roomLines.map((rl: any) => `
      <tr><td style="padding:8px;border-bottom:1px solid #eee">
        ${rl.room_name} × ${rl.room_count} phòng × ${rl.nights} đêm
        <div style="font-size:12px;color:#666">${fmt(rl.price_per_night)} / đêm</div>
      </td>
      <td style="padding:8px;text-align:right;font-weight:600;border-bottom:1px solid #eee">${fmt(rl.line_total)}</td></tr>
    `).join("");

    const itemRows = (items || []).map((it: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${it.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(it.unit_price)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${fmt(it.total_price)}</td>
      </tr>`).join("");

    const remaining = Math.max(0, (inv.total_amount || 0) - (inv.deposit_amount || 0));
    const depositToPay = (inv.deposit_amount || 0) > 0 ? inv.deposit_amount : Math.round((inv.total_amount || 0) * 0.5);

    // ===== EMAIL CONTENT BY VARIANT =====
    let subject: string;
    let statusBlock: string;
    let paymentBlock: string;

    if (variant === 'confirmed') {
      subject = `[Tuấn Đạt Luxury] ✅ Xác nhận ${inv.invoice_code} – Đã nhận cọc`;
      statusBlock = `
        <div style="background:#e8f7ee;border:2px solid #16a34a;padding:18px;border-radius:10px;margin:18px 0">
          <h3 style="margin:0 0 8px;color:#15803d;font-size:18px">✅ Đã nhận cọc: ${fmt(inv.deposit_amount)}</h3>
          <p style="margin:4px 0;font-size:14px;color:#15803d">
            Thời gian xác nhận: <strong>${formatDateTime(inv.deposit_paid_at || new Date().toISOString())}</strong>
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:#166534">
            Đặt phòng của Quý khách đã được xác nhận. Hẹn gặp Quý khách tại khách sạn!
          </p>
        </div>`;
      paymentBlock = `
        <div style="background:#fff8e7;padding:14px;border-radius:8px;border:1px solid #d4af37;margin-top:14px">
          <p style="margin:0;font-size:15px"><strong>Còn lại thanh toán tại quầy:</strong>
            <span style="color:#b45309;font-weight:700;font-size:17px">${fmt(remaining)}</span>
          </p>
        </div>`;
    } else {
      subject = `[Tuấn Đạt Luxury] Xác nhận đặt phòng ${inv.invoice_code} – Vui lòng thanh toán cọc`;
      statusBlock = `
        <div style="background:#fff7ed;border:2px solid #ea580c;padding:18px;border-radius:10px;margin:18px 0">
          <h3 style="margin:0 0 8px;color:#c2410c;font-size:18px">⏳ Đặt phòng đã ghi nhận — Vui lòng thanh toán cọc</h3>
          <p style="margin:4px 0;font-size:14px;color:#9a3412">
            Đặt phòng sẽ được xác nhận chính thức sau khi chúng tôi nhận được tiền cọc.
          </p>
        </div>`;
      paymentBlock = `
        <div style="background:#fff8e7;padding:16px;border-radius:10px;border:2px solid #ea580c;margin-top:14px">
          <h3 style="margin:0 0 10px;color:#c2410c">⚠ Vui lòng chuyển khoản cọc</h3>
          <table style="width:100%;font-size:14px">
            <tr><td style="padding:4px 0;color:#666">Ngân hàng:</td><td><strong>${VA_BANK}</strong></td></tr>
            <tr><td style="padding:4px 0;color:#666">Số tài khoản:</td><td><strong>${VA_ACCOUNT}</strong></td></tr>
            <tr><td style="padding:4px 0;color:#666">Chủ tài khoản:</td><td><strong>${VA_HOLDER}</strong></td></tr>
            <tr><td style="padding:4px 0;color:#666">Nội dung CK:</td><td><strong style="color:#c2410c">${inv.invoice_code}</strong></td></tr>
            <tr><td style="padding:4px 0;color:#666">Số tiền:</td><td><strong style="color:#dc2626;font-size:17px">${fmt(depositToPay)}</strong></td></tr>
          </table>
          <p style="margin:10px 0 0;font-size:12px;color:#9a3412">
            Vui lòng chuyển ĐÚNG nội dung và số tiền để hệ thống tự động xác nhận.
          </p>
        </div>`;
    }

    const html = `
<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#222">
  <div style="background:linear-gradient(135deg,#b8860b,#d4af37);color:#fff;padding:24px;text-align:center">
    <h1 style="margin:0;font-size:22px">${HOTEL_NAME}</h1>
    <p style="margin:6px 0 0;font-size:13px;opacity:.9">${variant === 'confirmed' ? 'XÁC NHẬN ĐẶT PHÒNG' : 'XÁC NHẬN ĐẶT PHÒNG'} ${inv.invoice_code}</p>
  </div>
  <div style="padding:24px">
    <p>Kính gửi <strong>${inv.guest_name}</strong>,</p>
    ${statusBlock}
    <div style="background:#f7f5ef;padding:16px;border-radius:8px;margin:16px 0;font-size:14px">
      <p style="margin:4px 0"><strong>Mã hóa đơn:</strong> ${inv.invoice_code}</p>
      <p style="margin:4px 0"><strong>SĐT:</strong> ${inv.guest_phone}</p>
      ${inv.check_in ? `<p style="margin:4px 0"><strong>Nhận phòng:</strong> ${inv.check_in} → ${inv.check_out}</p>` : ""}
      <p style="margin:4px 0"><strong>Số khách:</strong> ${inv.guests_count} người lớn + ${inv.children_count} trẻ em</p>
    </div>
    ${roomLines.length > 0 ? `
    <h3 style="border-bottom:2px solid #d4af37;padding-bottom:6px;margin:20px 0 10px">🛏️ Phòng</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${roomRowsHtml}</table>` : ""}
    ${(items && items.length > 0) ? `
    <h3 style="border-bottom:2px solid #d4af37;padding-bottom:6px;margin:20px 0 10px">🍽️ Thực đơn / Dịch vụ</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f7f5ef">
        <th style="padding:8px;text-align:left">Mục</th><th style="padding:8px;text-align:center">SL</th>
        <th style="padding:8px;text-align:right">Đơn giá</th><th style="padding:8px;text-align:right">Thành tiền</th>
      </tr></thead><tbody>${itemRows}</tbody></table>` : ""}
    <div style="margin-top:24px;background:#fff8e7;padding:16px;border-radius:8px;border:1px solid #d4af37">
      <table style="width:100%;font-size:14px">
        <tr><td>Tổng tiền phòng</td><td style="text-align:right">${fmt(inv.room_subtotal)}</td></tr>
        ${(inv.food_subtotal + inv.custom_subtotal) > 0 ? `<tr><td>Tiền ăn / dịch vụ</td><td style="text-align:right">${fmt(inv.food_subtotal + inv.custom_subtotal)}</td></tr>` : ""}
        ${inv.discount_amount > 0 ? `<tr style="color:#c00"><td>Giảm giá ${inv.discount_note ? `(${inv.discount_note})` : ""}</td><td style="text-align:right">-${fmt(inv.discount_amount)}</td></tr>` : ""}
        <tr style="border-top:2px solid #d4af37;font-weight:700;font-size:16px">
          <td style="padding-top:8px">TỔNG THANH TOÁN</td>
          <td style="padding-top:8px;text-align:right;color:#b8860b">${fmt(inv.total_amount)}</td></tr>
        ${variant === 'confirmed' ? `
          <tr><td>Đã đặt cọc</td><td style="text-align:right;color:#16a34a;font-weight:600">${fmt(inv.deposit_amount)}</td></tr>
          <tr style="font-weight:600"><td>Còn lại</td><td style="text-align:right">${fmt(remaining)}</td></tr>` : ""}
      </table>
    </div>
    ${paymentBlock}
    ${inv.notes ? `<p style="margin-top:16px;padding:12px;background:#f5f5f5;border-radius:6px;font-size:13px"><strong>Tiện ích / Ghi chú:</strong><br>${inv.notes.replace(/\n/g, '<br>')}</p>` : ""}
    <p style="margin-top:24px;font-size:13px;color:#666">
      📎 File PDF hóa đơn đã được đính kèm trong email này.<br><br>
      Mọi thắc mắc xin liên hệ:<br>📞 ${HOTEL_PHONES}<br>📍 ${HOTEL_ADDRESS}
    </p>
  </div>
  <div style="background:#222;color:#bbb;padding:16px;text-align:center;font-size:12px">
    © ${new Date().getFullYear()} ${HOTEL_NAME}
  </div>
</div>`;

    await transporter.sendMail({
      from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
      to: toEmail,
      subject,
      html,
      attachments: [
        { filename: pdfName, content: pdfBytes, contentType: "application/pdf" },
      ],
    });

    await appendLog(true);

    return new Response(JSON.stringify({ ok: true, sent_to: toEmail, email_type: variant }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-manual-invoice-email error:", e);
    await appendLog(false, e?.message || String(e));
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

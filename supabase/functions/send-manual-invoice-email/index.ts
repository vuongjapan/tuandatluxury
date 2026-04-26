import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "https://esm.sh/nodemailer@6.9.12";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SMTP_EMAIL = "tuandatluxuryflc36hotelsamson@gmail.com";
const HOTEL_NAME = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 038.441.8811";

const FONT_REGULAR_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const FONT_BOLD_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf";

let cachedR: Uint8Array | null = null;
let cachedB: Uint8Array | null = null;
async function loadFont(url: string, isBold: boolean) {
  if (!isBold && cachedR) return cachedR;
  if (isBold && cachedB) return cachedB;
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  if (isBold) cachedB = buf; else cachedR = buf;
  return buf;
}

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";

async function buildPdf(inv: any, items: any[]): Promise<{ bytes: Uint8Array; filename: string }> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFont(FONT_REGULAR_URL, false));
  const fontBold = await pdf.embedFont(await loadFont(FONT_BOLD_URL, true));
  const page = pdf.addPage([595.28, 841.89]);
  const W = 595.28, H = 841.89, M = 40;
  let y = H - 80;
  const gold: [number, number, number] = [0.72, 0.53, 0.04];
  const dark: [number, number, number] = [0.13, 0.13, 0.13];
  const muted: [number, number, number] = [0.45, 0.45, 0.45];

  page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: rgb(...gold) });
  page.drawText(HOTEL_NAME, { x: M, y: H - 38, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`HÓA ĐƠN ${inv.invoice_code}`, { x: M, y: H - 60, size: 11, font, color: rgb(1, 1, 1) });
  page.drawText(new Date(inv.created_at).toLocaleString("vi-VN"), { x: W - M - 130, y: H - 60, size: 9, font, color: rgb(1, 1, 1) });
  y = H - 100;

  page.drawRectangle({ x: M, y: y - 70, width: W - 2 * M, height: 70, color: rgb(0.97, 0.95, 0.9) });
  let yi = y - 14;
  page.drawText("THÔNG TIN KHÁCH", { x: M + 10, y: yi, size: 9, font: fontBold, color: rgb(...gold) });
  yi -= 14;
  page.drawText(`Khách: ${inv.guest_name}`, { x: M + 10, y: yi, size: 10, font: fontBold, color: rgb(...dark) });
  page.drawText(`SĐT: ${inv.guest_phone || "—"}`, { x: M + 280, y: yi, size: 10, font, color: rgb(...dark) });
  yi -= 13;
  if (inv.guest_email) page.drawText(`Email: ${inv.guest_email}`, { x: M + 10, y: yi, size: 9, font, color: rgb(...muted) });
  page.drawText(`Số khách: ${inv.guests_count} NL + ${inv.children_count} TE`, { x: M + 280, y: yi, size: 9, font, color: rgb(...muted) });
  yi -= 13;
  if (inv.check_in) page.drawText(`Nhận: ${inv.check_in}  →  Trả: ${inv.check_out}  (${inv.nights} đêm)`, { x: M + 10, y: yi, size: 9, font, color: rgb(...muted) });
  y -= 80;

  if (inv.room_name) {
    page.drawText("PHÒNG", { x: M, y, size: 10, font: fontBold, color: rgb(...gold) });
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: rgb(...gold) });
    y -= 14;
    page.drawText(`${inv.room_name} × ${inv.room_quantity} phòng × ${inv.nights} đêm`, { x: M, y, size: 10, font, color: rgb(...dark) });
    page.drawText(fmt(inv.room_subtotal), { x: W - M - 80, y, size: 10, font: fontBold, color: rgb(...dark) });
    y -= 12;
    page.drawText(`Đơn giá: ${fmt(inv.room_price_per_night)} / đêm`, { x: M, y, size: 8, font, color: rgb(...muted) });
    y -= 18;
  }

  if (items && items.length > 0) {
    page.drawText("DỊCH VỤ / THỰC ĐƠN", { x: M, y, size: 10, font: fontBold, color: rgb(...gold) });
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: rgb(...gold) });
    y -= 14;
    page.drawText("Mục", { x: M, y, size: 9, font: fontBold, color: rgb(...muted) });
    page.drawText("SL", { x: M + 300, y, size: 9, font: fontBold, color: rgb(...muted) });
    page.drawText("Đơn giá", { x: M + 350, y, size: 9, font: fontBold, color: rgb(...muted) });
    page.drawText("Thành tiền", { x: W - M - 80, y, size: 9, font: fontBold, color: rgb(...muted) });
    y -= 12;
    for (const it of items) {
      if (y < 200) break;
      page.drawText((it.name || "").slice(0, 50), { x: M, y, size: 9, font, color: rgb(...dark) });
      page.drawText(String(it.quantity), { x: M + 305, y, size: 9, font, color: rgb(...dark) });
      page.drawText(fmt(it.unit_price), { x: M + 350, y, size: 9, font, color: rgb(...dark) });
      page.drawText(fmt(it.total_price), { x: W - M - 80, y, size: 9, font: fontBold, color: rgb(...dark) });
      y -= 12;
    }
    y -= 8;
  }

  const boxH = inv.deposit_amount > 0 ? 100 : 70;
  const boxY = Math.max(y - boxH, 90);
  page.drawRectangle({ x: M, y: boxY, width: W - 2 * M, height: boxH, borderColor: rgb(...gold), borderWidth: 1.5, color: rgb(1, 0.97, 0.9) });
  let ty = boxY + boxH - 14;
  page.drawText("Tiền phòng", { x: M + 10, y: ty, size: 9, font, color: rgb(...dark) });
  page.drawText(fmt(inv.room_subtotal), { x: W - M - 80, y: ty, size: 9, font, color: rgb(...dark) });
  ty -= 13;
  page.drawText("Tiền ăn / dịch vụ", { x: M + 10, y: ty, size: 9, font, color: rgb(...dark) });
  page.drawText(fmt((inv.food_subtotal || 0) + (inv.custom_subtotal || 0)), { x: W - M - 80, y: ty, size: 9, font, color: rgb(...dark) });
  ty -= 13;
  if (inv.discount_amount > 0) {
    page.drawText(`Giảm giá ${inv.discount_note ? `(${inv.discount_note})` : ""}`, { x: M + 10, y: ty, size: 9, font, color: rgb(0.7, 0, 0) });
    page.drawText(`-${fmt(inv.discount_amount)}`, { x: W - M - 80, y: ty, size: 9, font, color: rgb(0.7, 0, 0) });
    ty -= 13;
  }
  page.drawLine({ start: { x: M + 10, y: ty + 4 }, end: { x: W - M - 10, y: ty + 4 }, thickness: 0.7, color: rgb(...gold) });
  page.drawText("TỔNG THANH TOÁN", { x: M + 10, y: ty - 6, size: 11, font: fontBold, color: rgb(...gold) });
  page.drawText(fmt(inv.total_amount), { x: W - M - 100, y: ty - 6, size: 12, font: fontBold, color: rgb(...gold) });
  if (inv.deposit_amount > 0) {
    ty -= 22;
    page.drawText("Đã đặt cọc", { x: M + 10, y: ty, size: 9, font, color: rgb(...dark) });
    page.drawText(fmt(inv.deposit_amount), { x: W - M - 80, y: ty, size: 9, font, color: rgb(...dark) });
    ty -= 12;
    page.drawText("Còn lại", { x: M + 10, y: ty, size: 10, font: fontBold, color: rgb(...dark) });
    page.drawText(fmt(inv.remaining_amount), { x: W - M - 80, y: ty, size: 10, font: fontBold, color: rgb(...dark) });
  }

  page.drawText(`Tel: ${HOTEL_PHONES}`, { x: M, y: 50, size: 8, font, color: rgb(...muted) });
  page.drawText(HOTEL_ADDRESS, { x: M, y: 38, size: 8, font, color: rgb(...muted) });
  page.drawText(`© ${new Date().getFullYear()} ${HOTEL_NAME}`, { x: W - M - 180, y: 38, size: 8, font, color: rgb(...muted) });

  const bytes = await pdf.save();
  return { bytes, filename: `HoaDon-${inv.invoice_code}.pdf` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { invoice_id, recipient_email } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: inv, error: invErr } = await supabase
      .from("manual_invoices").select("*").eq("id", invoice_id).single();
    if (invErr || !inv) throw new Error("Invoice not found");

    const toEmail = (recipient_email || inv.guest_email || "").trim();
    if (!toEmail) throw new Error("Không có email người nhận");

    const { data: items } = await supabase
      .from("manual_invoice_items").select("*").eq("invoice_id", invoice_id).order("sort_order");

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD missing");

    // Build PDF attachment
    const { bytes: pdfBytes, filename: pdfName } = await buildPdf(inv, items || []);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 587, secure: false,
      auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
    });

    const itemRows = (items || []).map((it: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${it.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(it.unit_price)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${fmt(it.total_price)}</td>
      </tr>`).join("");

    const html = `
<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;color:#222">
  <div style="background:linear-gradient(135deg,#b8860b,#d4af37);color:#fff;padding:24px;text-align:center">
    <h1 style="margin:0;font-size:22px">${HOTEL_NAME}</h1>
    <p style="margin:6px 0 0;font-size:13px;opacity:.9">HÓA ĐƠN ${inv.invoice_code}</p>
  </div>
  <div style="padding:24px">
    <p>Kính gửi <strong>${inv.guest_name}</strong>,</p>
    <p>Cảm ơn Quý khách đã tin tưởng ${HOTEL_NAME}. File PDF hóa đơn được đính kèm trong email này.</p>
    <div style="background:#f7f5ef;padding:16px;border-radius:8px;margin:16px 0;font-size:14px">
      <p style="margin:4px 0"><strong>Mã hóa đơn:</strong> ${inv.invoice_code}</p>
      <p style="margin:4px 0"><strong>SĐT:</strong> ${inv.guest_phone}</p>
      ${inv.check_in ? `<p style="margin:4px 0"><strong>Nhận phòng:</strong> ${inv.check_in} → ${inv.check_out}</p>` : ""}
      <p style="margin:4px 0"><strong>Số khách:</strong> ${inv.guests_count} người lớn + ${inv.children_count} trẻ em</p>
    </div>
    ${inv.room_name ? `
    <h3 style="border-bottom:2px solid #d4af37;padding-bottom:6px;margin:20px 0 10px">🛏️ Phòng</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px">${inv.room_name} × ${inv.room_quantity} phòng × ${inv.nights} đêm</td>
      <td style="padding:8px;text-align:right;font-weight:600">${fmt(inv.room_subtotal)}</td></tr>
      <tr><td colspan="2" style="padding:4px 8px;font-size:12px;color:#666">${fmt(inv.room_price_per_night)} / đêm</td></tr>
    </table>` : ""}
    ${(items && items.length > 0) ? `
    <h3 style="border-bottom:2px solid #d4af37;padding-bottom:6px;margin:20px 0 10px">🍽️ Thực đơn / Dịch vụ</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f7f5ef">
        <th style="padding:8px;text-align:left">Mục</th><th style="padding:8px;text-align:center">SL</th>
        <th style="padding:8px;text-align:right">Đơn giá</th><th style="padding:8px;text-align:right">Thành tiền</th>
      </tr></thead><tbody>${itemRows}</tbody></table>` : ""}
    <div style="margin-top:24px;background:#fff8e7;padding:16px;border-radius:8px;border:1px solid #d4af37">
      <table style="width:100%;font-size:14px">
        <tr><td>Tiền phòng</td><td style="text-align:right">${fmt(inv.room_subtotal)}</td></tr>
        <tr><td>Tiền ăn / dịch vụ</td><td style="text-align:right">${fmt(inv.food_subtotal + inv.custom_subtotal)}</td></tr>
        ${inv.discount_amount > 0 ? `<tr style="color:#c00"><td>Giảm giá ${inv.discount_note ? `(${inv.discount_note})` : ""}</td><td style="text-align:right">-${fmt(inv.discount_amount)}</td></tr>` : ""}
        <tr style="border-top:2px solid #d4af37;font-weight:700;font-size:16px">
          <td style="padding-top:8px">TỔNG THANH TOÁN</td>
          <td style="padding-top:8px;text-align:right;color:#b8860b">${fmt(inv.total_amount)}</td></tr>
        ${inv.deposit_amount > 0 ? `
        <tr><td>Đã đặt cọc</td><td style="text-align:right">${fmt(inv.deposit_amount)}</td></tr>
        <tr style="font-weight:600"><td>Còn lại</td><td style="text-align:right">${fmt(inv.remaining_amount)}</td></tr>` : ""}
      </table>
    </div>
    ${inv.notes ? `<p style="margin-top:16px;padding:12px;background:#f5f5f5;border-radius:6px;font-size:13px"><strong>Ghi chú:</strong> ${inv.notes}</p>` : ""}
    <p style="margin-top:24px;font-size:13px;color:#666">
      📎 File PDF hóa đơn được đính kèm.<br><br>
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
      subject: `Hóa đơn ${inv.invoice_code} - ${HOTEL_NAME}`,
      html,
      attachments: [{
        filename: pdfName,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      }],
    });

    return new Response(JSON.stringify({ ok: true, sent_to: toEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

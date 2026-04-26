// Generate a single A4 PDF for a manual invoice (Vietnamese, Noto Sans).
// Returns { pdf_base64, pdf_name }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOTEL_NAME_VI = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 038.441.8811";
const HOTEL_EMAIL = "tuandatluxuryflc36hotelsamson@gmail.com";

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

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "đ";

export async function buildManualInvoicePdf(invoice_id: string): Promise<{ bytes: Uint8Array; filename: string; invoice: any }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: inv, error } = await supabase
    .from("manual_invoices").select("*").eq("id", invoice_id).single();
  if (error || !inv) throw new Error("Invoice not found");

  const { data: items } = await supabase
    .from("manual_invoice_items").select("*").eq("invoice_id", invoice_id).order("sort_order");

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFont(FONT_REGULAR_URL, false));
  const fontBold = await pdf.embedFont(await loadFont(FONT_BOLD_URL, true));

  const page = pdf.addPage([595.28, 841.89]);
  const W = 595.28, H = 841.89;
  const M = 40;
  let y = H - M;

  const gold: [number, number, number] = [0.72, 0.53, 0.04];
  const dark: [number, number, number] = [0.13, 0.13, 0.13];
  const muted: [number, number, number] = [0.45, 0.45, 0.45];

  // Header bar
  page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: rgb(...gold) });
  page.drawText(HOTEL_NAME_VI, { x: M, y: H - 38, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`HÓA ĐƠN ${inv.invoice_code}`, { x: M, y: H - 60, size: 11, font, color: rgb(1, 1, 1) });
  page.drawText(new Date(inv.created_at).toLocaleString("vi-VN"), {
    x: W - M - 130, y: H - 60, size: 9, font, color: rgb(1, 1, 1),
  });
  y = H - 100;

  // Guest info box
  page.drawRectangle({ x: M, y: y - 70, width: W - 2 * M, height: 70, color: rgb(0.97, 0.95, 0.9) });
  let yi = y - 14;
  page.drawText("THÔNG TIN KHÁCH", { x: M + 10, y: yi, size: 9, font: fontBold, color: rgb(...gold) });
  yi -= 14;
  page.drawText(`Khách: ${inv.guest_name}`, { x: M + 10, y: yi, size: 10, font: fontBold, color: rgb(...dark) });
  page.drawText(`SĐT: ${inv.guest_phone || "—"}`, { x: M + 280, y: yi, size: 10, font, color: rgb(...dark) });
  yi -= 13;
  if (inv.guest_email) {
    page.drawText(`Email: ${inv.guest_email}`, { x: M + 10, y: yi, size: 9, font, color: rgb(...muted) });
  }
  page.drawText(`Số khách: ${inv.guests_count} NL + ${inv.children_count} TE`, { x: M + 280, y: yi, size: 9, font, color: rgb(...muted) });
  yi -= 13;
  if (inv.check_in) {
    page.drawText(`Nhận: ${inv.check_in}  →  Trả: ${inv.check_out}  (${inv.nights} đêm)`, { x: M + 10, y: yi, size: 9, font, color: rgb(...muted) });
  }
  y -= 80;

  // Room
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

  // Items
  if (items && items.length > 0) {
    page.drawText("DỊCH VỤ / THỰC ĐƠN", { x: M, y, size: 10, font: fontBold, color: rgb(...gold) });
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: rgb(...gold) });
    y -= 14;
    // Header row
    page.drawText("Mục", { x: M, y, size: 9, font: fontBold, color: rgb(...muted) });
    page.drawText("SL", { x: M + 300, y, size: 9, font: fontBold, color: rgb(...muted) });
    page.drawText("Đơn giá", { x: M + 350, y, size: 9, font: fontBold, color: rgb(...muted) });
    page.drawText("Thành tiền", { x: W - M - 80, y, size: 9, font: fontBold, color: rgb(...muted) });
    y -= 12;
    for (const it of items) {
      if (y < 200) break; // keep on one page
      const name = (it.name || "").slice(0, 50);
      page.drawText(name, { x: M, y, size: 9, font, color: rgb(...dark) });
      page.drawText(String(it.quantity), { x: M + 305, y, size: 9, font, color: rgb(...dark) });
      page.drawText(fmt(it.unit_price), { x: M + 350, y, size: 9, font, color: rgb(...dark) });
      page.drawText(fmt(it.total_price), { x: W - M - 80, y, size: 9, font: fontBold, color: rgb(...dark) });
      y -= 12;
    }
    y -= 8;
  }

  // Totals box
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

  // Footer
  page.drawText(`📞 ${HOTEL_PHONES}`, { x: M, y: 50, size: 8, font, color: rgb(...muted) });
  page.drawText(`📍 ${HOTEL_ADDRESS}`, { x: M, y: 38, size: 8, font, color: rgb(...muted) });
  page.drawText(`✉ ${HOTEL_EMAIL}`, { x: M, y: 26, size: 8, font, color: rgb(...muted) });
  page.drawText(`© ${new Date().getFullYear()} ${HOTEL_NAME_VI}`, { x: W - M - 180, y: 26, size: 8, font, color: rgb(...muted) });

  const bytes = await pdf.save();
  return { bytes, filename: `HoaDon-${inv.invoice_code}.pdf`, invoice: inv };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");
    const { bytes, filename } = await buildManualInvoicePdf(invoice_id);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return new Response(JSON.stringify({ pdf_base64: btoa(bin), pdf_name: filename }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

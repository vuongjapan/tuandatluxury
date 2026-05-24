// Generate manual-invoice PDFs with 2 variants:
//   variant='pending'    -> ⏳ CHỜ THANH TOÁN CỌC, có QR + hướng dẫn CK
//   variant='confirmed'  -> ✅ ĐÃ XÁC NHẬN, có block "Đã nhận cọc", KHÔNG QR
// Hỗ trợ multi-room qua cột room_lines (fallback về single room nếu null).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, PDFName, PDFArray, PDFString } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOTEL_NAME_VI = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa, Việt Nam";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 038.441.8811";
const HOTEL_EMAIL = "tuandatluxuryflc36hotel@gmail.com";
const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/Tuan+Dat+Luxury+FLC+Sam+Son+Thanh+Hoa";
const VA_BANK = "BIDV";
const VA_ACCOUNT = "96247TUANDATLUXURY";
const VA_HOLDER = "VAN DINH GIANG";

const FONT_REGULAR_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const FONT_BOLD_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf";

let cR: Uint8Array | null = null;
let cB: Uint8Array | null = null;
async function loadFont(url: string, b: boolean): Promise<Uint8Array> {
  if (!b && cR) return cR;
  if (b && cB) return cB;
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  if (b) cB = buf; else cR = buf;
  return buf;
}

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "đ";
function formatDate(s?: string | null): string {
  if (!s) return "—";
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return s;
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface DrawCtx { page: any; pdf: PDFDocument; font: any; fontBold: any; width: number; height: number; y: number; margin: number; }

function newPage(ctx: DrawCtx): DrawCtx {
  const page = ctx.pdf.addPage([595.28, 841.89]);
  return { ...ctx, page, y: 800 };
}
function ensureSpace(ctx: DrawCtx, n: number): DrawCtx {
  return ctx.y - n < 50 ? newPage(ctx) : ctx;
}
function drawText(ctx: DrawCtx, t: string, o: { x?: number; size?: number; bold?: boolean; color?: [number, number, number] } = {}): DrawCtx {
  const size = o.size ?? 10;
  const f = o.bold ? ctx.fontBold : ctx.font;
  const c = o.color ?? [0.2, 0.2, 0.2];
  ctx.page.drawText(String(t ?? ""), { x: o.x ?? ctx.margin, y: ctx.y, size, font: f, color: rgb(c[0], c[1], c[2]) });
  return ctx;
}
function drawRow(ctx: DrawCtx, label: string, value: string, o: { bold?: boolean; valueColor?: [number, number, number]; size?: number } = {}): DrawCtx {
  const size = o.size ?? 10;
  ctx = ensureSpace(ctx, size + 6);
  drawText(ctx, label, { size, color: [0.4, 0.4, 0.4] });
  const f = o.bold ? ctx.fontBold : ctx.font;
  const w = f.widthOfTextAtSize(value, size);
  ctx.page.drawText(value, {
    x: ctx.width - ctx.margin - w, y: ctx.y, size, font: f,
    color: o.valueColor ? rgb(o.valueColor[0], o.valueColor[1], o.valueColor[2]) : rgb(0.1, 0.1, 0.1),
  });
  ctx.y -= size + 6;
  return ctx;
}
function drawHr(ctx: DrawCtx, c: [number, number, number] = [0.85, 0.85, 0.85]): DrawCtx {
  ctx = ensureSpace(ctx, 8);
  ctx.page.drawLine({ start: { x: ctx.margin, y: ctx.y }, end: { x: ctx.width - ctx.margin, y: ctx.y }, thickness: 0.7, color: rgb(c[0], c[1], c[2]) });
  ctx.y -= 8;
  return ctx;
}
function drawSectionTitle(ctx: DrawCtx, title: string): DrawCtx {
  ctx = ensureSpace(ctx, 24);
  ctx.y -= 4;
  drawText(ctx, title, { size: 12, bold: true, color: [0.55, 0.41, 0.08] });
  ctx.y -= 16;
  return drawHr(ctx, [0.85, 0.74, 0.5]);
}
function drawBox(ctx: DrawCtx, h: number, fill: [number, number, number], border?: [number, number, number]): DrawCtx {
  ctx.page.drawRectangle({
    x: ctx.margin - 4, y: ctx.y - h + 12,
    width: ctx.width - 2 * ctx.margin + 8, height: h,
    color: rgb(fill[0], fill[1], fill[2]),
    borderColor: border ? rgb(border[0], border[1], border[2]) : undefined,
    borderWidth: border ? 1 : 0,
  });
  return ctx;
}
function drawHeader(ctx: DrawCtx, title: string, subtitle: string): DrawCtx {
  ctx.page.drawRectangle({ x: 0, y: ctx.height - 90, width: ctx.width, height: 90, color: rgb(0.55, 0.41, 0.08) });
  ctx.page.drawText(HOTEL_NAME_VI, { x: ctx.margin, y: ctx.height - 35, size: 18, font: ctx.fontBold, color: rgb(1, 1, 1) });
  ctx.page.drawText(title, { x: ctx.margin, y: ctx.height - 58, size: 14, font: ctx.fontBold, color: rgb(1, 0.95, 0.8) });
  ctx.page.drawText(subtitle, { x: ctx.margin, y: ctx.height - 78, size: 9, font: ctx.font, color: rgb(1, 1, 1) });
  ctx.y = ctx.height - 110;
  return ctx;
}
function drawFooter(ctx: DrawCtx) {
  const y = 35;
  ctx.page.drawLine({ start: { x: ctx.margin, y: y + 30 }, end: { x: ctx.width - ctx.margin, y: y + 30 }, thickness: 0.5, color: rgb(0.85, 0.74, 0.5) });
  ctx.page.drawText(`${HOTEL_NAME_VI}  •  ${HOTEL_PHONES}`, { x: ctx.margin, y: y + 15, size: 8, font: ctx.fontBold, color: rgb(0.55, 0.41, 0.08) });
  ctx.page.drawText(`${HOTEL_ADDRESS}  •  ${HOTEL_EMAIL}`, { x: ctx.margin, y: y + 3, size: 7.5, font: ctx.font, color: rgb(0.4, 0.4, 0.4) });
  ctx.page.drawText("Cảm ơn Quý khách đã lựa chọn chúng tôi!", { x: ctx.margin, y: y - 8, size: 7.5, font: ctx.font, color: rgb(0.5, 0.5, 0.5) });
}
function addLinkAnnotation(ctx: DrawCtx, rect: [number, number, number, number], url: string) {
  const annotDict = ctx.pdf.context.obj({
    Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"), Rect: rect,
    Border: [0, 0, 0], F: 4, H: PDFName.of("N"),
    BS: ctx.pdf.context.obj({ Type: PDFName.of("Border"), W: 0, S: PDFName.of("S") }),
    P: ctx.page.ref,
    A: ctx.pdf.context.obj({ Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(url) }),
  });
  const ref = ctx.pdf.context.register(annotDict);
  let annots = ctx.page.node.lookup(PDFName.of("Annots"), PDFArray);
  if (!annots) {
    annots = ctx.pdf.context.obj([]) as PDFArray;
    ctx.page.node.set(PDFName.of("Annots"), annots);
  }
  annots.push(ref);
}
function drawCompactMap(ctx: DrawCtx) {
  const y = 95;
  ctx.page.drawRectangle({
    x: ctx.margin - 4, y: y - 8,
    width: ctx.width - 2 * ctx.margin + 8, height: 44,
    color: rgb(0.96, 0.91, 0.78), borderColor: rgb(0.78, 0.63, 0.25), borderWidth: 1,
  });
  ctx.page.drawText("📍 " + HOTEL_NAME_VI, { x: ctx.margin, y: y + 22, size: 9.5, font: ctx.fontBold, color: rgb(0.48, 0.37, 0.16) });
  ctx.page.drawText(HOTEL_ADDRESS, { x: ctx.margin, y: y + 10, size: 8, font: ctx.font, color: rgb(0.4, 0.4, 0.4) });
  const btnX = ctx.width - ctx.margin - 140, btnY = y + 6, btnW = 136, btnH = 22;
  ctx.page.drawRectangle({ x: btnX, y: btnY, width: btnW, height: btnH, color: rgb(0.08, 0.4, 0.75) });
  const tt = "Mở Google Maps";
  const tw = ctx.fontBold.widthOfTextAtSize(tt, 9.5);
  ctx.page.drawText(tt, { x: btnX + (btnW - tw) / 2, y: btnY + 7, size: 9.5, font: ctx.fontBold, color: rgb(1, 1, 1) });
  addLinkAnnotation(ctx, [btnX, btnY, btnX + btnW, btnY + btnH], GOOGLE_MAPS_URL);
}

interface RoomLine { room_name: string; room_count: number; nights: number; price_per_night: number; line_total: number }

function getRoomLines(inv: any): RoomLine[] {
  if (Array.isArray(inv.room_lines) && inv.room_lines.length > 0) {
    return inv.room_lines.map((l: any) => ({
      room_name: l.room_name || 'Phòng',
      room_count: l.room_count || 1,
      nights: l.nights || 1,
      price_per_night: l.price_per_night || 0,
      line_total: l.line_total ?? ((l.price_per_night || 0) * (l.room_count || 1) * (l.nights || 1)),
    }));
  }
  if (inv.room_name && (inv.room_subtotal || 0) > 0) {
    return [{
      room_name: inv.room_name,
      room_count: inv.room_quantity || 1,
      nights: inv.nights || 1,
      price_per_night: inv.room_price_per_night || 0,
      line_total: inv.room_subtotal || 0,
    }];
  }
  return [];
}

async function buildPdf(inv: any, items: any[], variant: 'pending' | 'confirmed'): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFont(FONT_REGULAR_URL, false), { subset: true });
  const fontBold = await pdf.embedFont(await loadFont(FONT_BOLD_URL, true), { subset: true });
  const page = pdf.addPage([595.28, 841.89]);
  let ctx: DrawCtx = { pdf, page, font, fontBold, width: 595.28, height: 841.89, y: 800, margin: 40 };

  const isConfirmed = variant === 'confirmed';
  const subtitle = isConfirmed ? "Đã nhận tiền cọc — Đặt phòng đã xác nhận" : "Chờ thanh toán đặt cọc";
  ctx = drawHeader(ctx, "HÓA ĐƠN ĐẶT PHÒNG", subtitle);

  // Code + status badge
  ctx = ensureSpace(ctx, 56);
  const codeTop = ctx.y;
  ctx = drawBox(ctx, 52, [1, 0.97, 0.85], [0.85, 0.74, 0.5]);
  page.drawText("MÃ HÓA ĐƠN", { x: ctx.margin, y: codeTop, size: 9, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
  const badgeText = isConfirmed ? "✓ ĐÃ XÁC NHẬN" : "⏳ CHỜ THANH TOÁN CỌC";
  const badgeColor: [number, number, number] = isConfirmed ? [0.06, 0.6, 0.4] : [0.95, 0.55, 0.1];
  const badgeW = fontBold.widthOfTextAtSize(badgeText, 9) + 14;
  page.drawRectangle({ x: ctx.width - ctx.margin - badgeW, y: codeTop - 4, width: badgeW, height: 18, color: rgb(badgeColor[0], badgeColor[1], badgeColor[2]) });
  page.drawText(badgeText, { x: ctx.width - ctx.margin - badgeW + 7, y: codeTop, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(inv.invoice_code, { x: ctx.margin, y: codeTop - 22, size: 20, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
  ctx.y = codeTop - 46;

  // Confirmed: hiển thị block "Đã nhận đủ tiền cọc" ngay đầu
  if (isConfirmed) {
    ctx = ensureSpace(ctx, 64);
    const top = ctx.y;
    ctx = drawBox(ctx, 60, [0.92, 0.99, 0.94], [0.06, 0.6, 0.4]);
    page.drawText("✓ Đã nhận đủ tiền cọc", { x: ctx.margin, y: top, size: 12, font: fontBold, color: rgb(0.06, 0.5, 0.32) });
    page.drawText(`Số tiền: ${fmt(inv.deposit_amount)}`, { x: ctx.margin, y: top - 18, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Thời gian: ${formatDateTime(inv.deposit_paid_at || inv.confirmed_email_sent_at)}`, { x: ctx.margin, y: top - 34, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    ctx.y = top - 60;
  }

  // Thông tin khách
  ctx = drawSectionTitle(ctx, "👤 Thông tin khách hàng");
  ctx = drawRow(ctx, "Họ tên:", inv.guest_name || "", { bold: true });
  ctx = drawRow(ctx, "Số điện thoại:", inv.guest_phone || "—");
  if (inv.guest_email) ctx = drawRow(ctx, "Email:", inv.guest_email);
  if (inv.check_in) {
    ctx = drawRow(ctx, "Ngày nhận phòng:", formatDate(inv.check_in), { bold: true });
    ctx = drawRow(ctx, "Ngày trả phòng:", formatDate(inv.check_out), { bold: true });
  }
  ctx = drawRow(ctx, "Người lớn:", `${inv.guests_count || 0} người`);
  if ((inv.children_count || 0) > 0) ctx = drawRow(ctx, "Trẻ em:", `${inv.children_count} bé`);

  // Chi tiết phòng (multi-room)
  const roomLines = getRoomLines(inv);
  let roomsTotal = 0;
  if (roomLines.length > 0) {
    ctx = drawSectionTitle(ctx, "🏨 Chi tiết phòng");
    for (const rl of roomLines) {
      roomsTotal += rl.line_total;
      ctx = ensureSpace(ctx, 30);
      drawText(ctx, `• ${rl.room_name}`, { size: 10, bold: true });
      const right = fmt(rl.line_total);
      const w = fontBold.widthOfTextAtSize(right, 10);
      page.drawText(right, { x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
      ctx.y -= 13;
      drawText(ctx, `   ${fmt(rl.price_per_night)} × ${rl.room_count} phòng × ${rl.nights} đêm`, { size: 9, color: [0.5, 0.5, 0.5] });
      ctx.y -= 16;
    }
  }

  // Items (food/combo/service/custom)
  const meals = (inv.food_subtotal || 0) + (inv.custom_subtotal || 0);
  if (items.length > 0) {
    ctx = drawSectionTitle(ctx, "🍽 Món ăn / Dịch vụ");
    for (const it of items) {
      const lt = (it.unit_price || 0) * (it.quantity || 0);
      ctx = ensureSpace(ctx, 26);
      drawText(ctx, `• ${it.name || 'Mục'}`, { size: 10, bold: true });
      const r = fmt(lt);
      const w = fontBold.widthOfTextAtSize(r, 10);
      page.drawText(r, { x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
      ctx.y -= 13;
      drawText(ctx, `   ${fmt(it.unit_price)} × ${it.quantity}`, { size: 9, color: [0.5, 0.5, 0.5] });
      ctx.y -= 14;
    }
  }

  // Tổng hợp
  ctx = drawSectionTitle(ctx, "💰 Tổng hợp hóa đơn");
  if (roomsTotal > 0) ctx = drawRow(ctx, "Tổng tiền phòng:", fmt(roomsTotal));
  if (meals > 0) ctx = drawRow(ctx, "Tổng tiền ăn / dịch vụ:", fmt(meals));
  if ((inv.discount_amount || 0) > 0) {
    ctx = drawRow(ctx, `Tổng giảm giá${inv.discount_note ? ` (${inv.discount_note})` : ''}:`, `-${fmt(inv.discount_amount)}`, { valueColor: [0.06, 0.6, 0.4] });
  }
  ctx = drawHr(ctx);
  ctx = drawRow(ctx, "TỔNG THANH TOÁN:", fmt(inv.total_amount), { bold: true, valueColor: [0.55, 0.41, 0.08], size: 13 });

  // Thanh toán block
  ctx = drawSectionTitle(ctx, "💳 Thanh toán");
  const deposit = inv.deposit_amount || 0;
  const remaining = isConfirmed
    ? Math.max(0, (inv.total_amount || 0) - deposit)
    : (inv.remaining_amount ?? Math.max(0, (inv.total_amount || 0) - deposit));

  if (isConfirmed) {
    ctx = drawRow(ctx, "Tiền cọc đã nhận:", fmt(deposit), { bold: true, valueColor: [0.06, 0.6, 0.4] });
    ctx = drawRow(ctx, "Còn lại thanh toán tại quầy:", fmt(remaining), { bold: true, valueColor: [0.85, 0.45, 0.05], size: 12 });
  } else {
    ctx = drawRow(ctx, "Tổng đơn:", fmt(inv.total_amount), { bold: true });
    ctx = drawRow(ctx, "Số tiền cần đặt cọc:", fmt(deposit > 0 ? deposit : Math.round((inv.total_amount || 0) * 0.5)), { bold: true, valueColor: [0.85, 0.15, 0.15], size: 12 });
    drawText(ctx, "⚠ Đặt phòng được xác nhận sau khi nhận cọc.", { size: 9, color: [0.7, 0.3, 0.05] });
    ctx.y -= 14;
  }

  // QR + hướng dẫn CK — chỉ pending
  if (!isConfirmed) {
    const depositToPay = deposit > 0 ? deposit : Math.round((inv.total_amount || 0) * 0.5);
    ctx = drawSectionTitle(ctx, "🏦 Hướng dẫn chuyển khoản cọc");
    ctx = ensureSpace(ctx, 160);
    const top = ctx.y;
    const boxH = 150;
    page.drawRectangle({
      x: ctx.margin - 4, y: top - boxH + 12,
      width: ctx.width - 2 * ctx.margin + 8, height: boxH,
      color: rgb(1, 0.96, 0.84), borderColor: rgb(0.85, 0.45, 0.05), borderWidth: 1,
    });
    const qrSize = 120;
    const qrX = ctx.width - ctx.margin - qrSize - 4;
    const qrY = top - boxH + 18;
    try {
      const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositToPay}&des=${encodeURIComponent(inv.invoice_code)}`;
      const r = await fetch(qrUrl);
      if (r.ok) {
        const bytes = new Uint8Array(await r.arrayBuffer());
        const img = await pdf.embedPng(bytes).catch(async () => await pdf.embedJpg(bytes));
        page.drawImage(img, { x: qrX, y: qrY, width: qrSize, height: qrSize });
      }
    } catch (e) { console.error("QR fail:", e); }
    const labelX = ctx.margin, valueX = ctx.margin + 110;
    let iy = top;
    const di = (l: string, v: string, o: { bold?: boolean; color?: [number, number, number]; size?: number } = {}) => {
      const sz = o.size ?? 10;
      page.drawText(l, { x: labelX, y: iy, size: sz, font, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(v, { x: valueX, y: iy, size: sz, font: o.bold ? fontBold : font, color: o.color ? rgb(o.color[0], o.color[1], o.color[2]) : rgb(0.1, 0.1, 0.1) });
      iy -= sz + 6;
    };
    di("Ngân hàng:", VA_BANK, { bold: true });
    di("Số tài khoản:", VA_ACCOUNT, { bold: true });
    di("Chủ tài khoản:", VA_HOLDER, { bold: true });
    di("Nội dung CK:", inv.invoice_code, { bold: true, color: [0.85, 0.45, 0.05], size: 11 });
    di("Số tiền:", fmt(depositToPay), { bold: true, color: [0.86, 0.15, 0.15], size: 12 });
    ctx.y = top - boxH - 4;
    drawText(ctx, "⚠ Vui lòng chuyển ĐÚNG nội dung và số tiền để hệ thống tự xác nhận.", { size: 9, color: [0.7, 0.3, 0.05] });
    ctx.y -= 16;
  }

  if (inv.notes) {
    ctx = drawSectionTitle(ctx, "📝 Ghi chú");
    drawText(ctx, inv.notes, { size: 9, color: [0.3, 0.3, 0.3] });
    ctx.y -= 14;
  }

  drawCompactMap(ctx);
  drawFooter(ctx);
  return await pdf.save();
}

function uint8ToB64(b: Uint8Array): string {
  let s = ""; const ck = 0x8000;
  for (let i = 0; i < b.byteLength; i += ck) s += String.fromCharCode.apply(null, b.subarray(i, i + ck) as any);
  return btoa(s);
}

export async function buildManualInvoicePdf(invoice_id: string, variant: 'pending' | 'confirmed'): Promise<{ pdf: Uint8Array; pdf_name: string; invoice: any }> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: inv, error } = await supabase.from("manual_invoices").select("*").eq("id", invoice_id).single();
  if (error || !inv) throw new Error("Invoice not found");
  const { data: items } = await supabase.from("manual_invoice_items").select("*").eq("invoice_id", invoice_id).order("sort_order");
  const pdf = await buildPdf(inv, items || [], variant);
  const suffix = variant === 'confirmed' ? 'DaCoc' : 'ChoCoc';
  return { pdf, pdf_name: `HoaDon_${suffix}_${inv.invoice_code}.pdf`, invoice: inv };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const invoice_id = body.invoice_id;
    if (!invoice_id) throw new Error("invoice_id required");

    // Auto-detect variant from status if not provided
    let variant: 'pending' | 'confirmed' = body.variant;
    if (!variant) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: inv } = await supabase.from("manual_invoices").select("payment_status").eq("id", invoice_id).single();
      variant = (inv?.payment_status === 'DEPOSIT_PAID' || inv?.payment_status === 'PAID') ? 'confirmed' : 'pending';
    }

    const { pdf, pdf_name } = await buildManualInvoicePdf(invoice_id, variant);
    const b64 = uint8ToB64(pdf);
    return new Response(JSON.stringify({
      pdf_base64: b64,
      pdf_name,
      variant,
      // Back-compat fields
      pdf1_base64: b64,
      pdf1_name: pdf_name,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("generate-manual-invoice-pdf error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

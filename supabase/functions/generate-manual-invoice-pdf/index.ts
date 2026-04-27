// Generate 2 manual-invoice PDFs (Summary + Detail) — same look & feel as booking PDFs.
// Returns { pdf1_base64, pdf2_base64, pdf1_name, pdf2_name } so email/UI can reuse the same flow.
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
function drawMapSection(ctx: DrawCtx): DrawCtx {
  ctx = drawSectionTitle(ctx, "📍 Vị trí khách sạn");
  ctx = ensureSpace(ctx, 90);
  const top = ctx.y;
  ctx.page.drawRectangle({
    x: ctx.margin - 4, y: top - 84 + 12,
    width: ctx.width - 2 * ctx.margin + 8, height: 84,
    color: rgb(0.96, 0.91, 0.78), borderColor: rgb(0.78, 0.63, 0.25), borderWidth: 1,
  });
  ctx.page.drawText(HOTEL_NAME_VI, { x: ctx.margin, y: top, size: 11, font: ctx.fontBold, color: rgb(0.48, 0.37, 0.16) });
  ctx.page.drawText(HOTEL_ADDRESS, { x: ctx.margin, y: top - 16, size: 9, font: ctx.font, color: rgb(0.4, 0.4, 0.4) });
  const btnX = ctx.margin, btnY = top - 50, btnW = 160, btnH = 24;
  ctx.page.drawRectangle({ x: btnX, y: btnY, width: btnW, height: btnH, color: rgb(0.08, 0.4, 0.75) });
  const tt = "Mở Google Maps";
  const tw = ctx.fontBold.widthOfTextAtSize(tt, 10);
  ctx.page.drawText(tt, { x: btnX + (btnW - tw) / 2, y: btnY + 8, size: 10, font: ctx.fontBold, color: rgb(1, 1, 1) });
  addLinkAnnotation(ctx, [btnX, btnY, btnX + btnW, btnY + btnH], GOOGLE_MAPS_URL);
  ctx.page.drawText("Hoặc mở link bên dưới:", { x: btnX + btnW + 12, y: btnY + 14, size: 8, font: ctx.font, color: rgb(0.5, 0.5, 0.5) });
  const url = "https://maps.app.goo.gl/TuanDatLuxury";
  ctx.page.drawText(url, { x: btnX + btnW + 12, y: btnY + 2, size: 8.5, font: ctx.fontBold, color: rgb(0.08, 0.4, 0.75) });
  const uw = ctx.fontBold.widthOfTextAtSize(url, 8.5);
  addLinkAnnotation(ctx, [btnX + btnW + 12, btnY + 1, btnX + btnW + 12 + uw, btnY + 11], GOOGLE_MAPS_URL);
  ctx.y = top - 90;
  return ctx;
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

async function buildSummary(inv: any, items: any[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFont(FONT_REGULAR_URL, false), { subset: true });
  const fontBold = await pdf.embedFont(await loadFont(FONT_BOLD_URL, true), { subset: true });
  const page = pdf.addPage([595.28, 841.89]);
  let ctx: DrawCtx = { pdf, page, font, fontBold, width: 595.28, height: 841.89, y: 800, margin: 40 };

  const isPaid = inv.payment_status === "PAID";
  const isPartial = inv.payment_status === "PARTIAL" || (inv.deposit_amount > 0 && !isPaid);
  const subtitle = isPaid ? "Đã thanh toán đầy đủ" : isPartial ? "Đã đặt cọc một phần" : "Chờ thanh toán đặt cọc";
  ctx = drawHeader(ctx, "HÓA ĐƠN ĐẶT PHÒNG", subtitle);

  ctx = ensureSpace(ctx, 56);
  const codeTop = ctx.y;
  ctx = drawBox(ctx, 52, [1, 0.97, 0.85], [0.85, 0.74, 0.5]);
  page.drawText("MÃ HÓA ĐƠN", { x: ctx.margin, y: codeTop, size: 9, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
  const badgeText = isPaid ? "✓ ĐÃ THANH TOÁN" : isPartial ? "💰 ĐÃ CỌC" : "⏳ CHƯA THANH TOÁN";
  const badgeColor: [number, number, number] = isPaid ? [0.06, 0.6, 0.4] : isPartial ? [0.85, 0.45, 0.05] : [0.7, 0.35, 0.05];
  const badgeW = fontBold.widthOfTextAtSize(badgeText, 9) + 14;
  page.drawRectangle({ x: ctx.width - ctx.margin - badgeW, y: codeTop - 4, width: badgeW, height: 18, color: rgb(badgeColor[0], badgeColor[1], badgeColor[2]) });
  page.drawText(badgeText, { x: ctx.width - ctx.margin - badgeW + 7, y: codeTop, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(inv.invoice_code, { x: ctx.margin, y: codeTop - 22, size: 20, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
  ctx.y = codeTop - 46;

  ctx = drawSectionTitle(ctx, "👤 Thông tin khách hàng");
  ctx = drawRow(ctx, "Họ tên:", inv.guest_name || "", { bold: true });
  ctx = drawRow(ctx, "Số điện thoại:", inv.guest_phone || "—");
  if (inv.guest_email) ctx = drawRow(ctx, "Email:", inv.guest_email);
  if (inv.check_in) {
    ctx = drawRow(ctx, "Ngày nhận phòng:", formatDate(inv.check_in), { bold: true });
    ctx = drawRow(ctx, "Ngày trả phòng:", formatDate(inv.check_out), { bold: true });
    ctx = drawRow(ctx, "Số đêm:", `${inv.nights || 1} đêm`);
  }
  if (inv.room_quantity) ctx = drawRow(ctx, "Số phòng:", `${inv.room_quantity} phòng`);
  ctx = drawRow(ctx, "Người lớn:", `${inv.guests_count || 0} người`);
  if ((inv.children_count || 0) > 0) ctx = drawRow(ctx, "Trẻ em:", `${inv.children_count} bé`);

  ctx = drawSectionTitle(ctx, "💰 Tổng hợp hóa đơn");
  if ((inv.room_subtotal || 0) > 0) ctx = drawRow(ctx, "Tổng tiền phòng:", fmt(inv.room_subtotal));
  const meals = (inv.food_subtotal || 0) + (inv.custom_subtotal || 0);
  if (meals > 0) ctx = drawRow(ctx, "Tổng tiền ăn / dịch vụ:", fmt(meals));
  if ((inv.discount_amount || 0) > 0) {
    ctx = drawRow(ctx, "Tổng giảm giá:", `-${fmt(inv.discount_amount)}`, { valueColor: [0.06, 0.6, 0.4] });
    if (inv.discount_note) ctx = drawRow(ctx, `  • ${inv.discount_note}:`, `-${fmt(inv.discount_amount)}`, { size: 9, valueColor: [0.06, 0.6, 0.4] });
  }
  ctx = drawHr(ctx);
  ctx = drawRow(ctx, "TỔNG THANH TOÁN:", fmt(inv.total_amount), { bold: true, valueColor: [0.55, 0.41, 0.08], size: 13 });

  ctx = drawSectionTitle(ctx, "💳 Thanh toán");
  const deposit = inv.deposit_amount || 0;
  const remaining = inv.remaining_amount || (inv.total_amount - deposit);
  if (deposit > 0) ctx = drawRow(ctx, "Đã đặt cọc:", fmt(deposit), { bold: true, valueColor: [0.06, 0.6, 0.4] });
  ctx = drawRow(ctx, "Còn lại:", fmt(remaining), { bold: true, valueColor: [0.85, 0.45, 0.05] });

  if (!isPaid && remaining > 0) {
    ctx = drawSectionTitle(ctx, "🏦 Hướng dẫn chuyển khoản");
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
      const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${remaining}&des=${encodeURIComponent(inv.invoice_code)}`;
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
    di("Số tiền:", fmt(remaining), { bold: true, color: [0.86, 0.15, 0.15], size: 12 });
    ctx.y = top - boxH - 4;
    drawText(ctx, "⚠ Vui lòng chuyển ĐÚNG nội dung và số tiền để hệ thống tự xác nhận.", { size: 9, color: [0.7, 0.3, 0.05] });
    ctx.y -= 16;
  } else if (isPaid) {
    ctx = drawSectionTitle(ctx, "✓ Xác nhận thanh toán");
    ctx = ensureSpace(ctx, 50);
    ctx = drawBox(ctx, 44, [0.92, 0.99, 0.94], [0.06, 0.6, 0.4]);
    drawText(ctx, "✓ Đã thanh toán đầy đủ", { size: 12, bold: true, color: [0.06, 0.5, 0.32] });
    ctx.y -= 16;
    drawText(ctx, `Tổng: ${fmt(inv.total_amount)}`, { size: 10, bold: true });
    ctx.y -= 16;
  }

  drawCompactMap(ctx);
  drawFooter(ctx);
  return await pdf.save();
}

async function buildDetail(inv: any, items: any[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFont(FONT_REGULAR_URL, false), { subset: true });
  const fontBold = await pdf.embedFont(await loadFont(FONT_BOLD_URL, true), { subset: true });
  const page = pdf.addPage([595.28, 841.89]);
  let ctx: DrawCtx = { pdf, page, font, fontBold, width: 595.28, height: 841.89, y: 800, margin: 40 };

  ctx = drawHeader(ctx, "CHI TIẾT DỊCH VỤ", `${inv.invoice_code} • ${inv.guest_name}`);

  ctx = ensureSpace(ctx, 40);
  ctx = drawBox(ctx, 36, [0.98, 0.96, 0.9]);
  drawText(ctx, `Mã đặt: ${inv.invoice_code}   •   Khách: ${inv.guest_name}`, { size: 10, bold: true });
  ctx.y -= 14;
  drawText(ctx, `Nhận phòng: ${formatDate(inv.check_in)}   •   Trả phòng: ${formatDate(inv.check_out)}`, { size: 9, color: [0.4, 0.4, 0.4] });
  ctx.y -= 22;

  let roomsTotal = 0;
  if (inv.room_name && (inv.room_subtotal || 0) > 0) {
    ctx = drawSectionTitle(ctx, "🏨 Chi tiết phòng");
    const qty = inv.room_quantity || 1, nights = inv.nights || 1;
    const sub = inv.room_subtotal || 0;
    const nightly = inv.room_price_per_night || (qty * nights > 0 ? Math.round(sub / (qty * nights)) : 0);
    roomsTotal += sub;
    ctx = ensureSpace(ctx, 30);
    drawText(ctx, `• ${inv.room_name}`, { size: 10, bold: true });
    const right = fmt(sub);
    const w = fontBold.widthOfTextAtSize(right, 10);
    page.drawText(right, { x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
    ctx.y -= 13;
    drawText(ctx, `   ${fmt(nightly)} × ${nights} đêm × ${qty} phòng`, { size: 9, color: [0.5, 0.5, 0.5] });
    ctx.y -= 16;
  }

  const combos = items.filter(i => i.item_type === 'combo');
  const foods = items.filter(i => i.item_type === 'food');
  const services = items.filter(i => i.item_type === 'service');
  const customs = items.filter(i => i.item_type === 'custom');

  let mealTotal = 0;
  if (combos.length > 0) {
    ctx = drawSectionTitle(ctx, "🍱 Suất ăn (Combo)");
    for (const c of combos) {
      const lt = (c.unit_price || 0) * (c.quantity || 0);
      mealTotal += lt;
      ctx = ensureSpace(ctx, 26);
      drawText(ctx, `• ${c.name}`, { size: 10, bold: true });
      const r = fmt(lt);
      const w = fontBold.widthOfTextAtSize(r, 10);
      page.drawText(r, { x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
      ctx.y -= 13;
      drawText(ctx, `   ${fmt(c.unit_price)} × ${c.quantity}`, { size: 9, color: [0.5, 0.5, 0.5] });
      ctx.y -= 16;
    }
  }
  if (foods.length > 0) {
    ctx = drawSectionTitle(ctx, "🛒 Món ăn");
    for (let i = 0; i < foods.length; i++) {
      const f = foods[i];
      const lt = (f.unit_price || 0) * (f.quantity || 0);
      mealTotal += lt;
      ctx = ensureSpace(ctx, 26);
      drawText(ctx, `${i + 1}. ${f.name}`, { size: 10, bold: true });
      const r = fmt(lt);
      const w = fontBold.widthOfTextAtSize(r, 10);
      page.drawText(r, { x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
      ctx.y -= 13;
      drawText(ctx, `   ${fmt(f.unit_price)} × ${f.quantity}`, { size: 9, color: [0.5, 0.5, 0.5] });
      ctx.y -= 16;
    }
  }
  let serviceTotal = 0;
  if (services.length > 0) {
    ctx = drawSectionTitle(ctx, "🛎 Dịch vụ");
    for (const s of services) {
      const lt = (s.unit_price || 0) * (s.quantity || 0);
      serviceTotal += lt;
      ctx = ensureSpace(ctx, 22);
      drawText(ctx, `• ${s.name}`, { size: 10, bold: true });
      const r = fmt(lt);
      const w = fontBold.widthOfTextAtSize(r, 10);
      page.drawText(r, { x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
      ctx.y -= 13;
      drawText(ctx, `   ${fmt(s.unit_price)} × ${s.quantity}`, { size: 9, color: [0.5, 0.5, 0.5] });
      ctx.y -= 14;
    }
  }
  let customTotal = 0;
  if (customs.length > 0) {
    ctx = drawSectionTitle(ctx, "✨ Mục tự do");
    for (const c of customs) {
      const lt = (c.unit_price || 0) * (c.quantity || 0);
      customTotal += lt;
      ctx = ensureSpace(ctx, 22);
      drawText(ctx, `• ${c.name || 'Mục'}`, { size: 10, bold: true });
      const r = fmt(lt);
      const w = fontBold.widthOfTextAtSize(r, 10);
      page.drawText(r, { x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08) });
      ctx.y -= 13;
      drawText(ctx, `   ${fmt(c.unit_price)} × ${c.quantity}`, { size: 9, color: [0.5, 0.5, 0.5] });
      ctx.y -= 14;
    }
  }

  ctx = drawSectionTitle(ctx, "📊 Bảng tổng cộng");
  if (roomsTotal > 0) ctx = drawRow(ctx, `Tổng tiền phòng (${inv.nights || 1} đêm × ${inv.room_quantity || 1} phòng):`, fmt(roomsTotal), { bold: true });
  if (mealTotal > 0) ctx = drawRow(ctx, "Tổng tiền ăn:", fmt(mealTotal), { bold: true });
  if (serviceTotal > 0) ctx = drawRow(ctx, "Tổng dịch vụ:", fmt(serviceTotal), { bold: true });
  if (customTotal > 0) ctx = drawRow(ctx, "Tổng mục tự do:", fmt(customTotal), { bold: true });
  if ((inv.discount_amount || 0) > 0) {
    ctx = drawRow(ctx, "Tổng giảm giá:", `-${fmt(inv.discount_amount)}`, { bold: true, valueColor: [0.06, 0.6, 0.4] });
    if (inv.discount_note) ctx = drawRow(ctx, `  • ${inv.discount_note}`, '', { size: 9 });
  }
  ctx = drawHr(ctx);
  ctx = drawRow(ctx, "TỔNG CỘNG:", fmt(inv.total_amount), { bold: true, valueColor: [0.55, 0.41, 0.08], size: 13 });

  ctx = drawMapSection(ctx);
  drawFooter(ctx);
  return await pdf.save();
}

function uint8ToB64(b: Uint8Array): string {
  let s = ""; const ck = 0x8000;
  for (let i = 0; i < b.byteLength; i += ck) s += String.fromCharCode.apply(null, b.subarray(i, i + ck) as any);
  return btoa(s);
}

export async function buildManualInvoicePdfs(invoice_id: string): Promise<{ pdf1: Uint8Array; pdf2: Uint8Array; pdf1_name: string; pdf2_name: string; invoice: any }> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: inv, error } = await supabase.from("manual_invoices").select("*").eq("id", invoice_id).single();
  if (error || !inv) throw new Error("Invoice not found");
  const { data: items } = await supabase.from("manual_invoice_items").select("*").eq("invoice_id", invoice_id).order("sort_order");
  const its = items || [];
  const [pdf1, pdf2] = await Promise.all([buildSummary(inv, its), buildDetail(inv, its)]);
  return {
    pdf1, pdf2,
    pdf1_name: `HoaDon_TomTat_${inv.invoice_code}.pdf`,
    pdf2_name: `HoaDon_ChiTiet_${inv.invoice_code}.pdf`,
    invoice: inv,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");
    const { pdf1, pdf2, pdf1_name, pdf2_name } = await buildManualInvoicePdfs(invoice_id);
    return new Response(JSON.stringify({
      pdf1_base64: uint8ToB64(pdf1),
      pdf2_base64: uint8ToB64(pdf2),
      pdf1_name, pdf2_name,
      pdf_base64: uint8ToB64(pdf1),
      pdf_name: pdf1_name,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("generate-manual-invoice-pdf error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Generate 2 booking PDFs (Summary + Detail) using pdf-lib + fontkit (Noto Sans for Vietnamese)
// Returns { pdf1_base64, pdf2_base64, pdf1_name, pdf2_name }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFName, PDFArray, PDFDict, PDFString } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const HOTEL_NAME = "Tuan Dat Luxury Hotel";
const HOTEL_NAME_VI = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa, Việt Nam";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 038.441.8811";
const HOTEL_EMAIL = "tuandatluxuryflc36hotel@gmail.com";
const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/Tuan+Dat+Luxury+FLC+Sam+Son+Thanh+Hoa";
const VA_BANK = "BIDV";
const VA_ACCOUNT = "96247TUANDATLUXURY";
const VA_HOLDER = "VAN DINH GIANG";

// Noto Sans Vietnamese (regular + bold) — supports full Vietnamese diacritics
const FONT_REGULAR_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const FONT_BOLD_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf";

let cachedRegular: Uint8Array | null = null;
let cachedBold: Uint8Array | null = null;

async function loadFont(url: string, cache: 'r' | 'b'): Promise<Uint8Array> {
  if (cache === 'r' && cachedRegular) return cachedRegular;
  if (cache === 'b' && cachedBold) return cachedBold;
  const res = await fetch(url);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (cache === 'r') cachedRegular = buf;
  else cachedBold = buf;
  return buf;
}

function fmt(n: number): string {
  return (n || 0).toLocaleString("vi-VN") + "đ";
}

function formatDate(s: string): string {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

interface DrawCtx {
  page: any;
  pdf: PDFDocument;
  font: any;
  fontBold: any;
  width: number;
  height: number;
  y: number;
  margin: number;
}

function newPage(ctx: DrawCtx): DrawCtx {
  const page = ctx.pdf.addPage([595.28, 841.89]); // A4
  return { ...ctx, page, y: 800 };
}

function ensureSpace(ctx: DrawCtx, needed: number): DrawCtx {
  if (ctx.y - needed < 50) return newPage(ctx);
  return ctx;
}

function drawText(ctx: DrawCtx, text: string, opts: {
  x?: number; size?: number; bold?: boolean; color?: [number, number, number]; maxWidth?: number;
} = {}): DrawCtx {
  const size = opts.size ?? 10;
  const bold = opts.bold ?? false;
  const color = opts.color ?? [0.2, 0.2, 0.2];
  const x = opts.x ?? ctx.margin;
  const font = bold ? ctx.fontBold : ctx.font;
  const safeText = String(text ?? "");
  ctx.page.drawText(safeText, {
    x, y: ctx.y, size, font,
    color: rgb(color[0], color[1], color[2]),
  });
  return ctx;
}

function drawRow(ctx: DrawCtx, label: string, value: string, opts: { bold?: boolean; valueColor?: [number, number, number]; size?: number } = {}): DrawCtx {
  const size = opts.size ?? 10;
  ctx = ensureSpace(ctx, size + 6);
  drawText(ctx, label, { size, color: [0.4, 0.4, 0.4] });
  const valueWidth = (opts.bold ? ctx.fontBold : ctx.font).widthOfTextAtSize(value, size);
  ctx.page.drawText(value, {
    x: ctx.width - ctx.margin - valueWidth,
    y: ctx.y, size,
    font: opts.bold ? ctx.fontBold : ctx.font,
    color: opts.valueColor ? rgb(...opts.valueColor) : rgb(0.1, 0.1, 0.1),
  });
  ctx.y -= size + 6;
  return ctx;
}

function drawHr(ctx: DrawCtx, color: [number, number, number] = [0.85, 0.85, 0.85]): DrawCtx {
  ctx = ensureSpace(ctx, 8);
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y },
    end: { x: ctx.width - ctx.margin, y: ctx.y },
    thickness: 0.7,
    color: rgb(color[0], color[1], color[2]),
  });
  ctx.y -= 8;
  return ctx;
}

function drawSectionTitle(ctx: DrawCtx, title: string): DrawCtx {
  ctx = ensureSpace(ctx, 24);
  ctx.y -= 4;
  drawText(ctx, title, { size: 12, bold: true, color: [0.55, 0.41, 0.08] });
  ctx.y -= 16;
  ctx = drawHr(ctx, [0.85, 0.74, 0.5]);
  return ctx;
}

function drawBox(ctx: DrawCtx, height: number, fill: [number, number, number], border?: [number, number, number]): DrawCtx {
  ctx.page.drawRectangle({
    x: ctx.margin - 4,
    y: ctx.y - height + 12,
    width: ctx.width - 2 * ctx.margin + 8,
    height,
    color: rgb(fill[0], fill[1], fill[2]),
    borderColor: border ? rgb(border[0], border[1], border[2]) : undefined,
    borderWidth: border ? 1 : 0,
  });
  return ctx;
}

function drawHeader(ctx: DrawCtx, title: string, subtitle: string): DrawCtx {
  // Gold band
  ctx.page.drawRectangle({
    x: 0, y: ctx.height - 90, width: ctx.width, height: 90,
    color: rgb(0.55, 0.41, 0.08),
  });
  ctx.page.drawText(HOTEL_NAME_VI, {
    x: ctx.margin, y: ctx.height - 35, size: 18, font: ctx.fontBold, color: rgb(1, 1, 1),
  });
  ctx.page.drawText(title, {
    x: ctx.margin, y: ctx.height - 58, size: 14, font: ctx.fontBold, color: rgb(1, 0.95, 0.8),
  });
  ctx.page.drawText(subtitle, {
    x: ctx.margin, y: ctx.height - 78, size: 9, font: ctx.font, color: rgb(1, 1, 1),
  });
  ctx.y = ctx.height - 110;
  return ctx;
}

function drawFooter(ctx: DrawCtx) {
  const y = 35;
  ctx.page.drawLine({
    start: { x: ctx.margin, y: y + 30 },
    end: { x: ctx.width - ctx.margin, y: y + 30 },
    thickness: 0.5, color: rgb(0.85, 0.74, 0.5),
  });
  ctx.page.drawText(`${HOTEL_NAME_VI}  •  ${HOTEL_PHONES}`, {
    x: ctx.margin, y: y + 15, size: 8, font: ctx.fontBold, color: rgb(0.55, 0.41, 0.08),
  });
  ctx.page.drawText(`${HOTEL_ADDRESS}  •  ${HOTEL_EMAIL}`, {
    x: ctx.margin, y: y + 3, size: 7.5, font: ctx.font, color: rgb(0.4, 0.4, 0.4),
  });
  ctx.page.drawText("Cảm ơn Quý khách đã lựa chọn chúng tôi!", {
    x: ctx.margin, y: y - 8, size: 7.5, font: ctx.font, color: rgb(0.5, 0.5, 0.5),
  });
}

function addLinkAnnotation(ctx: DrawCtx, rect: [number, number, number, number], url: string) {
  const annot = ctx.pdf.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: rect,
    Border: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of(url),
    },
  });
  const annotRef = ctx.pdf.context.register(annot);
  let annots = ctx.page.node.lookup(PDFName.of("Annots"), PDFArray);
  if (!annots) {
    annots = ctx.pdf.context.obj([]) as PDFArray;
    ctx.page.node.set(PDFName.of("Annots"), annots);
  }
  annots.push(annotRef);
}

function drawMapSection(ctx: DrawCtx): DrawCtx {
  ctx = drawSectionTitle(ctx, "📍 Vị trí khách sạn");
  ctx = ensureSpace(ctx, 90);

  // Box height 84 — draw box first as background
  const boxTop = ctx.y;
  ctx.page.drawRectangle({
    x: ctx.margin - 4,
    y: boxTop - 84 + 12,
    width: ctx.width - 2 * ctx.margin + 8,
    height: 84,
    color: rgb(0.96, 0.91, 0.78),
    borderColor: rgb(0.78, 0.63, 0.25),
    borderWidth: 1,
  });

  // Hotel name
  ctx.page.drawText(HOTEL_NAME_VI, {
    x: ctx.margin, y: boxTop, size: 11, font: ctx.fontBold, color: rgb(0.48, 0.37, 0.16),
  });
  // Address
  ctx.page.drawText(HOTEL_ADDRESS, {
    x: ctx.margin, y: boxTop - 16, size: 9, font: ctx.font, color: rgb(0.4, 0.4, 0.4),
  });

  // Blue button "Mở Google Maps"
  const btnX = ctx.margin;
  const btnY = boxTop - 50;
  const btnW = 160;
  const btnH = 24;
  ctx.page.drawRectangle({
    x: btnX, y: btnY, width: btnW, height: btnH,
    color: rgb(0.08, 0.4, 0.75),
  });
  const btnText = "Mở Google Maps";
  const tw = ctx.fontBold.widthOfTextAtSize(btnText, 10);
  ctx.page.drawText(btnText, {
    x: btnX + (btnW - tw) / 2,
    y: btnY + 8,
    size: 10, font: ctx.fontBold, color: rgb(1, 1, 1),
  });
  // Real clickable link annotation
  addLinkAnnotation(ctx, [btnX, btnY, btnX + btnW, btnY + btnH], GOOGLE_MAPS_URL);

  // Hint text next to the button
  ctx.page.drawText("Nhấn vào nút để mở bản đồ", {
    x: btnX + btnW + 12, y: btnY + 8, size: 8.5, font: ctx.font, color: rgb(0.5, 0.5, 0.5),
  });

  ctx.y = boxTop - 90;
  return ctx;
}

// Parse children count from guest_notes (e.g. "· 2 trẻ em đính kèm" or "2 trẻ em")
function parseChildren(notes?: string | null): number {
  if (!notes) return 0;
  const m = String(notes).match(/(\d+)\s*tr[ẻe]\s*em/i);
  return m ? parseInt(m[1], 10) : 0;
}

// =========================================
// PDF 1: SUMMARY
// =========================================
async function buildSummaryPdf(data: any): Promise<Uint8Array> {
  const { booking, roomName, combos, foodItems, isPaid } = data;

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await loadFont(FONT_REGULAR_URL, 'r');
  const boldBytes = await loadFont(FONT_BOLD_URL, 'b');
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const fontBold = await pdf.embedFont(boldBytes, { subset: true });
  const page = pdf.addPage([595.28, 841.89]);

  let ctx: DrawCtx = {
    pdf, page, font, fontBold,
    width: 595.28, height: 841.89, y: 800, margin: 40,
  };

  const subtitle = isPaid ? "Đã thanh toán đặt cọc" : "Chờ thanh toán đặt cọc";
  ctx = drawHeader(ctx, "HÓA ĐƠN ĐẶT PHÒNG", subtitle);

  // Booking code box
  ctx = ensureSpace(ctx, 50);
  ctx = drawBox(ctx, 46, [1, 0.97, 0.85], [0.85, 0.74, 0.5]);
  drawText(ctx, "MÃ ĐẶT PHÒNG", { size: 9, color: [0.55, 0.41, 0.08] });
  ctx.y -= 14;
  drawText(ctx, booking.booking_code, { size: 22, bold: true, color: [0.55, 0.41, 0.08] });
  // Status badge on right
  const badgeText = isPaid ? "✓ ĐÃ THANH TOÁN" : "⏳ CHƯA THANH TOÁN";
  const badgeColor: [number, number, number] = isPaid ? [0.06, 0.6, 0.4] : [0.85, 0.45, 0.05];
  const badgeW = fontBold.widthOfTextAtSize(badgeText, 10) + 14;
  page.drawRectangle({
    x: ctx.width - ctx.margin - badgeW,
    y: ctx.y + 4, width: badgeW, height: 22,
    color: rgb(badgeColor[0], badgeColor[1], badgeColor[2]),
  });
  page.drawText(badgeText, {
    x: ctx.width - ctx.margin - badgeW + 7,
    y: ctx.y + 11, size: 10, font: fontBold, color: rgb(1, 1, 1),
  });
  ctx.y -= 22;

  // Guest info
  const childrenCount = parseChildren(booking.guest_notes);
  const adultsCount = Math.max((booking.guests_count || 1) - childrenCount, 0);
  ctx = drawSectionTitle(ctx, "👤 Thông tin khách hàng");
  ctx = drawRow(ctx, "Họ tên:", booking.guest_name || "", { bold: true });
  ctx = drawRow(ctx, "Số điện thoại:", booking.guest_phone || "");
  if (booking.guest_email) ctx = drawRow(ctx, "Email:", booking.guest_email);
  ctx = drawRow(ctx, "Ngày nhận phòng:", formatDate(booking.check_in), { bold: true });
  ctx = drawRow(ctx, "Ngày trả phòng:", formatDate(booking.check_out), { bold: true });
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000
  );
  ctx = drawRow(ctx, "Số đêm:", `${nights} đêm`);
  ctx = drawRow(ctx, "Số phòng:", `${booking.room_quantity || 1} phòng`);
  ctx = drawRow(ctx, "Người lớn:", `${adultsCount} người`);
  if (childrenCount > 0) {
    ctx = drawRow(ctx, "Trẻ em:", `${childrenCount} bé`);
  }

  // Calculate sub-totals from booking + items
  let roomsSubtotal = booking.room_subtotal || 0;
  if (!roomsSubtotal && Array.isArray(booking.room_breakdown)) {
    roomsSubtotal = booking.room_breakdown.reduce((s: number, r: any) => s + (r.subtotal || 0), 0);
  }
  let combosSubtotal = 0;
  for (const c of (combos || [])) {
    const m = Number(c.meal_multiplier) || 1;
    combosSubtotal += (c.price_vnd || 0) * (c.quantity || 0) * m;
  }
  let foodSubtotal = 0;
  for (const f of (foodItems || [])) {
    const m = Number(f.meal_multiplier) || 1;
    foodSubtotal += (f.price_vnd || 0) * (f.quantity || 0) * m;
  }
  const mealsSubtotal = combosSubtotal + foodSubtotal;
  const extraSurcharge = booking.extra_person_surcharge || 0;

  // Totals — well structured
  ctx = drawSectionTitle(ctx, "💰 Tổng hợp hóa đơn");
  ctx = drawRow(ctx, "Tổng tiền phòng:", fmt(roomsSubtotal));
  if (extraSurcharge > 0) {
    ctx = drawRow(ctx, `Phụ thu ${booking.extra_person_count || 0} người:`, `+${fmt(extraSurcharge)}`, {
      valueColor: [0.85, 0.45, 0.05],
    });
  }
  if (mealsSubtotal > 0) {
    ctx = drawRow(ctx, "Tổng tiền ăn:", fmt(mealsSubtotal));
  }
  const totalDiscount =
    (booking.member_discount_amount || 0) +
    (booking.promotion_discount_amount || 0) +
    (booking.discount_code_amount || 0);
  if (totalDiscount > 0) {
    ctx = drawRow(ctx, "Tổng giảm giá:", `-${fmt(totalDiscount)}`, { valueColor: [0.06, 0.6, 0.4] });
    if (booking.discount_code) {
      ctx = drawRow(ctx, "  • Mã giảm giá:", `${booking.discount_code} (-${fmt(booking.discount_code_amount || 0)})`, {
        size: 9, valueColor: [0.06, 0.6, 0.4],
      });
    }
    if ((booking.promotion_discount_amount || 0) > 0) {
      ctx = drawRow(ctx, `  • ${booking.promotion_name || 'Khuyến mãi'}:`, `-${fmt(booking.promotion_discount_amount)}`, {
        size: 9, valueColor: [0.06, 0.6, 0.4],
      });
    }
    if ((booking.member_discount_amount || 0) > 0) {
      ctx = drawRow(ctx, `  • Ưu đãi thành viên (${booking.member_discount_percent || 0}%):`, `-${fmt(booking.member_discount_amount)}`, {
        size: 9, valueColor: [0.06, 0.6, 0.4],
      });
    }
  }
  ctx = drawHr(ctx);
  ctx = drawRow(ctx, "TỔNG THANH TOÁN:", fmt(booking.total_price_vnd), {
    bold: true, valueColor: [0.55, 0.41, 0.08], size: 13,
  });

  // Payment
  ctx = drawSectionTitle(ctx, "💳 Thanh toán");
  const deposit = booking.deposit_amount || Math.round(booking.total_price_vnd * 0.5);
  const remaining = booking.remaining_amount || (booking.total_price_vnd - deposit);
  ctx = drawRow(ctx, "Tiền cọc (50%):", fmt(deposit), { bold: true });
  ctx = drawRow(ctx, "Đã thanh toán:", isPaid ? fmt(deposit) : fmt(0), {
    bold: true, valueColor: isPaid ? [0.06, 0.6, 0.4] : [0.6, 0.6, 0.6],
  });
  ctx = drawRow(ctx, "Còn lại (thanh toán khi nhận phòng):", fmt(remaining), {
    bold: true, valueColor: [0.85, 0.45, 0.05],
  });

  // Payment details — bank info on LEFT, QR on RIGHT, no overlap
  if (!isPaid) {
    ctx = drawSectionTitle(ctx, "🏦 Hướng dẫn chuyển khoản đặt cọc");
    ctx = ensureSpace(ctx, 160);

    const boxTop = ctx.y;
    const boxH = 150;
    // Background box
    ctx.page.drawRectangle({
      x: ctx.margin - 4,
      y: boxTop - boxH + 12,
      width: ctx.width - 2 * ctx.margin + 8,
      height: boxH,
      color: rgb(1, 0.96, 0.84),
      borderColor: rgb(0.85, 0.45, 0.05),
      borderWidth: 1,
    });

    // QR on the right
    const qrSize = 120;
    const qrX = ctx.width - ctx.margin - qrSize - 4;
    const qrY = boxTop - boxH + 18;
    try {
      const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${deposit}&des=${encodeURIComponent(booking.booking_code)}`;
      const qrRes = await fetch(qrUrl);
      if (qrRes.ok) {
        const qrBytes = new Uint8Array(await qrRes.arrayBuffer());
        const qrImage = await pdf.embedPng(qrBytes).catch(async () => await pdf.embedJpg(qrBytes));
        page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
      }
    } catch (e) {
      console.error("QR fetch failed:", e);
    }

    // Bank info on the LEFT (limit width so it never reaches QR)
    const labelX = ctx.margin;
    const valueX = ctx.margin + 110;
    let infoY = boxTop;
    const drawInfo = (label: string, value: string, opts: { bold?: boolean; color?: [number, number, number]; size?: number } = {}) => {
      const sz = opts.size ?? 10;
      ctx.page.drawText(label, { x: labelX, y: infoY, size: sz, font, color: rgb(0.4, 0.4, 0.4) });
      ctx.page.drawText(value, {
        x: valueX, y: infoY, size: sz,
        font: opts.bold ? fontBold : font,
        color: opts.color ? rgb(...opts.color) : rgb(0.1, 0.1, 0.1),
      });
      infoY -= sz + 6;
    };
    drawInfo("Ngân hàng:", VA_BANK, { bold: true });
    drawInfo("Số tài khoản:", VA_ACCOUNT, { bold: true });
    drawInfo("Chủ tài khoản:", VA_HOLDER, { bold: true });
    drawInfo("Nội dung CK:", booking.booking_code, { bold: true, color: [0.85, 0.45, 0.05], size: 11 });
    drawInfo("Số tiền:", fmt(deposit), { bold: true, color: [0.86, 0.15, 0.15], size: 12 });

    ctx.y = boxTop - boxH - 4;
    drawText(ctx, "⚠ Vui lòng chuyển ĐÚNG nội dung và số tiền để hệ thống tự xác nhận.", {
      size: 9, color: [0.7, 0.3, 0.05],
    });
    ctx.y -= 16;
  } else {
    ctx = drawSectionTitle(ctx, "✓ Xác nhận thanh toán");
    ctx = ensureSpace(ctx, 50);
    ctx = drawBox(ctx, 44, [0.92, 0.99, 0.94], [0.06, 0.6, 0.4]);
    drawText(ctx, "✓ Đã nhận đủ tiền cọc", { size: 12, bold: true, color: [0.06, 0.5, 0.32] });
    ctx.y -= 16;
    drawText(ctx, `Số tiền: ${fmt(deposit)}`, { size: 10, bold: true });
    ctx.y -= 16;
  }

  // Map
  ctx = drawMapSection(ctx);
  drawFooter(ctx);

  return await pdf.save();
}

// =========================================
// PDF 2: DETAIL
// =========================================
async function buildDetailPdf(data: any): Promise<Uint8Array> {
  const { booking, roomName, combos, foodItems } = data;

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFont(FONT_REGULAR_URL, 'r'), { subset: true });
  const fontBold = await pdf.embedFont(await loadFont(FONT_BOLD_URL, 'b'), { subset: true });
  const page = pdf.addPage([595.28, 841.89]);

  let ctx: DrawCtx = {
    pdf, page, font, fontBold,
    width: 595.28, height: 841.89, y: 800, margin: 40,
  };

  ctx = drawHeader(ctx, "CHI TIẾT DỊCH VỤ", `${booking.booking_code} • ${booking.guest_name}`);

  // Mini summary
  ctx = ensureSpace(ctx, 40);
  ctx = drawBox(ctx, 36, [0.98, 0.96, 0.9]);
  drawText(ctx, `Mã đặt: ${booking.booking_code}   •   Khách: ${booking.guest_name}`, {
    size: 10, bold: true,
  });
  ctx.y -= 14;
  drawText(ctx, `Nhận phòng: ${formatDate(booking.check_in)}   •   Trả phòng: ${formatDate(booking.check_out)}`, {
    size: 9, color: [0.4, 0.4, 0.4],
  });
  ctx.y -= 22;

  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000
  );
  const roomQty = booking.room_quantity || 1;
  const mealMult = Number(booking.meal_multiplier) || 1;
  const mealLabel = booking.meal_time_label ||
    (booking.meal_time === 'lunch' ? 'Bữa trưa'
      : booking.meal_time === 'dinner' ? 'Bữa tối'
      : booking.meal_time === 'both' ? 'Cả 2 bữa (Trưa + Tối)' : null);

  // Rooms
  ctx = drawSectionTitle(ctx, "🏨 Chi tiết phòng");
  const roomBreakdown: any[] = Array.isArray(booking.room_breakdown) && booking.room_breakdown.length > 0
    ? booking.room_breakdown
    : [{ room_name: roomName, quantity: roomQty, subtotal: booking.room_subtotal || 0 }];
  let roomsTotal = 0;
  for (const r of roomBreakdown) {
    const qty = r.quantity || 1;
    const subtotal = r.subtotal || 0;
    const nightly = qty > 0 && nights > 0 ? Math.round(subtotal / (qty * nights)) : 0;
    roomsTotal += subtotal;
    ctx = ensureSpace(ctx, 30);
    drawText(ctx, `• ${r.room_name || roomName}`, { size: 10, bold: true });
    const right = fmt(subtotal);
    const w = fontBold.widthOfTextAtSize(right, 10);
    page.drawText(right, {
      x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08),
    });
    ctx.y -= 13;
    drawText(ctx, `   ${fmt(nightly)} × ${nights} đêm × ${qty} phòng`, {
      size: 9, color: [0.5, 0.5, 0.5],
    });
    ctx.y -= 16;
  }

  // Meal label
  if (mealLabel && (combos.length > 0 || foodItems.length > 0)) {
    ctx = ensureSpace(ctx, 24);
    drawText(ctx, `🍽 Bữa ăn: ${mealLabel}${mealMult > 1 ? ` (×${mealMult} giá)` : ''}`, {
      size: 10, bold: true, color: [0.85, 0.45, 0.05],
    });
    ctx.y -= 18;
  }

  // Combos
  let comboTotal = 0;
  if (combos && combos.length > 0) {
    ctx = drawSectionTitle(ctx, "🍱 Suất ăn (Combo)");
    for (const c of combos) {
      const itemMult = Number(c.meal_multiplier) || 1;
      const lineTotal = (c.price_vnd || 0) * (c.quantity || 0) * itemMult;
      comboTotal += lineTotal;
      ctx = ensureSpace(ctx, 30);
      const name = c.combo_package_name || c.combo_name || "Combo";
      drawText(ctx, `• ${name}`, { size: 10, bold: true });
      const right = fmt(lineTotal);
      const w = fontBold.widthOfTextAtSize(right, 10);
      page.drawText(right, {
        x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08),
      });
      ctx.y -= 13;
      const menuName = c.combo_menu_name || "";
      if (menuName) {
        drawText(ctx, `   Menu: ${menuName}`, { size: 9, color: [0.5, 0.5, 0.5] });
        ctx.y -= 12;
      }
      drawText(ctx, `   ${fmt(c.price_vnd || 0)}/người × ${c.quantity} suất${itemMult > 1 ? ` × ${itemMult} bữa` : ''}`, {
        size: 9, color: [0.5, 0.5, 0.5],
      });
      ctx.y -= 14;
      // Dishes
      const dishes: any[] = Array.isArray(c.dishes_snapshot) && c.dishes_snapshot.length > 0
        ? c.dishes_snapshot
        : (Array.isArray(c.dishes) ? c.dishes : []);
      if (dishes.length > 0) {
        const list = dishes.map((d: any, i: number) =>
          `      ${i + 1}. ${d.name_vi || d.name_en || d.name || ''}`
        ).join("\n");
        for (const line of list.split("\n")) {
          ctx = ensureSpace(ctx, 12);
          drawText(ctx, line, { size: 8.5, color: [0.4, 0.4, 0.4] });
          ctx.y -= 11;
        }
      }
      ctx.y -= 6;
    }
  }

  // Food items
  let foodTotal = 0;
  if (foodItems && foodItems.length > 0) {
    ctx = drawSectionTitle(ctx, "🛒 Món ăn đặt riêng");
    for (let i = 0; i < foodItems.length; i++) {
      const f: any = foodItems[i];
      const itemMult = Number(f.meal_multiplier) || 1;
      const lineTotal = (f.price_vnd || 0) * (f.quantity || 0) * itemMult;
      foodTotal += lineTotal;
      ctx = ensureSpace(ctx, 26);
      drawText(ctx, `${i + 1}. ${f.name}`, { size: 10, bold: true });
      const right = fmt(lineTotal);
      const w = fontBold.widthOfTextAtSize(right, 10);
      page.drawText(right, {
        x: ctx.width - ctx.margin - w, y: ctx.y, size: 10, font: fontBold, color: rgb(0.55, 0.41, 0.08),
      });
      ctx.y -= 13;
      drawText(ctx, `   ${fmt(f.price_vnd || 0)} × ${f.quantity}${itemMult > 1 ? ` × ${itemMult} bữa` : ''}`, {
        size: 9, color: [0.5, 0.5, 0.5],
      });
      ctx.y -= 16;
    }
  }

  // Totals
  ctx = drawSectionTitle(ctx, "📊 Bảng tổng cộng");
  ctx = drawRow(ctx, "Tiền phòng:", fmt(roomsTotal));
  if (booking.extra_person_surcharge > 0) {
    ctx = drawRow(ctx, `Phụ thu ${booking.extra_person_count || 0} người:`, `+${fmt(booking.extra_person_surcharge)}`, {
      valueColor: [0.85, 0.45, 0.05],
    });
  }
  if (comboTotal > 0) ctx = drawRow(ctx, "Suất ăn (combo):", fmt(comboTotal));
  if (foodTotal > 0) ctx = drawRow(ctx, "Món ăn riêng:", fmt(foodTotal));
  const totalDiscount =
    (booking.member_discount_amount || 0) +
    (booking.promotion_discount_amount || 0) +
    (booking.discount_code_amount || 0);
  if (totalDiscount > 0) {
    ctx = drawRow(ctx, "Tổng giảm giá:", `-${fmt(totalDiscount)}`, { valueColor: [0.06, 0.6, 0.4] });
  }
  ctx = drawHr(ctx);
  ctx = drawRow(ctx, "TỔNG CỘNG:", fmt(booking.total_price_vnd), {
    bold: true, valueColor: [0.55, 0.41, 0.08], size: 13,
  });

  // Map
  ctx = drawMapSection(ctx);
  drawFooter(ctx);

  return await pdf.save();
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunk = 0x8000;
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const { booking_id, booking_code, is_paid } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch booking
    let bookingQuery = supabase.from("bookings").select("*, rooms(name_vi)");
    if (booking_id) bookingQuery = bookingQuery.eq("id", booking_id);
    else if (booking_code) bookingQuery = bookingQuery.eq("booking_code", booking_code);
    else throw new Error("Missing booking_id or booking_code");

    const { data: booking, error } = await bookingQuery.maybeSingle();
    if (error || !booking) throw new Error("Booking not found");

    // Combos with dishes
    const { data: combos } = await supabase
      .from("booking_combos").select("*").eq("booking_id", booking.id);
    const combosWithDishes = await Promise.all((combos || []).map(async (c: any) => {
      let dishes = Array.isArray(c.dishes_snapshot) ? c.dishes_snapshot : [];
      if (dishes.length === 0 && c.combo_menu_id) {
        const { data: dd } = await supabase
          .from("combo_menu_dishes").select("name_vi, name_en, sort_order")
          .eq("combo_menu_id", c.combo_menu_id).order("sort_order");
        dishes = dd || [];
      }
      return { ...c, dishes };
    }));

    // Food items
    const { data: foodItems } = await supabase
      .from("booking_food_items").select("*").eq("booking_id", booking.id);

    const isPaid = is_paid !== undefined ? is_paid : booking.payment_status === "PAID";
    const data = {
      booking,
      roomName: booking.rooms?.name_vi || booking.room_id,
      combos: combosWithDishes,
      foodItems: foodItems || [],
      isPaid,
    };

    const [pdf1, pdf2] = await Promise.all([buildSummaryPdf(data), buildDetailPdf(data)]);

    return new Response(JSON.stringify({
      pdf1_base64: uint8ToBase64(pdf1),
      pdf2_base64: uint8ToBase64(pdf2),
      pdf1_name: `HoaDon_TomTat_${booking.booking_code}.pdf`,
      pdf2_name: `HoaDon_ChiTiet_${booking.booking_code}.pdf`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-booking-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

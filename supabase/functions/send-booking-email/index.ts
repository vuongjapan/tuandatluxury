
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
const HOTEL_NAME = "Tuấn Đạt Luxury Hotel";
const HOTEL_ADDRESS = "LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa, Việt Nam";
const HOTEL_PHONES = "098.360.5768 | 036.984.5422 | 098.661.7939";
const HOTEL_EMAIL_DISPLAY = "tuandatluxuryflc36hotel@gmail.com";

const VA_BANK = "BIDV";
const VA_ACCOUNT = "96247TUANDATLUXURY";
const VA_HOLDER = "VAN DINH GIANG";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmt(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

interface ComboWithDishes {
  id: string;
  combo_name: string;
  price_vnd: number;
  quantity: number;
  dining_item_id: string;
  dishes: { name_vi: string }[];
}

interface FoodItemData {
  name: string;
  price_vnd: number;
  quantity: number;
}

interface EmailData {
  booking: any;
  roomName: string;
  invoiceNumber: string;
  combos: ComboWithDishes[];
  foodItems: FoodItemData[];
  isPaid?: boolean;
}

function buildBookingInvoiceHtml(data: EmailData): string {
  const { booking, roomName, invoiceNumber, combos, foodItems, isPaid } = data;
  const checkIn = formatDate(booking.check_in);
  const checkOut = formatDate(booking.check_out);
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  );
  const roomQty = booking.room_quantity || 1;
  const comboTotal = combos.reduce((s: number, c: any) => s + c.price_vnd * c.quantity, 0);
  const indFoodTotal = foodItems.reduce((s: number, f: any) => s + f.price_vnd * f.quantity, 0);
  const extraSurcharge = booking.extra_person_surcharge || 0;
  const extraCount = booking.extra_person_count || 0;
  const originalPrice = booking.original_price_vnd || booking.total_price_vnd;
  const roomSubtotal = Math.max(0, originalPrice - comboTotal - indFoodTotal - extraSurcharge);
  const pricePerNight = nights > 0 && roomQty > 0 ? Math.round(roomSubtotal / nights / roomQty) : 0;
  const depositAmount = booking.deposit_amount || Math.round(booking.total_price_vnd * 0.5);
  const remainingAmount = booking.remaining_amount || (booking.total_price_vnd - depositAmount);
  const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositAmount}&des=${encodeURIComponent(booking.booking_code)}`;

  const promotionDiscount = booking.promotion_discount_amount || 0;
  const memberDiscount = booking.member_discount_amount || 0;
  const discountCodeAmt = booking.discount_code_amount || 0;
  const totalDiscount = promotionDiscount + memberDiscount + discountCodeAmt;
  const hasDiscount = totalDiscount > 0 || booking.discount_code;

  const statusBg = isPaid ? '#ECFDF5' : '#FEF3C7';
  const statusColor = isPaid ? '#059669' : '#D97706';
  const statusText = isPaid ? '✅ Đã cọc 50%' : '⏳ Chưa thanh toán';

  // === BUILD DISCOUNT SECTION ===
  let discountHtml = '';
  if (hasDiscount) {
    let rows = '';
    if (memberDiscount > 0) {
      rows += `<tr><td style="padding:4px 8px;background:#f0fdf4;border-radius:4px;font-size:12px;">⭐ Giảm giá thành viên (${booking.member_discount_percent || 0}%)</td><td style="text-align:right;padding:4px 8px;font-weight:700;color:#16a34a;font-size:12px;">-${fmt(memberDiscount)}</td></tr>`;
    }
    if (promotionDiscount > 0) {
      rows += `<tr><td style="padding:4px 8px;background:#fef3c7;border-radius:4px;font-size:12px;">🎁 ${booking.promotion_name || 'Ưu đãi'} (${booking.promotion_discount_percent || 0}%)</td><td style="text-align:right;padding:4px 8px;font-weight:700;color:#8B6914;font-size:12px;">-${fmt(promotionDiscount)}</td></tr>`;
    }
    if (booking.discount_code && discountCodeAmt > 0) {
      const codeDesc = booking.discount_code_type === 'percent' ? `${booking.discount_code_value}%` : fmt(booking.discount_code_value || 0);
      rows += `<tr><td style="padding:4px 8px;background:#fff7ed;border-radius:4px;font-size:12px;">🎟️ Mã: <strong>${booking.discount_code}</strong> (${codeDesc})</td><td style="text-align:right;padding:4px 8px;font-weight:700;color:#d97706;font-size:12px;">-${fmt(discountCodeAmt)}</td></tr>`;
    }
    if (totalDiscount > 0) {
      rows += `<tr><td style="padding:6px 8px;border-top:1px solid rgba(139,105,20,0.2);font-weight:600;font-size:13px;">💰 Tổng tiết kiệm:</td><td style="text-align:right;padding:6px 8px;border-top:1px solid rgba(139,105,20,0.2);font-weight:700;color:#16a34a;font-size:14px;">${fmt(totalDiscount)}</td></tr>`;
    }
    discountHtml = `
    <div style="background:rgba(139,105,20,0.05);border:1px solid rgba(139,105,20,0.2);border-radius:10px;padding:12px;margin-bottom:20px;">
      <p style="font-weight:600;font-size:14px;margin:0 0 8px;color:#333;">🎁 Ưu đãi đã áp dụng</p>
      <table style="width:100%;">${rows}</table>
    </div>`;
  }

  // === BUILD COMBO SECTION ===
  let comboHtml = '';
  if (combos.length > 0) {
    let comboRows = '';
    combos.forEach((c, idx) => {
      const parts = c.combo_name?.split(' – ') || [c.combo_name];
      const packageName = parts[0] || '';
      const menuName = parts.length > 1 ? parts.slice(1).join(' – ') : '';
      const comboItemTotal = c.price_vnd * c.quantity;
      
      let dishesHtml = '';
      if (c.dishes && c.dishes.length > 0) {
        const dishRows = c.dishes.map((d, i) =>
          `<tr><td style="padding:2px 0 2px 16px;font-size:12px;color:#666;">${i + 1}. ${d.name_vi} × ${c.quantity}</td></tr>`
        ).join('');
        dishesHtml = `
        <tr><td colspan="2" style="padding:4px 0 0;">
          <table style="width:100%;">
            <tr><td style="padding:4px 0 2px;font-size:11px;font-weight:600;color:#888;">🍽️ Thực đơn (${c.dishes.length} món × ${c.quantity} suất):</td></tr>
            ${dishRows}
          </table>
        </td></tr>`;
      }

      comboRows += `
      <div style="background:#f8f6f0;border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid #f0ebe0;">
        <table style="width:100%;font-size:13px;">
          <tr>
            <td style="font-weight:600;">${idx + 1}. ${packageName}</td>
            <td style="text-align:right;font-weight:700;color:#8B6914;">${fmt(comboItemTotal)}</td>
          </tr>
          ${menuName ? `<tr><td colspan="2" style="font-size:12px;color:#8B6914;padding-top:2px;">📋 ${menuName}</td></tr>` : ''}
          <tr><td colspan="2" style="font-size:12px;color:#888;padding-top:2px;">💰 ${fmt(c.price_vnd)}/người × ${c.quantity} suất</td></tr>
          ${dishesHtml}
        </table>
      </div>`;
    });

    const totalServings = combos.reduce((s, c) => s + c.quantity, 0);
    let comboNotesHtml = '';
    if (booking.combo_notes) {
      comboNotesHtml = `<div style="background:#FEF3C7;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:12px;">
        <strong>📝 Ghi chú ăn uống:</strong> ${booking.combo_notes}
      </div>`;
    }

    comboHtml = `
    <h3 style="font-size:15px;font-weight:600;border-bottom:2px solid rgba(139,105,20,0.3);padding-bottom:8px;margin:20px 0 12px;">🍽️ a. Suất ăn (Combo)</h3>
    ${comboRows}
    <p style="font-size:11px;color:#888;font-style:italic;margin:8px 0;">📌 Danh sách món được nhân theo số lượng suất ăn</p>
    ${comboNotesHtml}
    <div style="background:#f8f6f0;border-radius:8px;padding:10px 12px;margin-top:8px;">
      <table style="width:100%;font-size:13px;"><tr>
        <td style="font-weight:600;color:#888;">Tổng suất ăn (${totalServings} suất):</td>
        <td style="text-align:right;font-weight:700;color:#8B6914;">${fmt(comboTotal)}</td>
      </tr></table>
    </div>`;
  } else {
    comboHtml = `
    <h3 style="font-size:15px;font-weight:600;border-bottom:2px solid rgba(139,105,20,0.3);padding-bottom:8px;margin:20px 0 12px;">🍽️ a. Suất ăn (Combo)</h3>
    <p style="font-size:12px;color:#999;font-style:italic;">Không đặt combo ăn uống</p>`;
  }

  // === BUILD FOOD ITEMS SECTION ===
  let foodHtml = '';
  if (foodItems.length > 0) {
    const foodRows = foodItems.map((f, i) =>
      `<div style="display:flex;justify-content:space-between;align-items:center;background:#f8f6f0;border-radius:6px;padding:8px 12px;margin-bottom:4px;font-size:13px;">
        <span><strong>${i + 1}. ${f.name}</strong> <span style="color:#888;font-size:12px;">×${f.quantity} · ${fmt(f.price_vnd)}/món</span></span>
        <span style="font-weight:700;color:#8B6914;">${fmt(f.price_vnd * f.quantity)}</span>
      </div>`
    ).join('');
    const totalFoodQty = foodItems.reduce((s, f) => s + f.quantity, 0);
    foodHtml = `
    <h3 style="font-size:15px;font-weight:600;border-bottom:2px solid rgba(139,105,20,0.3);padding-bottom:8px;margin:20px 0 12px;">🛒 b. Món ăn đặt riêng</h3>
    ${foodRows}
    <div style="background:#f8f6f0;border-radius:8px;padding:10px 12px;margin-top:8px;">
      <table style="width:100%;font-size:13px;"><tr>
        <td style="font-weight:600;color:#888;">Tổng món ăn riêng (${totalFoodQty} món):</td>
        <td style="text-align:right;font-weight:700;color:#8B6914;">${fmt(indFoodTotal)}</td>
      </tr></table>
    </div>`;
  } else {
    foodHtml = `
    <h3 style="font-size:15px;font-weight:600;border-bottom:2px solid rgba(139,105,20,0.3);padding-bottom:8px;margin:20px 0 12px;">🛒 b. Món ăn đặt riêng</h3>
    <p style="font-size:12px;color:#999;font-style:italic;">Không đặt món riêng</p>`;
  }

  // === BUILD COST SUMMARY ===
  let costRows = `<tr><td style="color:#888;padding:4px 0;">🏨 Tiền phòng (${roomQty} phòng × ${nights} đêm):</td><td style="text-align:right;padding:4px 0;font-weight:500;">${fmt(roomSubtotal)}</td></tr>`;
  if (extraSurcharge > 0) {
    costRows += `<tr><td style="color:#d97706;padding:4px 0;">👤 Phụ thu thêm ${extraCount} người (30%):</td><td style="text-align:right;padding:4px 0;font-weight:500;color:#d97706;">+${fmt(extraSurcharge)}</td></tr>`;
  }
  if (comboTotal > 0) {
    const totalServings = combos.reduce((s, c) => s + c.quantity, 0);
    costRows += `<tr><td style="color:#888;padding:4px 0;">🍽️ Suất ăn combo (${totalServings} suất):</td><td style="text-align:right;padding:4px 0;font-weight:500;">${fmt(comboTotal)}</td></tr>`;
  }
  if (indFoodTotal > 0) {
    const totalFoodQty = foodItems.reduce((s, f) => s + f.quantity, 0);
    costRows += `<tr><td style="color:#888;padding:4px 0;">🛒 Món ăn riêng (${totalFoodQty} món):</td><td style="text-align:right;padding:4px 0;font-weight:500;">${fmt(indFoodTotal)}</td></tr>`;
  }

  let discountRows = '';
  if (hasDiscount) {
    costRows += `<tr><td style="color:#888;padding:6px 0;border-top:1px solid #eee;font-weight:600;">Tổng trước giảm:</td><td style="text-align:right;padding:6px 0;border-top:1px solid #eee;font-weight:500;text-decoration:line-through;color:#999;">${fmt(originalPrice)}</td></tr>`;
    if (memberDiscount > 0) {
      discountRows += `<tr><td style="color:#16a34a;padding:3px 0;font-size:12px;">⭐ Giảm thành viên (${booking.member_discount_percent || 0}%):</td><td style="text-align:right;padding:3px 0;font-weight:500;color:#16a34a;font-size:12px;">-${fmt(memberDiscount)}</td></tr>`;
    }
    if (promotionDiscount > 0) {
      discountRows += `<tr><td style="color:#16a34a;padding:3px 0;font-size:12px;">🎁 ${booking.promotion_name || 'Khuyến mãi'} (${booking.promotion_discount_percent || 0}%):</td><td style="text-align:right;padding:3px 0;font-weight:500;color:#16a34a;font-size:12px;">-${fmt(promotionDiscount)}</td></tr>`;
    }
    if (booking.discount_code && discountCodeAmt > 0) {
      const codeDesc = booking.discount_code_type === 'percent' ? `${booking.discount_code_value}%` : fmt(booking.discount_code_value || 0);
      discountRows += `<tr><td style="color:#16a34a;padding:3px 0;font-size:12px;">🎟️ Mã ${booking.discount_code} (${codeDesc}):</td><td style="text-align:right;padding:3px 0;font-weight:500;color:#16a34a;font-size:12px;">-${fmt(discountCodeAmt)}</td></tr>`;
    }
  }

  // === EXTRA PERSON SECTION ===
  let extraPersonHtml = '';
  if (extraCount > 0 && extraSurcharge > 0) {
    extraPersonHtml = `
    <div style="background:#FEF3C7;border-radius:8px;padding:10px 12px;margin-top:8px;">
      <table style="width:100%;font-size:13px;"><tr>
        <td style="font-weight:600;color:#92400E;">👤 Phụ thu thêm ${extraCount} người</td>
        <td style="text-align:right;font-weight:700;color:#d97706;">+${fmt(extraSurcharge)}</td>
      </tr><tr>
        <td colspan="2" style="font-size:11px;color:#92400E;padding-top:2px;">30% giá phòng × ${extraCount} người vượt tiêu chuẩn</td>
      </tr></table>
    </div>`;
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
      <p style="margin:4px 0 0;font-size:11px;color:#aaa;">Lưu mã này để tra cứu đặt phòng</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px;">
      <div style="flex:1;background:#f8f6f0;border-radius:10px;padding:12px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#888;">Trạng thái</p>
        <span style="font-weight:700;font-size:12px;color:#d97706;">⏳ Chờ xác nhận</span>
      </div>
      <div style="flex:1;background:${statusBg};border-radius:10px;padding:12px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#888;">Thanh toán</p>
        <span style="font-weight:700;font-size:12px;color:${statusColor};">${statusText}</span>
      </div>
    </div>

    ${discountHtml}

    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">👤 Thông tin khách hàng</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Họ tên:</td><td style="font-weight:500;text-align:right;">${booking.guest_name}</td></tr>
      <tr><td style="color:#888;">Số điện thoại:</td><td style="font-weight:500;text-align:right;">📞 ${booking.guest_phone}</td></tr>
      ${booking.guest_email ? `<tr><td style="color:#888;">Email:</td><td style="font-weight:500;text-align:right;">📧 ${booking.guest_email}</td></tr>` : ""}
    </table>

    ${booking.company_name ? `
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">🏢 Thông tin đoàn / công ty</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Tên công ty:</td><td style="font-weight:500;text-align:right;">${booking.company_name}</td></tr>
      ${booking.group_size ? `<tr><td style="color:#888;">Số người:</td><td style="font-weight:500;text-align:right;">${booking.group_size} người</td></tr>` : ''}
      ${booking.special_services ? `<tr><td style="color:#888;">Dịch vụ:</td><td style="font-weight:500;text-align:right;">${booking.special_services}</td></tr>` : ''}
    </table>` : ''}

    ${booking.decoration_notes ? `
    <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">💕 Yêu cầu trang trí</h3>
    <p style="font-size:13px;color:#666;">${booking.decoration_notes}</p>` : ''}

    <h3 style="font-size:15px;font-weight:600;border-bottom:2px solid rgba(139,105,20,0.3);padding-bottom:8px;margin:20px 0 12px;">🛏️ Chi tiết đặt phòng</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      <tr><td style="color:#888;width:40%;">Loại phòng:</td><td style="font-weight:600;text-align:right;">${roomName}</td></tr>
      <tr><td style="color:#888;">Số lượng phòng:</td><td style="font-weight:500;text-align:right;">${roomQty} phòng</td></tr>
      <tr><td style="color:#888;">Số khách:</td><td style="font-weight:500;text-align:right;">${booking.guests_count} người lớn</td></tr>
      <tr><td style="color:#888;">📅 Nhận phòng:</td><td style="font-weight:500;text-align:right;">${checkIn}</td></tr>
      <tr><td style="color:#888;">📅 Trả phòng:</td><td style="font-weight:500;text-align:right;">${checkOut}</td></tr>
      <tr><td style="color:#888;">Tổng số đêm:</td><td style="font-weight:600;color:#8B6914;text-align:right;">${nights} đêm</td></tr>
    </table>
    <div style="background:#f8f6f0;border-radius:8px;padding:10px 12px;margin-top:8px;">
      <table style="width:100%;font-size:12px;">
        <tr><td style="color:#888;">Giá phòng / đêm:</td><td style="text-align:right;font-weight:500;">${fmt(pricePerNight)}</td></tr>
        <tr><td style="color:#888;">Tính:</td><td style="text-align:right;font-weight:500;">${fmt(pricePerNight)} × ${nights} đêm × ${roomQty} phòng</td></tr>
        <tr><td style="padding-top:6px;border-top:1px solid #e8e4d8;font-weight:600;color:#888;">Thành tiền phòng:</td><td style="text-align:right;padding-top:6px;border-top:1px solid #e8e4d8;font-weight:700;">${fmt(roomSubtotal)}</td></tr>
      </table>
    </div>
    ${extraPersonHtml}

    ${comboHtml}
    ${foodHtml}

    <h3 style="font-size:15px;font-weight:600;border-bottom:2px solid rgba(139,105,20,0.3);padding-bottom:8px;margin:20px 0 12px;">💰 Tổng hợp chi phí</h3>
    <table style="width:100%;font-size:13px;line-height:1.8;">
      ${costRows}
      ${discountRows}
      <tr>
        <td style="padding:8px 0;border-top:2px solid rgba(139,105,20,0.3);font-weight:700;font-size:15px;">TỔNG THANH TOÁN${hasDiscount ? ' (sau giảm)' : ''}:</td>
        <td style="text-align:right;padding:8px 0;border-top:2px solid rgba(139,105,20,0.3);font-weight:700;color:#8B6914;font-size:18px;">${fmt(booking.total_price_vnd)}</td>
      </tr>
    </table>
    <div style="background:#f8f6f0;border-radius:10px;padding:12px;margin-top:8px;">
      <table style="width:100%;font-size:13px;line-height:1.8;">
        <tr><td style="color:#888;">Tiền cọc (50%):</td><td style="text-align:right;font-weight:700;color:${isPaid ? '#059669' : '#d97706'};">${fmt(depositAmount)}</td></tr>
        <tr><td style="color:#888;">Đã thanh toán:</td><td style="text-align:right;font-weight:600;color:${isPaid ? '#059669' : '#888'};">${isPaid ? fmt(depositAmount) : '0₫'}</td></tr>
        <tr><td style="padding-top:6px;border-top:1px solid #e8e4d8;color:#888;font-weight:600;">Còn lại khi nhận phòng:</td><td style="text-align:right;padding-top:6px;border-top:1px solid #e8e4d8;font-weight:700;color:#8B6914;">${isPaid ? fmt(remainingAmount) : fmt(booking.total_price_vnd)}</td></tr>
      </table>
    </div>

    ${!isPaid ? `
    <div style="background:#FEF3C7;border:2px dashed #F59E0B;border-radius:10px;padding:16px;margin-top:20px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#92400E;text-align:center;">💳 THANH TOÁN ĐẶT CỌC</p>
      <table style="width:100%;font-size:13px;line-height:1.8;margin-bottom:12px;">
        <tr><td style="color:#92400E;width:45%;">🏦 Ngân hàng:</td><td style="font-weight:700;">${VA_BANK}</td></tr>
        <tr><td style="color:#92400E;">🔢 Số tài khoản (VA):</td><td style="font-weight:700;">${VA_ACCOUNT}</td></tr>
        <tr><td style="color:#92400E;">👤 Chủ tài khoản:</td><td style="font-weight:700;">${VA_HOLDER}</td></tr>
      </table>
      <div style="text-align:center;">
        <img src="${qrUrl}" alt="QR Thanh toán SePay" style="width:200px;height:auto;border-radius:8px;margin-bottom:12px;" />
      </div>
      <div style="text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#92400E;">📌 Nội dung chuyển khoản:</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#8B6914;letter-spacing:2px;">${booking.booking_code}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#92400E;">💰 Số tiền cần chuyển:</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#DC2626;">${fmt(depositAmount)}</p>
      </div>
      <p style="text-align:center;font-size:11px;color:#92400E;margin:12px 0 0;">⚠️ Chỉ chuyển khoản qua tài khoản ảo (VA) hoặc quét mã QR.</p>
    </div>` : `
    <div style="background:#ECFDF5;border:1px solid #86efac;border-radius:10px;padding:16px;margin-top:20px;text-align:center;">
      <p style="font-size:24px;margin:0 0 8px;">✅</p>
      <p style="font-weight:700;color:#059669;font-size:16px;margin:0 0 4px;">Đã cọc 50% thành công!</p>
      <p style="font-size:13px;color:#666;margin:0;">Số tiền còn lại ${fmt(remainingAmount)} thanh toán khi nhận phòng</p>
    </div>`}

    ${booking.guest_notes ? `
    <div style="margin-top:20px;">
      <h3 style="font-size:15px;font-weight:600;border-bottom:1px solid #eee;padding-bottom:8px;margin:0 0 12px;">📝 Ghi chú</h3>
      <p style="font-size:13px;color:#666;background:#f8f6f0;border-radius:8px;padding:10px 12px;">${booking.guest_notes}</p>
    </div>` : ''}

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
      `<tr><td style="padding:4px 0;border-bottom:1px solid #f0f0f0;">${item.name} × ${item.quantity}</td><td style="text-align:right;padding:4px 0;border-bottom:1px solid #f0f0f0;font-weight:500;">${fmt(item.price * item.quantity)}</td></tr>`
    ).join('');
  }

  let discountHtml = '';
  if (order.discount_amount && order.discount_amount > 0) {
    discountHtml = `
    <tr><td style="color:#888;">Tổng trước giảm:</td><td style="font-weight:500;text-decoration:line-through;color:#999;">${fmt(order.original_amount || order.total_amount + order.discount_amount)}</td></tr>
    <tr><td style="color:#16a34a;">🎟️ Mã ${order.discount_code || 'Giảm giá'} ${order.discount_type === 'percent' ? `(${order.discount_value}%)` : ''}:</td><td style="font-weight:500;color:#16a34a;">-${fmt(order.discount_amount)}</td></tr>`;
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
      <span style="color:${isPaid ? '#059669' : statusColor};font-weight:700;font-size:14px;">${isPaid ? '✅ ĐÃ CỌC 50%' : '⏳ CHƯA THANH TOÁN'}</span>
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
      ${discountHtml}
      <tr><td style="color:#888;width:40%;">Tổng tiền:</td><td style="font-weight:700;color:#8B6914;font-size:15px;">${fmt(order.total_amount)}</td></tr>
      <tr><td style="color:#888;">Tiền cọc (50%):</td><td style="font-weight:700;color:${isPaid ? '#059669' : '#D97706'};">${fmt(depositAmount)}</td></tr>
      ${isPaid ? `<tr><td style="color:#888;">Đã thanh toán:</td><td style="font-weight:700;color:#059669;">${fmt(depositAmount)}</td></tr>` : ''}
      <tr><td style="color:#888;">Còn lại:</td><td style="font-weight:700;color:#8B6914;">${fmt(isPaid ? remainingAmount : order.total_amount)}</td></tr>
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
        <p style="margin:0;font-size:20px;font-weight:700;color:#DC2626;">${fmt(depositAmount)}</p>
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
      if (order.guest_email) {
        await transporter.sendMail({
          from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
          to: order.guest_email,
          subject: `Đơn đồ ăn ${order.food_order_id} - Chưa thanh toán`,
          html: emailHtml,
        });
      }
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `🍽️ Đơn đồ ăn mới [${order.food_order_id}] - ${order.customer_name}`,
        html: emailHtml,
      });
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
      }
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `✅ Đã nhận cọc đồ ăn [${order.food_order_id}] - ${order.customer_name}`,
        html: emailHtml,
      });
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
    <p style="font-size:13px;color:#555;line-height:1.6;text-align:center;">Hãy đăng nhập và đặt phòng để tích lũy ưu đãi nhé!</p>
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

      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: member_email,
        subject: `🎉 Chào mừng ${member_name} - Thành viên ${HOTEL_NAME}`,
        html: welcomeHtml,
      });
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `👤 Thành viên mới: ${member_name} (${member_email})`,
        html: welcomeHtml,
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deposit paid email for booking
    if (body.type === 'deposit_paid') {
      const { booking, room_name, invoice_number, combos_with_dishes, food_items } = body;
      const emailHtml = buildBookingInvoiceHtml({
        booking,
        roomName: room_name,
        invoiceNumber: invoice_number,
        combos: combos_with_dishes || [],
        foodItems: food_items || [],
        isPaid: true,
      });
      if (booking.guest_email) {
        await transporter.sendMail({
          from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
          to: booking.guest_email,
          subject: `✅ Hóa đơn ${booking.booking_code} - Đã cọc 50%`,
          html: emailHtml,
        });
      }
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `✅ Đã nhận cọc [${booking.booking_code}] - ${booking.guest_name}`,
        html: emailHtml,
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: new booking email
    const { booking, room_name, invoice_number, combos_with_dishes, food_items } = body;
    const emailHtml = buildBookingInvoiceHtml({
      booking,
      roomName: room_name,
      invoiceNumber: invoice_number,
      combos: combos_with_dishes || [],
      foodItems: food_items || [],
      isPaid: false,
    });

    if (booking.guest_email) {
      await transporter.sendMail({
        from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
        to: booking.guest_email,
        subject: `Hóa đơn ${booking.booking_code} - Chưa thanh toán`,
        html: emailHtml,
      });
    }

    const adminHtml = `
<div style="max-width:600px;margin:0 auto;padding:0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background:#DC2626;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;text-align:center;">
    <h2 style="margin:0;font-size:18px;">🔔 Có đơn đặt phòng mới – ${HOTEL_NAME}</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Đơn hàng từ website · Chưa thanh toán</p>
  </div>
  ${emailHtml}
</div>`;

    await transporter.sendMail({
      from: `"${HOTEL_NAME}" <${SMTP_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🔔 Đơn đặt phòng mới từ website [${booking.booking_code}] - ${booking.guest_name}`,
      html: adminHtml,
    });

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

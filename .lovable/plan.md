# Chọn ăn theo từng ngày — Bước 2 đặt phòng

## Mục tiêu
Thay layout "Chọn bữa ăn (1 lần)" + "Combo ăn uống cho đoàn (1 lần)" trong `Booking.tsx` bằng **một card riêng cho mỗi đêm lưu trú**. Mỗi card cho phép chọn buổi (trưa/tối/cả 2), combo, thực đơn, số suất — và tự tính tạm tính theo ngày + tổng cộng.

## Phạm vi giữ nguyên (KHÔNG đụng)
- Logic giá phòng, bước 1/3/4, PDF, email, admin panel.
- Các component combo hiện có (`ComboSlotSelector`, `PersonalMealPlanSelector`, `IndividualFoodSelector`, `MealTimeSelector`) — vẫn còn trong code nhưng không dùng ở step 2 cho luồng "đoàn + combo".
- Edge function `create-booking` & schema `bookings.room_breakdown`: vẫn nhận `combo_breakdown` cũ — ta sẽ "flatten" dữ liệu per-day về cùng format `combo_breakdown` (mỗi ngày × mỗi buổi → 1 dòng) để PDF/email render không cần đổi.

## Cấu trúc mới

### 1. Component mới: `src/components/DayMealCard.tsx`
- Props: `night: NightInfo`, `guests: number`, `combos`, `value`, `onChange`.
- State nội bộ chỉ là `expanded`; mọi dữ liệu chọn lên parent qua `onChange`.
- UI theo mock của user: 
  - Header có `📅 dayLabel, formattedDate` + chip `⚠️ Bắt buộc` (nếu mandatory).
  - Optional + chưa mở → hiện text "Không bắt buộc" + nút `+ Thêm bữa ăn`.
  - Khi mở → hiển thị 3 pills (Trưa / Tối / Cả 2), grid combo, dropdown thực đơn (lấy từ `usePersonalMealPlans` hoặc theo combo), số suất ± , tạm tính ngày.
- Style: dùng tailwind tokens (`border-primary/40 bg-primary/5` cho mandatory, `border-border` cho optional). Không dùng màu hex tuỳ tiện ngoài các pattern hiện có.

### 2. Component mới: `src/components/MealByDaySection.tsx`
- Render header `🍽 Bữa ăn theo từng ngày`.
- Map `nights` → `<DayMealCard>`.
- Footer `MealTotal` cộng dồn tất cả ngày, format VND.

### 3. Tích hợp vào `src/pages/Booking.tsx`
- Thêm state `foodByDay: Record<string, DayMealSelection>`.
- Khi `stayNights` đổi → khởi tạo entry rỗng cho mỗi đêm; mandatory đêm mặc định `expanded=true`.
- **Ẩn** block `<MealTimeSelector>` + `<ComboSlotSelector>`/`<PersonalMealPlanSelector>` cũ khi `combos.length > 0 && stayNights.length > 0` (đi đường mới). Giữ `<IndividualFoodSelector>` (gọi lẻ) nguyên vị trí.
- Validation `handleNext` từ step 2 → step 3:
  - Mọi đêm mandatory phải có `meals.length > 0 && comboId`.
  - Toast liệt kê đêm còn thiếu, scroll tới card đầu tiên bị thiếu.
- `pricing`/`comboTotal` tính từ `foodByDay`:
  `Σ combo.price × quantity × meals.length` cho mọi ngày có comboId.

### 4. Flatten về format cũ cho backend
Trong `submitBooking` (hoặc nơi build payload `create-booking`), build `combo_breakdown` từ `foodByDay`:
```
foodByDay → forEach(date) → forEach(meal in meals):
  push({
    combo_id, combo_name, menu_number,
    meal_time: meal,       // 'lunch' | 'dinner'
    date,                  // YYYY-MM-DD (thêm field)
    quantity,
    price_per_person,
    subtotal
  })
```
Edge function hiện đã đọc `combo_breakdown` theo `combo_name + meal_time + menu_number + quantity`, thêm field `date` chỉ là optional → PDF/email không vỡ.

### 5. Sidebar "Tóm tắt đặt phòng"
- Phần liệt kê combo bên phải lấy từ `combo_breakdown` flatten → tự cập nhật, không cần sửa thêm.

## Files
- **New**: `src/components/DayMealCard.tsx`, `src/components/MealByDaySection.tsx`
- **Edit**: `src/pages/Booking.tsx` (state + render + validate + submit flatten)
- **Không đụng**: edge functions, PDF, email, admin, schema, các component combo cũ.

## Rủi ro & ghi chú
- "Cả 2 bữa" = 2 dòng (lunch + dinner) cùng combo/menu/quantity → tổng = price × qty × 2, khớp tính toán hiện tại của edge function.
- Nếu cùng 1 đêm dùng nhiều combo khác nhau: **không hỗ trợ ở v1** (mỗi đêm 1 combo). Có thể mở rộng sau.
- Field `date` mới trong `combo_breakdown` chỉ phục vụ về sau (PDF/email hiển thị "T6 05/06 - bữa tối"); v1 không bật trong template.

## Out of scope
- Hiển thị `date` trong PDF/email (sẽ làm ở message riêng nếu cần).
- Đổi schema DB.
- Tách giá theo mùa hay menu khác cho từng combo cùng combo_id.

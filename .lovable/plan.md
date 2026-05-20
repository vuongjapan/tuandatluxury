## Mục tiêu

Refactor toàn bộ phần chọn ăn ở Bước 2 để hỗ trợ:
1. Mỗi ngày chia nhiều **nhóm bàn** (6 người/nhóm), mỗi nhóm 1 combo + thực đơn + số suất riêng — áp dụng cho TẤT CẢ ngày.
2. **Món riêng tính riêng cho từng ngày** (không cộng chung) với progress bar riêng từng ngày.
3. Nút **× Xoá** trên mỗi nhóm combo và mỗi món riêng.
4. **Tóm tắt cuối trang** liệt kê từng ngày, từng nhóm, realtime.
5. **Popup hướng dẫn** đặt ăn (nút nhỏ ẩn).
6. Fix bug email/PDF/InvoicePage: ưu tiên `meal_time` per-item, không fallback sang `mealTimeRaw` toàn booking khi line đã có meal_time.

Schema gửi backend giữ nguyên cấu trúc flatten hiện tại (1 row/nhóm/buổi) nhưng **gộp dòng cùng combo + cùng thực đơn**: chỉ tách dòng khi khác combo/menu/buổi.

## Thay đổi state & component

### State trong `Booking.tsx`
```text
DayMealGroup = { id, comboPackageId, comboMenuId, quantity }
DayMealSelection = {
  meals: ('lunch' | 'dinner')[]
  groups: DayMealGroup[]      // NEW – thay 1 combo bằng N nhóm
  bypassed?, bypassCode?
}
individualFoodsByDay: Record<dateISO, FoodItem[]>   // NEW – thay individualFoods
```
Hàm khởi tạo nhóm mặc định: `Math.ceil(adults / 6)` nhóm, mỗi nhóm 6 suất, dư còn lại bỏ nhóm cuối.

### `DayMealCard.tsx`
- Thay block "Chọn combo + Số suất" bằng list các nhóm bàn, mỗi nhóm: chọn combo, thực đơn, số suất, nút × Xoá nhóm; thêm nút "+ Thêm nhóm bàn" cuối list.
- Block "Đặt món riêng" lấy data từ `individualFoodsByDay[date]`, mở `IndividualFoodSelector` với scope theo ngày; hiện progress bar dùng total ngày này.
- Áp dụng UI nhóm cho cả `variant: 'mandatory'` và `'optional'`.

### `IndividualFoodSelector.tsx`
- Nhận thêm prop `dateLabel?: string` (để hiển thị tiêu đề "Đặt món riêng cho T7 06/06").
- Cart `items` → `onItemsChange` đã sẵn sàng theo từng ngày (chỉ caller truyền array riêng).
- Trong list cart hiển thị nút × cho từng item (đã có sẵn — chỉ cần verify nhỏ).

### `MealByDaySection.tsx`
- Truyền `individualByDay[date]` xuống mỗi `DayMealCard`.
- Bỏ tính toán `lines` cũ (1 combo/ngày) — chuyển logic flatten sang `Booking.tsx` (vì giờ phải gộp nhóm cùng combo).

### Component mới
- `MealHelpPopup.tsx` – nút "❓ Hướng dẫn cách đặt ăn" mở dialog (reuse `<Dialog>` shadcn) với 4 mục: ngày tuỳ chọn, ngày bắt buộc + 3 cách, nhiều nhóm bàn, hủy/đổi.
- `MealSummaryCard.tsx` – render cuối Bước 2 (sau `MealByDaySection`), liệt kê từng ngày: combo theo nhóm + món riêng + tổng cộng. Ẩn nếu chưa có gì.

## Flatten payload trong `Booking.tsx`

```text
foodByDayLines = []
for night in stayNights:
  sel = foodByDay[night.date]
  for meal in sel.meals:
    // gộp nhóm cùng (comboPackageId, comboMenuId)
    grouped = {}
    for g in sel.groups: grouped[`${g.pkg}|${g.menu}`].quantity += g.quantity
    for each grouped entry: push { date, meal, pkg, menu, quantity, subtotal }

individualLines = flatMap(date => individualFoodsByDay[date].map(f => ({...f, date, meal_time: 'dinner'})))
```
Edge function `create-booking` không đổi – payload combos/food_items vẫn cùng shape; chỉ thêm `date` cho food items (đã có cho combos).

## Validation

`incompleteMandatoryNights` cập nhật:
- Một ngày bắt buộc PASS nếu một trong các điều kiện:
  - `bypassed = true`, hoặc
  - `groups` có ≥ 1 nhóm hợp lệ (có combo + quantity > 0) VÀ `meals.length > 0`, hoặc
  - `individualFoodsByDay[date]` total ≥ `adults × minPerPerson`.

## Fix bug email/PDF/InvoicePage (mục #6)

Sửa 3 file:
- `supabase/functions/send-booking-email/index.ts` (line ~220, ~299)
- `src/pages/InvoicePage.tsx` (line ~439, ~496)
- `supabase/functions/generate-booking-pdf/index.ts` (line ~567+ và mọi nơi render meal label per-item)

Thay:
```ts
const itemMt = c.meal_time || mealTimeRaw;
```
bằng:
```ts
// Per-item meal_time có thì DÙNG; chỉ fallback khi thiếu hoàn toàn
const itemMt = c.meal_time && ['lunch','dinner','both'].includes(c.meal_time)
  ? c.meal_time
  : mealTimeRaw;
```
(thực ra logic cũ đã đúng — vấn đề là dữ liệu legacy `meal_time='lunch'` trong khi booking lưu `dinner`. **Vẫn ưu tiên per-item như cũ** vì đó là source of truth. Booking `TD202605A00011` đã được verify trong DB: 2 row combos đều có `meal_time='lunch'` ⇒ hiện "Bữa trưa" là **đúng theo data**.)

Đề xuất phụ: thêm cảnh báo subtle khi `c.meal_time !== booking.meal_time` để debug; KHÔNG đổi data legacy.

Sau khi sửa edge function: redeploy `send-booking-email`, `generate-booking-pdf`.

## Không thay đổi
- DB schema (`booking_combos`, `booking_food_items`).
- Logic giá phòng, discount, voucher, payment.
- Bước 1, 3, 4.
- Admin panel.

## Thứ tự thực thi
1. Sửa edge function email/PDF + redeploy.
2. Thêm field `groups` vào `DayMealSelection`, migrate state cũ.
3. Refactor `DayMealCard` UI nhóm + remove buttons.
4. Refactor `individualFoodsByDay` + IndividualFoodSelector scoped per-day.
5. Tạo `MealSummaryCard` + `MealHelpPopup`.
6. Cập nhật flatten payload + validation trong `Booking.tsx`.
7. Verify build, smoke test bằng cách check console preview.

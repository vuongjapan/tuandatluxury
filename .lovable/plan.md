## Mục tiêu
Cập nhật bước 2 "Dịch vụ" trong `src/pages/Booking.tsx` để hiển thị rõ từng đêm bắt buộc / không bắt buộc combo, dựa trên `mandatory_combo_dates` admin đã cấu hình, và chặn nút "Tiếp tục" khi ngày bắt buộc chưa được đáp ứng.

## Phạm vi giữ nguyên (không đụng)
- Bước 1, 3, 4 của flow đặt phòng
- Schema DB, admin panel, edge functions (`create-booking`, PDF, email)
- Logic tính giá phòng, voucher, VIP, cọc 50%
- Các component combo hiện có (`ComboSelector`, `ComboSlotSelector`, `PersonalMealPlanSelector`, `IndividualFoodSelector`, `MealTimeSelector`)

## Thay đổi

### 1. Hook mới: `useNightlyMandatoryInfo`
File mới `src/hooks/useNightlyMandatoryInfo.ts`. Nhận `checkIn`, `checkOut`, dùng `useMandatoryComboDates().getMatchingRange` đã có để build mảng:
```ts
{ date, dayLabel, formattedDate, mandatory, rule }[]
```
(Re-dùng logic match có sẵn — không tạo bảng mới, không sửa schema.)

### 2. Component mới: `NightlyMealOverview`
File mới `src/components/NightlyMealOverview.tsx`. Hiển thị 2 nhóm:
- **Ngày KHÔNG bắt buộc** — list các chip `✅ T4, 02/06` + đoạn giải thích tùy chọn (re-dùng văn bản từ `MealRuleBanner`).
- **Ngày BẮT BUỘC** — list chip `⚠️ T6, 05/06`, kèm banner từ `rule.banner_title` + `rule.banner_message` (lấy nguyên từ admin).

Component thuần presentational (UI-only).

### 3. Tích hợp vào Booking.tsx (bước 2)
- Thay `<MealRuleBanner rule={mandatoryComboRange} />` bằng `<NightlyMealOverview nights={nights} />`.
- Nếu chuỗi đêm KHÔNG có đêm nào bắt buộc → fallback về banner cũ (giữ behavior hiện tại).
- Phần chọn combo/suất ăn bên dưới: **giữ nguyên không đổi** (vẫn dùng `mealTime`, `ComboSlotSelector`, v.v. — không tách per-night) để không phá logic combo / PDF / email.

### 4. Validate nút "Tiếp tục"
Trong handler đi tiếp từ bước 2 → bước 3, nếu có **ít nhất 1 đêm bắt buộc** thì áp dụng kiểm tra hiện tại (`isComboMandatory` đã có) — không nới lỏng, không thêm chặn mới. Bổ sung **thông báo lỗi rõ hơn** liệt kê các đêm bắt buộc đang thiếu combo:
> "⚠️ Các đêm bắt buộc: T6 05/06, T7 06/06, CN 07/06 — vui lòng chọn combo/suất ăn trước khi tiếp tục."

Scroll lên `#combo-section` khi lỗi (đã có sẵn anchor).

## Kiến trúc / lý do

Không refactor sang "per-night meal time + per-night combo" như mockup gợi ý, vì:
- Sẽ phá vỡ data shape `comboSlots`, `personalMealSelections`, `mealTime` mà PDF/email/edge function đang đọc.
- Vi phạm "Không thay đổi logic combo hiện tại / PDF / email".

Thay vào đó, đợt này chỉ **làm rõ ngữ cảnh từng đêm** ở UI (banner thông minh + thông báo lỗi liệt kê đêm) — đúng tinh thần "ngày bắt buộc → giải thích, chặn; ngày không bắt buộc → cho phép bỏ qua".

Nếu sau này muốn **chọn bữa/combo riêng từng đêm thật sự**, đó là một thay đổi riêng động vào schema `bookings.room_breakdown` + PDF + email, sẽ làm trong message khác.

## Files
- new: `src/hooks/useNightlyMandatoryInfo.ts`
- new: `src/components/NightlyMealOverview.tsx`
- edit: `src/pages/Booking.tsx` (step 2 banner + validate message)

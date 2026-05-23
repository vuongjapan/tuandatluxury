## Admin Override Panel cho /booking

Thêm panel "⚙️ Chỉnh sửa Admin" hiển thị xuyên suốt 4 bước đặt phòng, chỉ admin (đã đăng nhập) mới thấy. Khách thường không thấy gì khác.

---

### 1. Database

Thêm cột `admin_overrides JSONB` vào bảng `bookings` (nullable). Cấu trúc:

```json
{
  "room_prices": { "<roomId>": 1200000 },
  "combo_prices": { "<comboPackageId>": 280000 },
  "combo_names":  { "<comboPackageId>": "Combo VIP" },
  "menu_names":   { "<comboMenuId>": "Thực đơn riêng" },
  "menu_dishes":  { "<comboMenuId>": ["Món 1","Món 2"] },
  "food_item_prices": { "<menuItemId>": 150000 },
  "food_lines": [{ "name": "...", "qty": 2, "price": 200000, "meal": "dinner" }],
  "guest": { "name": "...", "phone": "...", "email": "...", "adults": 8, "children": 2, "check_in": "2026-06-01", "check_out": "2026-06-03" },
  "discount": { "type": "percent|fixed", "value": 5, "reason": "..." },
  "deposit":  { "type": "percent|fixed", "value": 50 },
  "total_override": 25000000,
  "edited_by_staff": true
}
```

### 2. Phát hiện admin

Dùng `useAuth()` + `has_role(user.id,'admin')` qua RPC (đã có function `has_role`). Bọc thành hook `useIsAdmin()`. Lưu kết quả vào state.

### 3. Component mới

**`src/components/admin/AdminOverridePanel.tsx`** — collapsible card vàng nhạt với border dashed, hiển thị "⚙️ Chỉnh sửa Admin (chỉ nhân viên thấy)". Nhận `step`, `overrides`, `onChange`, và các dữ liệu cần thiết (rooms, foods, guest). Render section phù hợp với step:

- **Step 1**: list phòng đã chọn → input "Giá/đêm (ghi đè)"
- **Step 2**: list combo + món riêng đã chọn → input giá combo, tên thực đơn, textarea món, giá món riêng
- **Step 3**: (bỏ qua – chỉ thông tin khách, đã có form sẵn; vẫn cho hiện link nhanh)
- **Step 4**: tất cả mục A–F (phòng/ăn/khách/giảm/cọc/tổng)

### 4. Tích hợp `Booking.tsx`

- Thêm state `adminOverrides` (object) khởi tạo `{}`.
- Mount `<AdminOverridePanel>` ngay đầu mỗi Step khi `isAdmin === true`.
- Khi tính tổng tiền trong sidebar và Step 4:
  - `getRoomNightlyPrice(roomId, fallback)` → ưu tiên `overrides.room_prices[roomId]`
  - `getComboPrice(pkgId, fallback)` → tương tự
  - `getFoodItemPrice(itemId, fallback)` → tương tự
  - Áp `overrides.discount` thay cho discount tự động nếu có
  - Áp `overrides.deposit` thay cho 50% mặc định
  - Nếu `overrides.total_override` → ghi đè tổng cuối, show badge cảnh báo
- Step 4: render bảng A–F lấy/ghi vào `adminOverrides`.

### 5. Gửi backend

Sửa `supabase/functions/create-booking/index.ts`:
- Nhận thêm `admin_overrides` trong body.
- Khi `admin_overrides.edited_by_staff === true`: lưu vào cột `admin_overrides`.
- Tính `total_amount`/`deposit_amount` theo override (nếu có total_override → dùng luôn).

### 6. PDF + Email

Sửa `generate-booking-pdf/index.ts` và `send-booking-email/index.ts`:
- Nếu `booking.admin_overrides` tồn tại:
  - Render giá phòng/combo/món theo override (fallback dữ liệu gốc).
  - Render dòng food_lines bổ sung.
  - Render dòng "Giảm giá Admin: -X (lý do)" nếu có.
  - Cuối hóa đơn in chú thích: `* Đơn hàng được điều chỉnh bởi nhân viên`.
- Trang `InvoicePage.tsx` đọc `admin_overrides` từ bookings và áp cùng logic.

### 7. Phạm vi giữ nguyên

- Không sửa luồng SePay, webhook, RLS deposit.
- Khách thường: panel ẩn hoàn toàn, behavior y hệt hiện tại.
- Không thay đổi dữ liệu gốc combo_packages/menu_items.

### Thứ tự triển khai

1. Migration thêm cột `admin_overrides`.
2. Hook `useIsAdmin`.
3. Component `AdminOverridePanel` (đủ cho 4 step).
4. Tích hợp vào `Booking.tsx` (state + sidebar realtime + Step 4).
5. Update edge function `create-booking` lưu overrides + tính tổng.
6. Update PDF + email + InvoicePage để hiển thị theo overrides + chú thích cuối.

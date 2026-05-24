## Mục tiêu
Nâng cấp toàn diện flow hóa đơn thủ công (`AdminManualInvoice`) để hỗ trợ nhiều dòng phòng, tách biệt rõ 2 trạng thái (chờ cọc / đã cọc) với 2 PDF + 2 email khác nhau, tự động gửi khi Sepay xác nhận, và log lịch sử email.

---

## 1. Database migration

Thêm cột vào `bookings`:
- `room_lines JSONB` — mảng `[{ room_name, room_count, nights, price_per_night, line_total }]`. Nếu null → fallback về logic cũ (single room).
- `email_log JSONB DEFAULT '[]'` — mảng `[{ type: 'pending'|'confirmed', sent_at, sent_by: 'admin:<name>'|'auto:sepay', success: bool, error?: string }]`.
- `pending_email_sent_at TIMESTAMPTZ` — chốt 1 lần auto-send email pending.
- `confirmed_email_sent_at TIMESTAMPTZ` — chốt 1 lần auto-send email confirmed (khi Sepay xác nhận).

Email tự động chỉ chạy 1 lần (nếu các cột này null). Admin nhấn nút thủ công luôn append vào `email_log` không bị chặn.

---

## 2. AdminManualInvoice.tsx — UI multi-room

- Thay state `selectedRoomId/customPrice/rooms/nights` bằng `roomLines: RoomLine[]`.
- UI: bảng với cột "Tên phòng (combobox / tự nhập) · Số phòng · Số đêm · Giá/đêm · Thành tiền · 🗑". Nút `+ Thêm loại phòng`.
- Tổng phòng = sum line_total realtime.
- Khi submit `create-booking`: gửi kèm `room_lines` + `room_subtotal`.

---

## 3. AdminManualInvoice — chi tiết hóa đơn (sau khi tạo)

- Render danh sách `room_lines` thay vì 1 dòng cố định.
- Hiển thị badge theo status: `pending_payment` → cam "⏳ CHỜ THANH TOÁN CỌC"; `deposit_paid` → xanh "✅ ĐÃ XÁC NHẬN".
- Thay nút "Gửi email + PDF" bằng **2 nút**:
  - `[📧 Gửi email chờ cọc]` → gọi `send-manual-invoice-email` với `email_type='pending'`.
  - `[✅ Gửi email xác nhận]` → `email_type='confirmed'`. Nếu booking chưa đủ cọc → confirm dialog "Booking chưa xác nhận thanh toán. Vẫn muốn gửi?".
- Hiển thị **lịch sử email** từ `email_log` (icon + thời gian + người gửi).
- Realtime subscribe `bookings` để update status khi webhook chạy + toast `"✅ Đã nhận cọc {code} — X.000đ"`.

---

## 4. generate-manual-invoice-pdf — 2 variants

Thêm query param `?variant=pending|confirmed`:

**PDF pending:**
- Badge cam "⏳ CHỜ THANH TOÁN CỌC".
- Render đầy đủ block QR + BIDV + STK + nội dung CK + số tiền = deposit.
- Dòng nhắc: "Đặt phòng xác nhận sau khi nhận cọc".
- Không có block "Đã nhận".

**PDF confirmed:**
- Badge xanh "✅ ĐÃ XÁC NHẬN".
- Block xanh: "✅ Đã nhận đủ tiền cọc — X.000đ — HH:MM DD/MM/YYYY" (lấy từ `deposit_paid_at`).
- Bỏ hoàn toàn block QR/CK.
- Dòng: "Còn lại thanh toán tại quầy: X.000đ".

Render `room_lines` chi tiết.

---

## 5. send-manual-invoice-email — 2 variants

Tham số mới `email_type: 'pending' | 'confirmed'`:

**Email pending:**
- Subject: `[Tuấn Đạt Luxury] Xác nhận đặt phòng {code} – Vui lòng thanh toán cọc`
- Body: xác nhận đã nhận đơn + tóm tắt + khối cam hướng dẫn CK + nhắc "Đặt phòng xác nhận sau khi nhận cọc".
- Attach PDF variant `pending`.

**Email confirmed:**
- Subject: `[Tuấn Đạt Luxury] ✅ Xác nhận {code} – Đã nhận cọc`
- Body: khối xanh "Đã nhận cọc + thời gian" + tóm tắt + còn lại tại quầy + tiện ích kèm theo, **không QR**.
- Attach PDF variant `confirmed`.

Sau khi gửi: append vào `email_log` qua service-role; set `pending_email_sent_at` / `confirmed_email_sent_at` nếu chưa có.

---

## 6. sepay-webhook — auto email confirmed

Khi webhook khớp `bookingCode` và set status sang `deposit_paid`:
- Nếu `confirmed_email_sent_at IS NULL` → gọi nội bộ `send-manual-invoice-email` với `email_type='confirmed'`, `sent_by='auto:sepay'`.
- Nếu fail → log lỗi vào `email_log` với `success: false` để admin thấy cảnh báo đỏ và gửi lại.

(Không động vào logic phát hiện mã hay tính cọc — chỉ thêm trigger gửi mail.)

---

## 7. Phạm vi không thay đổi

- Không sửa logic booking/payment/invoice cốt lõi của flow khách tự đặt (`/booking`).
- Không đổi SePay matching / công thức cọc.
- Auto-send pending email khi tạo: vẫn giữ cơ chế hiện tại (nếu admin tick "Tạo + Gửi email") — nhưng dùng variant `pending`.

---

## Technical notes

- `RoomLine` interface dùng chung giữa frontend, PDF function, email function (định nghĩa lại ở mỗi nơi vì edge functions độc lập).
- Toast realtime: dùng `supabase.channel('manual-invoice-<id>').on('postgres_changes',...)` trong trang chi tiết.
- Email log render: chỉ hiển thị, không cho xoá.
- PDF: tái dùng style/QR code hiện tại, chỉ thêm conditional rendering theo variant.

Sau khi user duyệt plan, sẽ chạy migration trước (cần approval), rồi triển khai code theo thứ tự: edge functions → AdminManualInvoice UI.

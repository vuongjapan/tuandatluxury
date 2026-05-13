## Mục tiêu
Xây lại hệ thống dịch từ đầu: lưu bản dịch vào DB, admin bấm 1 nút để dịch toàn bộ; khách chuyển ngôn ngữ thì đọc thẳng từ DB (không gọi AI realtime).

## Các bước

### 1. Database
Tạo bảng `translations`:
- `translation_key` (unique), `vi_text`, `en_text`, `ja_text`, `zh_text`, `ko_text`
- `content_type`, `last_translated`, `created_at`, `updated_at`
- RLS: ai cũng đọc được; chỉ admin insert/update/delete

### 2. Edge function `translate-batch`
- Input: `{ items: [{key, text}], targetLang: 'en'|'ja'|'zh'|'ko' }`
- Gọi Lovable AI Gateway (gemini-2.5-flash) với JSON response
- Trả `{ translations: { key: translated } }`
- Tái dùng pattern từ `auto-translate` hiện có (rút gọn)

### 3. Edge function `collect-and-translate-all`
- Server-side collect content từ: `rooms`, `menu_items`, `services`, `combo_packages`, `offers`, `attractions`, `page_sections` + UI strings tĩnh
- Loop targets `[en, ja, zh, ko]`, batch 40 items, gọi AI, upsert vào `translations`
- Trả về tiến độ từng bước (hoặc đơn giản: chạy tuần tự, trả tổng kết)
- Vì có thể chạy lâu, sẽ dùng pattern: client gọi nhiều lần với `step` (collect → translate per lang per batch) HOẶC một lần với streaming. Chọn phương án đơn giản: client tự collect + chunk + gọi `translate-batch` nhiều lần để hiển thị progress thực sự.

→ Quyết định: **client điều phối** (collect + chunk + progress), **edge function chỉ dịch 1 batch**. Đỡ timeout, dễ progress.

### 4. UI Admin: `AdminTranslations.tsx`
- Hiển thị trạng thái dịch theo từng ngôn ngữ (count + last_translated mới nhất)
- Nút chính: "Dịch toàn bộ website ngay"
- Modal progress overlay (status text + progress %)
- Nút riêng theo nhóm (rooms/menu/services/UI)
- Tích hợp vào `AdminDashboard` sidebar

### 5. Hook `useDbTranslation`
- Khi `language` đổi và ≠ 'vi': fetch toàn bộ `translations` → build map `{ key: lang_text }` → lưu vào context
- Helper `t(viText, key)` → trả `map[key] || viText`
- Cache trong sessionStorage để chuyển ngôn ngữ lần sau tức thì

### 6. Tích hợp với hệ thống cũ
- Giữ `AutoTranslateRoot` làm fallback cho text không có key (nó sẽ đọc cache 24h và bỏ qua nếu DB đã cover phần lớn)
- HOẶC tắt `AutoTranslateRoot` và chỉ dùng DB → an toàn hơn cho cost. **Chọn: tắt AutoTranslateRoot**, dùng DB-only. Component có thể dùng `t()` ở những nơi quan trọng (Header, RoomCard...). Text chưa được wrap sẽ giữ tiếng Việt.

→ Để giảm thiểu thay đổi component, sẽ dùng cách tiếp cận **DOM-walker đọc từ DB map**: AutoTranslateRoot version mới sẽ tra từ DB map (theo `vi_text` → translated) thay vì gọi AI. Text khớp `vi_text` trong bảng → thay; không khớp → giữ nguyên.

### 7. Cleanup
- Xóa/disable `auto-translate` edge function khỏi flow (giữ file để tham khảo, không gọi nữa)
- Xóa hook `useAutoTranslate` calls (không bắt buộc, có thể giữ)

## File thay đổi
**Mới:**
- migration: bảng `translations` + RLS
- `supabase/functions/translate-batch/index.ts`
- `src/components/admin/AdminTranslations.tsx`
- `src/hooks/useDbTranslations.ts`

**Sửa:**
- `src/pages/AdminDashboard.tsx` (thêm tab)
- `src/components/AutoTranslateRoot.tsx` (đổi sang DB lookup, không gọi AI)
- `src/contexts/LanguageContext.tsx` (load translation map khi đổi ngôn ngữ)

## Không thay đổi
- Admin form nhập tiếng Việt
- Cấu trúc các bảng khác
- Giao diện chính & flow đặt phòng

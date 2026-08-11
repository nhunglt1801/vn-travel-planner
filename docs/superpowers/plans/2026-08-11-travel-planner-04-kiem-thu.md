# Kế hoạch triển khai — Plan 4: Kiểm thử thủ công & hoàn thiện

> **Dành cho agent thực thi:** BẮT BUỘC dùng sub-skill superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực thi plan này theo từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Yêu cầu trước:** Đã hoàn tất **Plan 0, Plan 1, Plan 2, Plan 3** — toàn bộ app đã chạy được đủ 3 màn hình, 4 API, chuỗi fallback ảnh, và thời tiết.

**Vị trí trong chuỗi 5 plan:** Plan 0 → Plan 1 → Plan 2 → Plan 3 → **Plan 4 (plan này, cuối cùng)**.

**Mục tiêu:** Kiểm thử thủ công toàn bộ app theo đúng phạm vi kiểm thử ở spec mục 8 — golden path, giả lập lỗi (AI lỗi, ảnh lỗi, thời tiết ngoài phạm vi), và responsive — trước khi coi Phase 1 demo là hoàn thành.

**File Structure:** không tạo file mới — đây là plan kiểm thử thuần tuý trên app đã build ở Plan 0-3, cộng với việc chạy lại bộ unit test đã viết ở Plan 1.

---

### Task 1: Kiểm thử golden path, giả lập lỗi, và responsive

**Files:** không có (chạy tay app đã build ở Plan 0-3).

**Giao diện phụ thuộc:** không có — task này chỉ thao tác trên app đang chạy trong trình duyệt.

- [ ] **Bước 1: Thiết lập API key thật**

Copy `server/.env.example` thành `server/.env`, điền `OPENAI_API_KEY` thật (và `UNSPLASH_ACCESS_KEY` nếu có — app vẫn phải chạy được khi thiếu key này, nhờ chuỗi fallback Wikipedia → ảnh mặc định).

- [ ] **Bước 2: Golden path**

Chạy: `npm run dev`, mở `http://localhost:5173`.
Đi qua: nhập prompt tự do (vd "Tôi muốn đi biển 3 ngày, ăn uống ngon") → bấm "Gợi ý cho tôi ✨" → xác nhận 6 khung skeleton hiện ra rồi có text thật, ảnh fade-in dần → bấm 1 card → xác nhận sheet mở với ảnh, tóm tắt, và thời tiết (shimmer rồi có dữ liệu thật) → bấm "Tạo lịch trình cho [Tên]" → xác nhận sheet đóng, `ItineraryScreen` hiện tabs theo ngày với skeleton slot rồi có slot thật, ảnh fade-in → bấm qua hết các tab ngày, xác nhận mỗi ngày đúng 4 khung giờ (Sáng/Trưa/Chiều/Tối).
Kỳ vọng: không lỗi console, không có ô ảnh trắng ở bất kỳ thời điểm nào.

- [ ] **Bước 3: Giả lập lỗi — AI thất bại**

Tạm sửa `OPENAI_API_KEY=invalid` trong `server/.env`, khởi động lại server, lặp lại luồng gợi ý.
Kỳ vọng: `SuggestionsScreen` hiện `ErrorBanner` với nội dung "Không tạo được gợi ý lúc này, thử lại nhé" và nút "Thử lại" hoạt động; phần còn lại của UI (header, nút quay lại) vẫn dùng được. Khôi phục lại key thật sau khi kiểm tra xong.

- [ ] **Bước 4: Giả lập lỗi — chuỗi fallback ảnh**

Tạm đổi `UNSPLASH_ACCESS_KEY` thành giá trị sai, và chọn một tên địa điểm rất hiếm/hư cấu trong prompt để Wikipedia không có trang tương ứng.
Kỳ vọng: ảnh của card vẫn hiển thị — một trong 4 ảnh `/fallback-images/fallback-N.svg` đóng gói sẵn — không bao giờ là ô trống. Khôi phục lại key thật sau khi kiểm tra xong.

- [ ] **Bước 5: Giả lập lỗi — thời tiết ngoài phạm vi dự báo**

Trong "Tinh chỉnh thêm", chọn ngày đi (start date) xa hơn 16 ngày kể từ hôm nay, mở sheet chi tiết của một địa điểm.
Kỳ vọng: `WeatherRow` hiện "Chưa có dự báo" cho từng ngày thay vì crash hay hiện banner lỗi (khớp `available: false` trong response của `/api/weather`).

- [ ] **Bước 6: Kiểm thử responsive**

Dùng device toolbar của DevTools trình duyệt, kiểm tra ở `375px` (mobile), `768px` (tablet), `1280px` (desktop):
- Mobile: "Tinh chỉnh thêm" mặc định thu gọn; lưới `SuggestionsScreen` 1 cột; `DetailSheet` là bottom sheet có handle vuốt.
- Tablet: "Tinh chỉnh thêm" mặc định mở sẵn; lưới 2 cột; `DetailSheet` chuyển thành modal căn giữa, ẩn handle.
- Desktop: lưới 3 cột; lưới slot của `ItineraryScreen` hiện đủ 4 khung giờ cạnh nhau.
Kỳ vọng: không có thanh cuộn ngang, không nội dung nào chồng lấn ở bất kỳ độ rộng nào.

- [ ] **Bước 7: Chạy lại bộ unit test backend**

Chạy: `npm run test -w server`
Kỳ vọng: toàn bộ test trong `imageFallback.test.ts` (viết ở Plan 1) vẫn pass.

- [ ] **Bước 8: Commit cuối cùng (nếu có sửa đổi phát sinh từ QA)**

```bash
git add -A
git commit -m "chore: complete manual QA pass for Phase 1 demo"
```

(Bỏ qua bước commit này nếu Bước 2-7 không phát sinh thay đổi code nào — bước này chỉ để ghi lại các sửa lỗi phát hiện trong lúc QA, nếu có.)

---

## Hoàn thành

Sau Plan 4, Phase 1 demo của "Lên Kế Hoạch Du Lịch" đã đầy đủ theo đúng phạm vi trong `docs/superpowers/specs/2026-08-10-travel-planner-design.md`.

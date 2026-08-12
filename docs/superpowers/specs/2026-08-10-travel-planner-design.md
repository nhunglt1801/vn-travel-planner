# Thiết kế: Web App "Lên Kế Hoạch Du Lịch" (Demo Phase 1)

## 1. Mục tiêu & Phạm vi

Web app mobile-first, demo, cho phép người dùng mô tả mong muốn đi chơi (bằng lời + chọn nhanh), nhận gợi ý địa điểm từ AI dưới dạng lưới card, xem chi tiết + thời tiết của một địa điểm, rồi yêu cầu AI tạo lịch trình chi tiết theo ngày cho địa điểm đó.

**Trong phạm vi (Phase 1):**
- Màn hình nhập yêu cầu (prompt tự do + chọn nhanh)
- AI gợi ý địa điểm → lưới card có ảnh
- Modal chi tiết địa điểm (ảnh, tóm tắt thật, thời tiết theo ngày đã chọn)
- AI tạo lịch trình theo ngày/khung giờ, mỗi khung giờ là 1 địa điểm cụ thể kèm ảnh
- Loading skeleton/shimmer, xử lý lỗi nhẹ nhàng không crash

**Ngoài phạm vi (để Phase sau):** đăng nhập, lưu tài khoản, thanh toán, bản đồ, chia sẻ.

**Design System:** áp dụng theo `wanderlog.com-DESIGN.md` (coral đỏ `#F75940` làm accent chính, charcoal `#212529` cho text, Source Sans 3, card bo góc 16px, spacing base 8px, breakpoints mobile `<640px` / tablet `640–1024px` / desktop `≥1024px`).

## 2. Kiến trúc & Tech Stack

- **Frontend:** React 19 + Vite + TypeScript, SPA. Styling bằng CSS thuần/CSS Modules dùng CSS variables ánh xạ trực tiếp từ token trong DESIGN.md (màu, spacing, radius, shadow, typography). Không dùng thư viện UI ngoài — design system đã đủ chi tiết. **Ngoại lệ duy nhất (quyết định 2026-08-12):** ô chọn ngày đi ở `InputScreen` dùng `DatePicker` từ `react-rainbow-components` (thay cho `<input type="date">` mặc định của trình duyệt), theo yêu cầu trực tiếp của người dùng — màu khi chọn ngày dùng đúng màu accent coral `#F75940` của hệ thống qua theming của thư viện (`RainbowThemeContainer`, `palette.brand`). Kéo theo dependency `styled-components` (ghim bản `5.x`, vì `react-rainbow-components@1.32.0` yêu cầu `styled-components <6`).
- **Backend:** Node.js + Express (TypeScript), là **proxy duy nhất** tới các dịch vụ ngoài để giữ API key an toàn (không lộ ra client):
  - **OpenAI API** — phân tích yêu cầu, gợi ý địa điểm, sinh lịch trình (Structured Outputs / JSON Schema).
  - **Wikipedia API** (không cần key) — nguồn ảnh **chính**, ảnh thật đúng địa danh theo tên địa điểm.
  - **Unsplash API** — chỉ dùng làm **fallback** khi Wikipedia không trả được ảnh (không có trang/không có ảnh/lỗi gọi API).
  - **Open-Meteo** (Geocoding API + Forecast API) — không cần key, dùng để lấy toạ độ và dự báo thời tiết.
- **Không dùng database.** Mọi state chỉ tồn tại trong bộ nhớ trình duyệt (React state) trong phiên làm việc — đúng phạm vi demo, không có đăng nhập/lưu trữ.
- **Dev setup:** Vite dev server proxy `/api/*` sang Express (chạy port riêng) để tránh CORS.

**Cấu trúc thư mục:**
```
/client
  /src
    /screens        # InputScreen, SuggestionsScreen, ItineraryScreen
    /components      # PlaceCard, DetailSheet, WeatherRow, DayTabs, TimeSlotCard, Skeleton, ErrorBanner...
    /api             # fetch wrappers gọi sang backend
    /types
    /styles          # design tokens (CSS variables từ DESIGN.md)
/server
  /src
    /routes          # suggest.ts, itinerary.ts, image.ts, weather.ts
    /services        # openai.ts, wikipedia.ts, unsplash.ts, openMeteo.ts
    /types
  .env.example       # OPENAI_API_KEY, UNSPLASH_ACCESS_KEY
```

## 3. Luồng màn hình & Điều hướng

Không dùng router — 3 màn hình chính chuyển đổi bằng state cục bộ ở component `App` cấp cao nhất (đủ cho SPA demo, không cần deep-linking ở Phase 1). State giữ xuyên suốt: yêu cầu gốc của người dùng, danh sách gợi ý đã tải (để quay lại không phải gọi AI lại), địa điểm đang xem chi tiết, lịch trình đã sinh.

### 3.1 `InputScreen` — layout Conversational-first
- Ô prompt tự do là hero của màn hình.
- Khối "Tinh chỉnh thêm" hiển thị **luôn luôn**, ngay dưới ô prompt tự do, không thu gọn/mở ra — người dùng không phải bấm thêm thao tác nào để thấy các lựa chọn nhanh: khu vực (text, để trống được), số ngày (chip 1–7), ngày đi (date picker cho ngày bắt đầu), ngân sách (3 chip đơn chọn: tiết kiệm/vừa/cao cấp), phong cách (chip đa chọn: biển, núi, ẩm thực, lịch sử, nghỉ dưỡng, sôi động...), đi với ai (chip đơn chọn: một mình/cặp đôi/gia đình/nhóm bạn).
- Tất cả trường chọn nhanh có **giá trị mặc định hợp lý** (số ngày=3, ngày đi=ngày mai, ngân sách=vừa, phong cách=[], đi cùng=một mình) để người dùng chỉ cần gõ prompt tự do là đủ để bấm gợi ý; chỉnh các trường bên dưới giúp kết quả sát hơn.
- Nút CTA "Gợi ý cho tôi ✨" (coral, cố định dưới) → chuyển `SuggestionsScreen`.

### 3.2 `SuggestionsScreen` — lưới 1 cột, card lớn
- Gọi `POST /api/suggest` ngay khi vào màn hình; card list hiện ngay khi có text (ảnh vào sau — xem mục 5).
- Mỗi `PlaceCard`: ảnh lớn, tên địa điểm, mô tả ngắn "vì sao hợp với bạn", vài tag.
- Bấm 1 card → mở `DetailSheet` (bottom sheet, chồng lên trên).
- Nút quay lại `InputScreen` để chỉnh lại yêu cầu (giữ nguyên giá trị đã nhập).

### 3.3 `DetailSheet` — bottom sheet
- Trượt lên từ dưới, bo góc trên, nền phía sau mờ đi; có handle để vuốt xuống đóng.
- Nội dung: ảnh lớn, tóm tắt thông tin thật về khu vực, dự báo thời tiết cho từng ngày trong khoảng ngày đi đã chọn (gọi `GET /api/weather` lazy — chỉ khi sheet mở), nút "Tạo lịch trình cho [Tên]".
- Bấm nút tạo lịch trình → gọi `POST /api/itinerary`, đóng sheet, chuyển sang `ItineraryScreen` (màn hình riêng toàn bộ).

### 3.4 `ItineraryScreen` — tabs theo ngày
- Header có nút quay lại → về `SuggestionsScreen` (giữ nguyên danh sách gợi ý đã tải).
- Tabs "Ngày 1..N" (N = số ngày đã chọn, tối đa 7); mỗi tab hiện 4 `TimeSlotCard` theo thứ tự Sáng/Trưa/Chiều/Tối.
- Mỗi `TimeSlotCard`: ảnh (tải song song, skeleton riêng), tên địa điểm cụ thể, mô tả ngắn.

## 4. API Backend

### 4.1 `POST /api/suggest`
- **Input:** `{ prompt: string, region?: string, days: number (1-7), startDate: string (ISO date), budget: 'budget'|'mid'|'premium', styles: string[], companion: 'solo'|'couple'|'family'|'friends' }`
- Gọi OpenAI với **Structured Outputs** (`response_format: json_schema`, `strict: true`) để đảm bảo đúng cấu trúc, tránh tự parse text lỗi.
- **Output schema:** `{ places: Array<{ id: string, name: string, region: string, country: string, reason: string, tags: string[], imageQuery: string }> }`, đúng 6 phần tử.
- Trả về ngay danh sách này, **chưa kèm ảnh**.

### 4.2 `GET /api/image?query=...`
- **Chuỗi nguồn ảnh theo thứ tự ưu tiên, đảm bảo luôn có ảnh** (yêu cầu cứng: không để ô ảnh trống):
  1. **Wikipedia trước** — tìm trang theo `imageQuery`/tên địa điểm (Wikipedia REST API `page/summary` hoặc PageImages), lấy ảnh thumbnail/original của trang nếu có → đây là ảnh thật đúng địa danh, ưu tiên hàng đầu.
  2. Nếu Wikipedia không tìm thấy trang, trang không có ảnh, hoặc gọi API lỗi/timeout → **fallback sang Unsplash** Search Photos: trước tiên theo `imageQuery` cụ thể (vd "Đà Lạt Lâm Đồng"), nếu rỗng thì theo 1 tag chung từ kết quả AI (vd "beach", "mountain"), nếu vẫn rỗng thì theo từ khoá chung "travel destination".
  3. Nếu Unsplash cũng lỗi/không phản hồi được (network/key lỗi) hoặc vẫn không ra kết quả → trả về 1 trong vài ảnh minh hoạ **mặc định** đóng gói sẵn trong `/client/public`, chọn theo hash tên địa điểm (không lặp lại y hệt liên tiếp) — đảm bảo không bao giờ trắng ảnh kể cả khi mất kết nối tới cả Wikipedia lẫn Unsplash.
- **Output:** `{ url: string, alt: string, source: 'wikipedia' | 'unsplash' | 'fallback' }`

### 4.3 `GET /api/weather?place=...&region=...&dates=YYYY-MM-DD,...`
- Geocode `place`/`region` → lat/lon bằng Open-Meteo Geocoding API.
- Gọi Open-Meteo Forecast API (daily temperature max/min + weather code).
- Với mỗi ngày trong `dates`: nếu trong phạm vi dự báo (~16 ngày tới) → trả nhiệt độ + tình trạng; nếu quá xa → `{ date, available: false }`.
- **Output:** `{ location: { lat, lon, resolvedName }, days: Array<{ date: string, available: true, tempMin: number, tempMax: number, condition: string, icon: string } | { date: string, available: false }> }`

### 4.4 `POST /api/itinerary`
- **Input:** `{ placeName, region, country, days, startDate, budget, styles, companion }` (địa điểm đã chọn + toàn bộ tuỳ chọn chuyến đi ban đầu)
- Gọi OpenAI (Structured Outputs) sinh đúng `days` ngày, mỗi ngày đúng 4 khung giờ cố định.
- **Output schema:** `{ days: Array<{ date: string, slots: { morning: Slot, noon: Slot, afternoon: Slot, evening: Slot } }> }` với `Slot = { name: string, description: string, imageQuery: string }`.
- Trả về ngay, **chưa kèm ảnh**; frontend gọi `/api/image` song song cho từng khung giờ (dùng lại đúng logic mục 4.2).

### 4.5 Xử lý lỗi tầng backend
Mỗi service call (OpenAI/Wikipedia/Unsplash/Open-Meteo) bọc try/catch riêng biệt:
- OpenAI lỗi/timeout → trả HTTP lỗi rõ ràng kèm message, để frontend hiện banner + nút thử lại.
- Wikipedia/Unsplash/Open-Meteo lỗi → dùng fallback tương ứng (mục 4.2/4.3), không làm hỏng response tổng thể.

## 5. Loading & Skeleton (Cách B: AI trước, ảnh song song sau)

Để tối ưu cảm giác mượt: AI trả text trước và hiển thị ngay, ảnh tải độc lập song song per-card/per-slot, không chờ nhau.

- **`SuggestionsScreen`:** trong lúc chờ `/api/suggest`, hiện 6 khung skeleton card (đúng kích thước thật) với shimmer (nền `#F3F4F5`, gradient quét qua). Khi có data, card hiện ngay với text; vùng ảnh tiếp tục shimmer riêng cho tới khi `/api/image` trả về, rồi fade-in (opacity transition ~200ms).
- **`DetailSheet`:** ảnh lớn shimmer trong lúc chờ; phần thời tiết hiện khung skeleton nhỏ trong lúc `/api/weather` chạy.
- **`ItineraryScreen`:** khi `/api/itinerary` đang chạy, hiện skeleton cho 4 slot của ngày đang xem; ảnh mỗi slot shimmer riêng như card gợi ý, fade-in khi có.

## 6. Xử lý lỗi (Frontend)

Nguyên tắc: lỗi cục bộ theo từng khu vực UI, không bao giờ crash hay trắng toàn màn hình.

- **Lỗi `/api/suggest` hoặc `/api/itinerary`:** hiện dưới dạng **modal cảnh báo lỗi giữa màn hình** (quyết định 2026-08-12, thay cho banner nội tuyến ban đầu) — nền phía sau mờ đi (overlay), khối modal căn giữa màn hình chứa nội dung lỗi "Không tạo được gợi ý lúc này, thử lại nhé" (hoặc thông báo tương ứng cho itinerary) và bên dưới là nút **Thử lại** căn giữa. Modal co giãn theo responsive (mobile: gần full-width có margin hai bên; tablet/desktop: max-width cố định căn giữa) để không bao giờ vỡ giao diện ở bất kỳ kích thước màn hình nào. Bấm "Thử lại" → gọi lại API tương ứng; nếu thành công thì modal đóng lại và hiện danh sách/lịch trình vừa tải được; nếu vẫn lỗi thì modal cảnh báo tiếp tục hiện lại. Dùng chung component `ErrorBanner` (đã đổi từ banner nội tuyến sang modal) cho cả `SuggestionsScreen` và `ItineraryScreen`, để nhất quán.
- **Lỗi `/api/image`:** đã có fallback ở backend (mục 4.2) nên frontend hầu như không cần xử lý riêng — luôn nhận được 1 URL hợp lệ.
- **Lỗi `/api/weather`:** dòng nhỏ "Không tải được dự báo thời tiết lúc này" trong đúng vị trí phần thời tiết; các phần khác của sheet vẫn dùng được.
- **Error Boundary tổng** bọc `App` chỉ để chặn crash-trắng-trang do lỗi không lường trước; các lỗi API dự kiến đều xử lý cục bộ như trên.

## 7. Responsive

Áp dụng breakpoints từ DESIGN.md: mobile-first (`<640px`, 1 cột), tablet (`640–1024px`), desktop (`≥1024px`).

- **Lưới card (`SuggestionsScreen`):** 1 cột trên mobile (đã chọn) → 2 cột trên tablet → 3-4 cột trên desktop, giữ nguyên tỷ lệ ảnh/nội dung của card.
- **`DetailSheet`:** bottom sheet trượt từ dưới trên mobile (đã chọn) → trên tablet/desktop (`≥640px`) chuyển thành modal căn giữa màn hình, bo góc `16px` cả 4 cạnh, max-width `480px`, nền overlay mờ phía sau — cùng component, chỉ đổi vị trí/hình dạng theo breakpoint.
- **`ItineraryScreen`:** tabs theo ngày giữ nguyên trên mọi kích thước; nội dung mỗi tab giới hạn max-width theo container pattern của DESIGN.md (`1200px` desktop) để dòng text không quá dài.

## 8. Phạm vi kiểm thử

- Không xây bộ test tự động đầy đủ (ngoài phạm vi demo).
- Kiểm thử thủ công theo golden path: nhập yêu cầu → xem gợi ý → mở chi tiết → xem thời tiết → tạo lịch trình → xem đủ số ngày/khung giờ.
- Kiểm thử lỗi giả lập: tắt mạng khi tải ảnh, sai API key AI, chọn ngày đi xa (>16 ngày) để xác nhận fallback thời tiết.
- Kiểm thử responsive: mobile trước, sau đó tablet/desktop.
- 1-2 unit test cho logic fallback ảnh ở backend (đảm bảo luôn trả về 1 URL kể cả khi Wikipedia và Unsplash đều lỗi) — vì đây là yêu cầu cứng đáng test tự động.

## 9. Cấu hình môi trường

`.env.example` ở `/server`:
```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
UNSPLASH_ACCESS_KEY=
```
Không cần key cho Open-Meteo (Geocoding + Forecast đều miễn phí, không cần đăng ký) và Wikipedia API (REST API public, không cần đăng ký). `UNSPLASH_ACCESS_KEY` chỉ cần thiết cho trường hợp fallback khi Wikipedia không có ảnh. `OPENAI_MODEL` mặc định `gpt-4o-mini` (đủ nhanh/rẻ cho JSON có cấu trúc ở quy mô demo), có thể đổi sang model khác qua biến môi trường mà không cần sửa code.

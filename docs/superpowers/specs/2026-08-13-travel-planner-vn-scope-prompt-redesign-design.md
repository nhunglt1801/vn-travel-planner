# Thiết kế: Giới hạn gợi ý trong Việt Nam + Nâng cấp khung nhập yêu cầu

## 1. Bối cảnh & Mục tiêu

App hiện tại (`docs/superpowers/specs/2026-08-10-travel-planner-design.md`) đang gợi ý địa điểm không giới hạn quốc gia — kiểm thử thực tế cho thấy AI trả về cả địa điểm nước ngoài (Bali, Maldives, Phuket, Gold Coast...) dù sản phẩm chỉ phục vụ người dùng Việt Nam. Đồng thời, khung nhập yêu cầu (`InputScreen`) còn đơn giản, chưa tạo cảm giác chuyên nghiệp/thu hút, và trường "Khu vực" là input tự do không có gợi ý.

**Mục tiêu:**
1. Giới hạn toàn bộ gợi ý AI (`POST /api/suggest`) chỉ trong lãnh thổ Việt Nam.
2. Đổi trường "Khu vực" thành ô tìm kiếm chọn 1 trong 34 tỉnh/thành chính thức (danh sách cố định do người dùng cung cấp), lọc không phân biệt dấu.
3. Thiết kế lại khung prompt tự do theo hướng "năng lượng" (viền coral + glow khi focus), thêm khối "Gợi ý nhanh" gồm 2 hàng: câu mẫu đầy đủ (điền vào ô prompt) và điểm đến nổi bật (điền vào ô Khu vực).

**Ngoài phạm vi:** không đổi cấu trúc điều hướng 3 màn hình, không đổi `SuggestRequest`/`Place` type, không đổi các field/chip khác (Số ngày, Ngày đi, Ngân sách, Phong cách, Đi với ai), không động tới Plan 2/3 (thời tiết, lịch trình) — các phần đó chưa triển khai, sẽ tự động thừa hưởng giới hạn Việt Nam vì luôn build trên địa điểm đã được gợi ý.

Spec này bổ sung cho spec gốc, không thay thế — các phần không nêu ở đây giữ nguyên theo spec gốc.

## 2. Giới hạn gợi ý trong Việt Nam

Sửa `server/src/services/openai.ts`, hàm `getSuggestions`: thêm câu bắt buộc vào system prompt — chỉ được gợi ý địa điểm nằm trong lãnh thổ Việt Nam, tuyệt đối không gợi ý địa điểm ở nước khác, kể cả khi prompt/khu vực người dùng nhập gợi ý đến phong cách du lịch quốc tế (vd "biển đẹp như Bali").

Không đổi schema (`country` vẫn là field string như cũ, thực tế sẽ luôn là "Việt Nam"). Không đổi kiểu `Place`/`SuggestResponse`.

**Kiểm chứng:** gọi `/api/suggest` nhiều lần với các tổ hợp options khác nhau (đặc biệt prompt rỗng, chỉ chọn style/budget — đây là điều kiện dễ ra kết quả nước ngoài nhất theo quan sát thực tế), xác nhận `country` luôn là "Việt Nam" và `region` là tỉnh/thành hợp lệ của Việt Nam.

## 3. Trường "Khu vực" → Combobox chọn tỉnh/thành

### 3.1 Dữ liệu

File mới `client/src/data/provinces.ts`:
```ts
export const VIETNAM_PROVINCES: string[] = [
  'Hà Nội', 'Hải Phòng', 'Huế', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Cần Thơ',
  'Tuyên Quang', 'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên',
  'Ninh Bình', 'Quảng Ninh', 'Cao Bằng', 'Lạng Sơn', 'Lai Châu', 'Điện Biên',
  'Sơn La', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Trị', 'Quảng Ngãi',
  'Gia Lai', 'Khánh Hòa', 'Lâm Đồng', 'Đắk Lắk', 'Đồng Nai', 'Tây Ninh',
  'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang',
];

export interface HotDestination {
  icon: string;
  label: string;    // tên hiển thị trên chip, có thể kèm tên gọi quen thuộc
  province: string; // phải khớp đúng 1 phần tử trong VIETNAM_PROVINCES
}

export const HOT_DESTINATIONS: HotDestination[] = [
  { icon: '🏛️', label: 'Hà Nội', province: 'Hà Nội' },
  { icon: '🏯', label: 'Đà Nẵng', province: 'Đà Nẵng' },
  { icon: '🌊', label: 'Khánh Hòa (Nha Trang)', province: 'Khánh Hòa' },
  { icon: '🏔️', label: 'Lâm Đồng (Đà Lạt)', province: 'Lâm Đồng' },
  { icon: '⛵', label: 'Quảng Ninh (Vịnh Hạ Long)', province: 'Quảng Ninh' },
  { icon: '🏙️', label: 'TP. Hồ Chí Minh', province: 'TP. Hồ Chí Minh' },
];
```
(Danh sách 34 tỉnh giữ nguyên đúng thứ tự người dùng cung cấp; `HOT_DESTINATIONS` là tập con 6 phần tử phổ biến nhất, chọn từ đúng 34 tên trên để đảm bảo giá trị điền vào luôn hợp lệ.)

### 3.2 Tiện ích lọc không phân biệt dấu

File mới `client/src/utils/text.ts`:
```ts
export function stripDiacritics(text: string): string {
  return text
    .replace(/đ/gi, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
```
(Cùng nguyên lý với `toAsciiSlug` đã thêm ở `server/src/services/wikipedia.ts` khi sửa lỗi ảnh Wikipedia — tách riêng bản cho client vì hai bên không dùng chung module.)

### 3.3 Component `ProvinceCombobox`

File mới `client/src/components/ProvinceCombobox.tsx` + `.module.css`.

**Props:** `{ value: string; onChange: (value: string) => void }` — controlled, thay thế hoàn toàn `<input type="text">` hiện tại của field "Khu vực" trong `InputScreen`.

**Hành vi:**
- Focus vào ô → mở dropdown hiện toàn bộ 34 tỉnh (danh sách cuộn, `max-height` ~280px), giúp khám phá được cả khi chưa gõ gì.
- Gõ chữ → lọc theo `stripDiacritics(query)` là substring của `stripDiacritics(tên tỉnh)` (gõ không dấu vẫn ra kết quả đúng dấu, vd "ha noi" → "Hà Nội").
- Không có kết quả khớp → hiện dòng "Không tìm thấy tỉnh/thành phù hợp".
- Chọn 1 mục trong dropdown (click hoặc Enter khi đang highlight) → gọi `onChange(tên tỉnh)`, đóng dropdown, ô hiển thị đúng tên đã chọn.
- Click ra ngoài mà chưa chọn gì → đóng dropdown, ô quay về hiển thị đúng `value` hiện tại (giá trị đã chọn hợp lệ gần nhất) — không giữ lại text gõ dở nếu không khớp/không chọn, tránh `region` chứa giá trị không nằm trong danh sách chuẩn.
- Có thể để trống hoàn toàn (field vẫn optional, giữ đúng `region?: string`).

## 4. Thiết kế lại khung nhập prompt

Đã chốt qua trao đổi trực tiếp với người dùng bằng visual companion (3 phương án A/B/C, người dùng chọn hướng C — "Energetic + Gợi ý nhanh").

### 4.1 Khung prompt tự do

Đổi `.promptInput` trong `InputScreen.module.css`:
- Viền `2px solid var(--color-coral)` (thay vì `1px solid var(--color-border)` như hiện tại).
- Khi focus: thêm glow — `box-shadow: 0 0 0 4px rgba(247, 89, 64, 0.1)` (đồng dạng với `--focus-shadow` hiện có nhưng dùng màu coral thay vì deep-blue, vì đây là ô CTA chính của màn hình, cần nổi bật hơn các field phụ khác).
- Tiêu đề `<h1>` thêm icon: "Bạn muốn đi đâu? ✈️".

### 4.2 Khối "Gợi ý nhanh"

Đặt ngay dưới khung prompt tự do, phía trên khối "Tinh chỉnh thêm". Gồm 2 hàng, mỗi hàng có nhãn nhỏ (uppercase, giống style `.fieldLabel` hiện có):

**Hàng "Thử nhanh"** — 3 chip dạng câu đầy đủ (mỗi chip 1 dòng, không phải pill tròn như chip Số ngày/Ngân sách — dùng khối chữ nhật bo góc nhẹ để chứa câu dài):
```
"Đi biển 3 ngày, ăn uống ngon, không quá đông đúc"
"Nghỉ dưỡng cuối tuần gần Hà Nội, có view núi"
"Khám phá ẩm thực miền Trung cùng gia đình"
```
Bấm vào 1 chip → `setForm(f => ({ ...f, prompt: <nội dung câu đó> }))` (ghi đè toàn bộ nội dung ô prompt hiện tại, giống hành vi "starter prompt" của ChatGPT/Claude).

**Hàng "Đang hot"** — chip tròn (pill, cùng style `.chip` đang dùng cho Ngân sách/Phong cách) lấy từ `HOT_DESTINATIONS`, hiển thị `icon + label`. Bấm vào 1 chip → `setForm(f => ({ ...f, region: destination.province }))` (chỉ đổi `region`, không đụng vào `prompt`) — đồng thời `ProvinceCombobox` cập nhật hiển thị theo `value` mới vì là controlled component.

### 4.3 Không đổi

Khối "Tinh chỉnh thêm" (Số ngày, Ngày đi, Ngân sách, Phong cách, Đi với ai) và nút CTA "Gợi ý cho tôi ✨" giữ nguyên vị trí, style, hành vi như hiện tại.

## 5. Danh sách file thay đổi

```
server/src/services/openai.ts          # sửa — thêm ràng buộc VN vào system prompt

client/src/data/provinces.ts           # mới — VIETNAM_PROVINCES, HOT_DESTINATIONS
client/src/utils/text.ts               # mới — stripDiacritics
client/src/components/ProvinceCombobox.tsx        # mới
client/src/components/ProvinceCombobox.module.css # mới
client/src/screens/InputScreen.tsx     # sửa — dùng ProvinceCombobox, thêm khối Gợi ý nhanh
client/src/screens/InputScreen.module.css  # sửa — style prompt box mới + style khối gợi ý nhanh
```

## 6. Kiểm thử

Không có framework test cho client trong dự án (chỉ backend dùng Vitest, theo đúng quy ước hiện tại của dự án — xem spec gốc mục 8). Kiểm thử thủ công:

- Gọi `/api/suggest` nhiều lần (gồm cả trường hợp prompt rỗng + chỉ chọn options) → xác nhận toàn bộ 6 địa điểm đều thuộc Việt Nam.
- `ProvinceCombobox`: gõ có dấu, gõ không dấu, gõ sai chính tả (xác nhận hiện "không tìm thấy"), click chọn, click ra ngoài khi chưa chọn (xác nhận ô trả về giá trị cũ), để trống rồi submit (xác nhận vẫn gợi ý được bình thường).
- Bấm từng chip "Thử nhanh" → xác nhận ô prompt được điền đúng nguyên câu, ghi đè nội dung cũ.
- Bấm từng chip "Đang hot" → xác nhận `ProvinceCombobox` hiển thị đúng tỉnh tương ứng.
- Responsive: kiểm tra 2 hàng gợi ý nhanh không vỡ layout ở mobile (`375px`), tablet, desktop — hàng chip tròn wrap dòng, hàng câu mẫu xếp dọc.

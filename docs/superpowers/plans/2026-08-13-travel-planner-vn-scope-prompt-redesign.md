# VN-only Suggestions + Prompt Input Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giới hạn gợi ý AI chỉ trong lãnh thổ Việt Nam, thay trường "Khu vực" bằng combobox tìm kiếm 34 tỉnh/thành, và thiết kế lại khung prompt tự do với khối "Gợi ý nhanh" (câu mẫu + điểm đến nổi bật).

**Architecture:** Sửa system prompt của `getSuggestions` ở backend để ràng buộc quốc gia. Ở client, thêm data tĩnh (danh sách tỉnh + điểm đến hot), một tiện ích bỏ dấu tiếng Việt dùng chung, một component combobox mới thay cho input tự do, rồi nối tất cả vào `InputScreen` đã có sẵn.

**Tech Stack:** kế thừa nguyên trạng dự án — React 19 + TypeScript + CSS Modules ở client, Express + OpenAI SDK ở server. Không thêm thư viện mới.

**Spec:** `docs/superpowers/specs/2026-08-13-travel-planner-vn-scope-prompt-redesign-design.md`

## Global Constraints

- Toàn bộ 6 địa điểm trả về từ `POST /api/suggest` phải nằm trong lãnh thổ Việt Nam (field `country` luôn là "Việt Nam").
- Danh sách 34 tỉnh/thành phải giữ nguyên đúng thứ tự đã cho trong spec, không thêm/bớt/sửa tên.
- Mỗi phần tử `HotDestination.province` phải khớp đúng một phần tử trong `VIETNAM_PROVINCES` (giá trị hợp lệ để điền vào combobox).
- Không đổi `SuggestRequest`, `Place`, hay bất kỳ type nào trong `client/src/types/index.ts` / `server/src/types/index.ts`.
- Không có framework test tự động cho client trong dự án (chỉ backend dùng Vitest) — theo đúng quy ước hiện tại, phần client kiểm thử thủ công qua `npx tsc --noEmit` + chạy tay trên trình duyệt.
- Design tokens: dùng biến có sẵn trong `client/src/styles/tokens.css` (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--font-*`), không hardcode giá trị đã có token tương ứng.

---

### Task 1: Giới hạn gợi ý AI trong lãnh thổ Việt Nam

**Files:**
- Modify: `server/src/services/openai.ts:37-40`

**Interfaces:**
- Không đổi signature `getSuggestions(req: SuggestRequest): Promise<Place[]>` — chỉ đổi nội dung system prompt.

- [ ] **Bước 1: Sửa system prompt trong `getSuggestions`**

Tìm khối `messages` trong `server/src/services/openai.ts`, thay nội dung `content` của message `role: 'system'` từ:

```ts
        content:
          'Bạn là chuyên gia tư vấn du lịch. Dựa trên mong muốn của người dùng, gợi ý đúng 6 địa điểm du lịch phù hợp, đa dạng, kèm lý do ngắn gọn vì sao hợp với họ. Trường imageQuery của mỗi địa điểm BẮT BUỘC là tên địa danh viết bằng tiếng Anh, dạng slug chữ thường nối bằng dấu gạch ngang, không dấu tiếng Việt, không viết dính liền (vd: "da-lat", "ha-long-bay", "phu-quoc") — dùng để tra cứu ảnh trên Wikipedia, tuyệt đối không được để nguyên tiếng Việt hay viết dính liền kiểu PascalCase.',
```

thành:

```ts
        content:
          'Bạn là chuyên gia tư vấn du lịch. Dựa trên mong muốn của người dùng, gợi ý đúng 6 địa điểm du lịch phù hợp, đa dạng, kèm lý do ngắn gọn vì sao hợp với họ. Toàn bộ 6 địa điểm BẮT BUỘC nằm trong lãnh thổ Việt Nam — tuyệt đối không gợi ý địa điểm ở nước khác, kể cả khi yêu cầu của người dùng gợi liên tưởng đến phong cách du lịch nước ngoài (vd "biển đẹp như Bali", "giống Santorini"); trong trường hợp đó vẫn chọn địa điểm trong nước có đặc điểm tương tự. Trường country của mọi địa điểm luôn là "Việt Nam". Trường imageQuery của mỗi địa điểm BẮT BUỘC là tên địa danh viết bằng tiếng Anh, dạng slug chữ thường nối bằng dấu gạch ngang, không dấu tiếng Việt, không viết dính liền (vd: "da-lat", "ha-long-bay", "phu-quoc") — dùng để tra cứu ảnh trên Wikipedia, tuyệt đối không được để nguyên tiếng Việt hay viết dính liền kiểu PascalCase.',
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Kiểm thử thủ công với API key thật**

Server phải đang chạy (`npm run dev -w server`, có `server/.env` với `OPENAI_API_KEY` thật). Gọi 3 lần với các tổ hợp dễ ra kết quả nước ngoài nhất (prompt rỗng + chỉ chọn style, theo đúng điều kiện đã phát hiện lỗi trước đây):

```bash
curl -s -X POST http://localhost:4000/api/suggest -H "Content-Type: application/json" \
  -d '{"prompt":"","region":"","days":3,"startDate":"2026-08-14","budget":"mid","styles":["beach"],"companion":"solo"}'
```

Kỳ vọng: cả 6 phần tử trong `places` đều có `country` là `"Việt Nam"` và `region` là tên tỉnh/thành hợp lệ của Việt Nam. Lặp lại với `styles: ["resort"]` và `styles: ["nightlife"]` (các phong cách trước đây từng ra Bali/Maldives/Gold Coast) để chắc chắn không còn địa điểm nước ngoài.

- [ ] **Bước 4: Commit**

```bash
git add server/src/services/openai.ts
git commit -m "feat(server): constrain place suggestions to Vietnam only"
```

---

### Task 2: Dữ liệu 34 tỉnh/thành + điểm đến nổi bật

**Files:**
- Create: `client/src/data/provinces.ts`

**Interfaces:**
- Produces: `VIETNAM_PROVINCES: string[]` (đúng 34 phần tử) — dùng ở `ProvinceCombobox` (Task 4).
- Produces: `interface HotDestination { icon: string; label: string; province: string }` và `HOT_DESTINATIONS: HotDestination[]` — dùng ở `InputScreen` (Task 5).

- [ ] **Bước 1: Viết `client/src/data/provinces.ts`**

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
  label: string;
  province: string;
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

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Xác nhận mọi `province` trong `HOT_DESTINATIONS` khớp `VIETNAM_PROVINCES`**

Tạo file tạm `client/src/data/_debugProvinces.ts`:

```ts
import { VIETNAM_PROVINCES, HOT_DESTINATIONS } from './provinces';

const bad = HOT_DESTINATIONS.filter((d) => !VIETNAM_PROVINCES.includes(d.province));
console.log(bad.length === 0 ? 'OK' : 'MISMATCH: ' + JSON.stringify(bad));
console.log('Total provinces:', VIETNAM_PROVINCES.length);
```

Chạy: `npx tsx client/src/data/_debugProvinces.ts`
Kỳ vọng: in ra `OK` và `Total provinces: 34`.

Xoá file tạm sau khi xác nhận đúng: `rm client/src/data/_debugProvinces.ts`

**Lưu ý cho người thực thi:** không dùng `npx tsx -e "<script nhiều dòng có import>"` để kiểm chứng — đã xác nhận thực tế lệnh này chạy êm nhưng không in ra bất kỳ output nào trong môi trường này (npm nuốt mất script). Luôn dùng file tạm (`npx tsx path/to/file.ts`) rồi xoá sau khi xong, như mọi bước kiểm chứng script trong plan này.

- [ ] **Bước 4: Commit**

```bash
git add client/src/data/provinces.ts
git commit -m "feat(client): add Vietnam province list and hot destination data"
```

---

### Task 3: Tiện ích tìm kiếm không phân biệt dấu

**Files:**
- Create: `client/src/utils/text.ts`

**Interfaces:**
- Produces: `stripDiacritics(text: string): string` — dùng ở `ProvinceCombobox` (Task 4) để lọc danh sách tỉnh khi gõ không dấu.

- [ ] **Bước 1: Viết `client/src/utils/text.ts`**

```ts
export function stripDiacritics(text: string): string {
  return text
    .replace(/đ/gi, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Kiểm chứng hành vi bằng script tạm**

Tạo file tạm `client/src/utils/_debugText.ts`:

```ts
import { stripDiacritics } from './text';

console.log(stripDiacritics('Hà Nội'));      // ha noi
console.log(stripDiacritics('Đà Nẵng'));     // da nang
console.log(stripDiacritics('Khánh Hòa'));   // khanh hoa
console.log(stripDiacritics('TP. Hồ Chí Minh')); // tp. ho chi minh
```

Chạy: `npx tsx client/src/utils/_debugText.ts`
Kỳ vọng: 4 dòng output đúng như comment bên cạnh mỗi dòng (không dấu, chữ thường, giữ nguyên khoảng trắng/dấu chấm).

Xoá file tạm sau khi xác nhận đúng: `rm client/src/utils/_debugText.ts`

- [ ] **Bước 4: Commit**

```bash
git add client/src/utils/text.ts
git commit -m "feat(client): add diacritic-insensitive text search helper"
```

---

### Task 4: Component `ProvinceCombobox`

**Files:**
- Create: `client/src/components/ProvinceCombobox.tsx`
- Create: `client/src/components/ProvinceCombobox.module.css`

**Interfaces:**
- Tiêu thụ: `VIETNAM_PROVINCES` (Task 2), `stripDiacritics` (Task 3).
- Produces: `<ProvinceCombobox value: string, onChange: (value: string) => void />` — dùng ở `InputScreen` (Task 5) thay cho input tự do của field "Khu vực".

- [ ] **Bước 1: Viết `client/src/components/ProvinceCombobox.module.css`**

```css
.container {
  position: relative;
}

.input {
  width: 100%;
  height: 56px;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-subtle);
  font-family: var(--font-family);
  font-size: 16px;
  background: var(--color-white);
  color: var(--color-charcoal);
}

.input:focus {
  outline: none;
  border: var(--focus-border);
  box-shadow: var(--focus-shadow);
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: var(--space-sm);
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-rounded);
  box-shadow: var(--shadow-floating);
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option {
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-subtle);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: 14px;
  color: var(--color-charcoal);
  cursor: pointer;
}

.option:hover {
  background: var(--color-gray-1);
}

.empty {
  padding: var(--space-sm) var(--space-md);
  font-size: 14px;
  color: var(--color-text-secondary);
}
```

- [ ] **Bước 2: Viết `client/src/components/ProvinceCombobox.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { VIETNAM_PROVINCES } from '../data/provinces';
import { stripDiacritics } from '../utils/text';
import styles from './ProvinceCombobox.module.css';

interface ProvinceComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProvinceCombobox({ value, onChange }: ProvinceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setQuery(value);
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, value]);

  const filtered = VIETNAM_PROVINCES.filter((province) =>
    stripDiacritics(province).includes(stripDiacritics(query)),
  );

  function selectProvince(province: string) {
    onChange(province);
    setQuery(province);
    setOpen(false);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="text"
        className={styles.input}
        placeholder="Vd: Hà Nội, Đà Nẵng..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div className={styles.dropdown}>
          {filtered.length === 0 && (
            <div className={styles.empty}>Không tìm thấy tỉnh/thành phù hợp</div>
          )}
          {filtered.map((province) => (
            <button
              key={province}
              type="button"
              className={styles.option}
              onClick={() => selectProvince(province)}
            >
              {province}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Bước 3: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 4: Commit**

```bash
git add client/src/components/ProvinceCombobox.tsx client/src/components/ProvinceCombobox.module.css
git commit -m "feat(client): add ProvinceCombobox searchable select component"
```

---

### Task 5: Nối vào `InputScreen` — combobox + khối gợi ý nhanh + style khung prompt

**Files:**
- Modify: `client/src/screens/InputScreen.tsx`
- Modify: `client/src/screens/InputScreen.module.css`

**Interfaces:**
- Tiêu thụ: `ProvinceCombobox` (Task 4), `HOT_DESTINATIONS` (Task 2).
- Không đổi: `InputScreenProps`, `createDefaultSuggestRequest`, `tomorrowIso` — giữ nguyên signature như hiện tại.

- [ ] **Bước 1: Thay toàn bộ nội dung `client/src/screens/InputScreen.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react';
import type { SuggestRequest, Budget, Companion } from '../types';
import { DayPicker } from 'react-day-picker';
import { vi } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { HOT_DESTINATIONS } from '../data/provinces';
import { ProvinceCombobox } from '../components/ProvinceCombobox';
import styles from './InputScreen.module.css';

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: 'budget', label: 'Tiết kiệm' },
  { value: 'mid', label: 'Vừa' },
  { value: 'premium', label: 'Cao cấp' },
];

const STYLE_OPTIONS = [
  { value: 'beach', label: 'Biển' },
  { value: 'mountain', label: 'Núi' },
  { value: 'food', label: 'Ẩm thực' },
  { value: 'history', label: 'Lịch sử' },
  { value: 'resort', label: 'Nghỉ dưỡng' },
  { value: 'nightlife', label: 'Sôi động' },
];

const COMPANION_OPTIONS: { value: Companion; label: string }[] = [
  { value: 'solo', label: 'Một mình' },
  { value: 'couple', label: 'Cặp đôi' },
  { value: 'family', label: 'Gia đình' },
  { value: 'friends', label: 'Nhóm bạn' },
];

const STARTER_PROMPTS = [
  'Đi biển 3 ngày, ăn uống ngon, không quá đông đúc',
  'Nghỉ dưỡng cuối tuần gần Hà Nội, có view núi',
  'Khám phá ẩm thực miền Trung cùng gia đình',
];

export function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultSuggestRequest(): SuggestRequest {
  return {
    prompt: '',
    region: '',
    days: 3,
    startDate: tomorrowIso(),
    budget: 'mid',
    styles: [],
    companion: 'solo',
  };
}

interface InputScreenProps {
  initialValue: SuggestRequest;
  onSubmit: (request: SuggestRequest) => void;
}

export function InputScreen({ initialValue, onSubmit }: InputScreenProps) {
  const [form, setForm] = useState<SuggestRequest>(initialValue);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  function toggleStyle(value: string) {
    setForm((f) => ({
      ...f,
      styles: f.styles.includes(value) ? f.styles.filter((s) => s !== value) : [...f.styles, value],
    }));
  }

  useEffect(() => {
    if (!pickerOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Bạn muốn đi đâu? ✈️</h1>
      <textarea
        className={styles.promptInput}
        placeholder="Mô tả chuyến đi mơ ước của bạn... (vd: Tôi muốn đi biển 3 ngày, ăn uống ngon, không quá đông đúc)"
        value={form.prompt}
        onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
        rows={4}
      />

      <div className={styles.suggestions}>
        <div className={styles.suggestionGroup}>
          <span className={styles.suggestionLabel}>Thử nhanh</span>
          <div className={styles.starterList}>
            {STARTER_PROMPTS.map((text) => (
              <button
                key={text}
                type="button"
                className={styles.starterChip}
                onClick={() => setForm((f) => ({ ...f, prompt: text }))}
              >
                "{text}"
              </button>
            ))}
          </div>
        </div>

        <div className={styles.suggestionGroup}>
          <span className={styles.suggestionLabel}>Đang hot</span>
          <div className={styles.chipRow}>
            {HOT_DESTINATIONS.map((dest) => (
              <button
                key={dest.province}
                type="button"
                className={styles.chip}
                onClick={() => setForm((f) => ({ ...f, region: dest.province }))}
              >
                {dest.icon} {dest.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 className={styles.advancedLabel}>Tinh chỉnh thêm</h2>

      <div className={styles.advancedPanel}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Khu vực</span>
          <ProvinceCombobox
            value={form.region ?? ''}
            onChange={(region) => setForm((f) => ({ ...f, region }))}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Số ngày</span>
          <div className={styles.chipRow}>
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.chip} ${form.days === d ? styles.chipSelected : ''}`}
                onClick={() => setForm((f) => ({ ...f, days: d }))}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Ngày đi</span>
          <div className={styles.datePickerContainer} ref={pickerRef}>
            <button
              type="button"
              className={styles.datePickerButton}
              onClick={() => setPickerOpen(!pickerOpen)}
            >
              📅 {parseIsoDate(form.startDate).toLocaleDateString('vi-VN')}
            </button>
            {pickerOpen && (
              <div className={styles.datePickerPopover}>
                <DayPicker
                  mode="single"
                  selected={parseIsoDate(form.startDate)}
                  onSelect={(date) => {
                    if (date) {
                      setForm((f) => ({ ...f, startDate: formatIsoDate(date) }));
                      setPickerOpen(false);
                    }
                  }}
                  disabled={{ before: parseIsoDate(tomorrowIso()) }}
                  locale={vi}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Ngân sách</span>
          <div className={styles.chipRow}>
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b.value}
                type="button"
                className={`${styles.chip} ${form.budget === b.value ? styles.chipSelected : ''}`}
                onClick={() => setForm((f) => ({ ...f, budget: b.value }))}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Phong cách</span>
          <div className={styles.chipRow}>
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`${styles.chip} ${form.styles.includes(s.value) ? styles.chipSelected : ''}`}
                onClick={() => toggleStyle(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Đi với ai</span>
          <div className={styles.chipRow}>
            {COMPANION_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`${styles.chip} ${form.companion === c.value ? styles.chipSelected : ''}`}
                onClick={() => setForm((f) => ({ ...f, companion: c.value }))}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" className={styles.cta} onClick={() => onSubmit(form)}>
        Gợi ý cho tôi ✨
      </button>
    </div>
  );
}
```

- [ ] **Bước 2: Sửa `.promptInput`/`.promptInput:focus` trong `client/src/screens/InputScreen.module.css`**

Thay:

```css
.promptInput {
  width: 100%;
  min-height: 120px;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-subtle);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  resize: vertical;
}

.promptInput:focus {
  outline: none;
  border: var(--focus-border);
  box-shadow: var(--focus-shadow);
}
```

thành:

```css
.promptInput {
  width: 100%;
  min-height: 120px;
  padding: var(--space-md);
  border: 2px solid var(--color-coral);
  border-radius: var(--radius-rounded);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  resize: vertical;
}

.promptInput:focus {
  outline: none;
  border-color: var(--color-coral);
  box-shadow: 0 0 0 4px rgba(247, 89, 64, 0.1);
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.suggestionGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.suggestionLabel {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.starterList {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.starterChip {
  text-align: left;
  background: var(--color-gray-1);
  border: 1px solid var(--color-gray-2);
  border-radius: var(--radius-subtle);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: 14px;
  color: var(--color-charcoal);
  cursor: pointer;
}

.starterChip:hover {
  background: var(--color-gray-2);
}
```

(Giữ nguyên toàn bộ phần CSS còn lại của file — `.advancedLabel`, `.advancedPanel`, `.field`, `.fieldLabel`, `.textInput`, `.chipRow`, `.chip`, `.chipSelected`, `.cta`, `.datePickerContainer`, `.datePickerButton`, `.datePickerPopover`, media query cuối file — không đổi.)

- [ ] **Bước 3: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 4: Kiểm thử thủ công trên trình duyệt**

Chạy: `npm run dev`, mở `http://localhost:5173`.

Kiểm tra từng phần:
1. Khung prompt có viền coral 2px, khi click vào thấy glow coral nhạt quanh khung (không còn viền/glow xanh dương cũ).
2. Hàng "Thử nhanh" hiện 3 câu mẫu — bấm 1 câu, xác nhận ô prompt phía trên được điền đúng nguyên câu đó (ghi đè nội dung cũ nếu có).
3. Hàng "Đang hot" hiện 6 chip tròn có icon — bấm 1 chip (vd "🏔️ Lâm Đồng (Đà Lạt)"), xác nhận ô "Khu vực" trong "Tinh chỉnh thêm" hiển thị đúng "Lâm Đồng".
4. Ô "Khu vực": click vào (chưa gõ gì) → xác nhận dropdown hiện đủ 34 tỉnh, cuộn được. Gõ "ha noi" (không dấu) → xác nhận lọc ra "Hà Nội". Gõ "xyzxyz" (không khớp) → xác nhận hiện "Không tìm thấy tỉnh/thành phù hợp". Chọn 1 tỉnh → dropdown đóng, ô hiển thị đúng tên đã chọn. Gõ dở rồi click ra ngoài không chọn → ô quay về giá trị đã chọn trước đó (không giữ text gõ dở).
5. Bấm "Gợi ý cho tôi ✨" với các giá trị vừa thiết lập → xác nhận vẫn gọi `/api/suggest` và chuyển màn hình bình thường như trước (không có gì hỏng ở luồng cũ).

Kỳ vọng: không có lỗi console, không vỡ layout.

- [ ] **Bước 5: Kiểm thử responsive**

Dùng device toolbar DevTools ở `375px` và `1280px`. Kỳ vọng: hàng chip "Đang hot" wrap dòng đúng như `.chipRow` hiện có; hàng "Thử nhanh" xếp dọc không tràn ngang; dropdown của `ProvinceCombobox` không vỡ ra ngoài màn hình ở mobile.

- [ ] **Bước 6: Commit**

```bash
git add client/src/screens/InputScreen.tsx client/src/screens/InputScreen.module.css
git commit -m "feat(client): redesign prompt input with quick-suggestions and province combobox"
```

---

## Sau khi hoàn tất

Toàn bộ 3 mục tiêu trong spec (`docs/superpowers/specs/2026-08-13-travel-planner-vn-scope-prompt-redesign-design.md`) đã triển khai xong: gợi ý AI giới hạn trong Việt Nam, trường Khu vực đổi thành combobox tìm kiếm 34 tỉnh/thành, khung prompt được thiết kế lại với khối gợi ý nhanh 2 hàng.

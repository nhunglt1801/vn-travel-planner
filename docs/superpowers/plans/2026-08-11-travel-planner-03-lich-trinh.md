# Kế hoạch triển khai — Plan 3: Lịch trình chi tiết

> **Dành cho agent thực thi:** BẮT BUỘC dùng sub-skill superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực thi plan này theo từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Yêu cầu trước:** Đã hoàn tất **Plan 0, Plan 1, Plan 2** (`docs/superpowers/plans/2026-08-11-travel-planner-00-nen-tang.md`, `...-01-nhap-yeu-cau-goi-y.md`, `...-02-chi-tiet-thoi-tiet.md`). Plan này build tiếp trên `openai.ts`, `app.ts`, và `App.tsx` đã có.

**Vị trí trong chuỗi 5 plan:** Plan 0 → Plan 1 → Plan 2 → **Plan 3 (plan này)** → Plan 4 (Kiểm thử).

**Mục tiêu:** Khi bấm "Tạo lịch trình cho [Tên]" trong `DetailSheet`, đóng sheet và chuyển sang `ItineraryScreen` — hiển thị tabs theo từng ngày, mỗi ngày đúng 4 khung giờ (Sáng/Trưa/Chiều/Tối) với ảnh, tên, mô tả cho từng khung giờ do AI sinh ra.

**Kiến trúc:** Backend thêm hàm `getItinerary` vào `openai.ts` đã có, thêm route `POST /api/itinerary`. Frontend thêm `DayTabs`, `TimeSlotCard`, `ItineraryScreen`, và hoàn thiện `App.tsx` thành bản đầy đủ 3 màn hình.

**Tech Stack:** kế thừa Plan 0/1/2 — không thêm thư viện mới.

## Ràng buộc chung (nhắc lại — áp dụng cho mọi task)

- Design tokens phải khớp `wanderlog.com-DESIGN.md`.
- Breakpoints: mobile `<640px`, tablet `640–1024px`, desktop `≥1024px`.
- `POST /api/itinerary` phải trả đúng `days` ngày × 4 khung giờ cố định (morning/noon/afternoon/evening).
- `OPENAI_MODEL` mặc định `gpt-4o-mini`.

## File Structure (phần Plan 3 tạo mới / sửa)

```
/client/src
  /api/itinerary.ts                          # mới
  /components/DayTabs.tsx, .module.css        # mới
  /components/TimeSlotCard.tsx, .module.css   # mới
  /screens/ItineraryScreen.tsx, .module.css   # mới
  /App.tsx                                    # sửa — hoàn thiện toàn bộ điều hướng 3 màn hình
/server/src
  /services/openai.ts                         # sửa — thêm getItinerary
  /routes/itinerary.ts                        # mới
  /app.ts                                     # sửa — nối thêm itineraryRouter
```

---

### Task 1: Bổ sung `getItinerary` vào service OpenAI

**Files:**
- Modify: `server/src/services/openai.ts` (file đã tạo ở Plan 1, Task 4 — chỉ đang có `getSuggestions`)

**Giao diện phụ thuộc:**
- Tiêu thụ: `ItineraryRequest`, `ItineraryDay` từ `../types` (Plan 0, Task 2).
- Kết quả: `getItinerary(req: ItineraryRequest): Promise<ItineraryDay[]>` — dùng ở `routes/itinerary.ts` (Task 2). Throw khi OpenAI lỗi, nội dung rỗng, hoặc số ngày trả về không khớp `req.days`.

- [ ] **Bước 1: Thêm import và hàm `getItinerary` vào cuối `server/src/services/openai.ts`**

Sửa dòng import đầu file để lấy thêm `ItineraryRequest`, `ItineraryDay`:

```ts
import type { Place, SuggestRequest, ItineraryRequest, ItineraryDay } from '../types';
```

Thêm vào cuối file (sau hàm `getSuggestions` đã có):

```ts
function buildItinerarySchema(days: number) {
  const slot = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      imageQuery: { type: 'string' },
    },
    required: ['name', 'description', 'imageQuery'],
    additionalProperties: false,
  };

  return {
    type: 'object',
    properties: {
      days: {
        type: 'array',
        minItems: days,
        maxItems: days,
        items: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            slots: {
              type: 'object',
              properties: { morning: slot, noon: slot, afternoon: slot, evening: slot },
              required: ['morning', 'noon', 'afternoon', 'evening'],
              additionalProperties: false,
            },
          },
          required: ['date', 'slots'],
          additionalProperties: false,
        },
      },
    },
    required: ['days'],
    additionalProperties: false,
  };
}

export async function getItinerary(req: ItineraryRequest): Promise<ItineraryDay[]> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Bạn là chuyên gia lên lịch trình du lịch. Sinh lịch trình chi tiết đúng số ngày yêu cầu, mỗi ngày đúng 4 khung giờ Sáng/Trưa/Chiều/Tối, mỗi khung giờ là một địa điểm cụ thể trong khu vực đã chọn.',
      },
      { role: 'user', content: JSON.stringify(req) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'itinerary', strict: true, schema: buildItinerarySchema(req.days) },
    },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('OpenAI trả về nội dung rỗng');

  const parsed = JSON.parse(content) as { days: ItineraryDay[] };
  if (parsed.days.length !== req.days) {
    throw new Error(`Kỳ vọng ${req.days} ngày, nhận được ${parsed.days.length}`);
  }
  return parsed.days;
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Commit**

```bash
git add server/src/services/openai.ts
git commit -m "feat(server): add getItinerary to OpenAI service"
```

---

### Task 2: Route `/api/itinerary` + nối vào Express app

**Files:**
- Create: `server/src/routes/itinerary.ts`
- Modify: `server/src/app.ts` (nối thêm `itineraryRouter`)

**Giao diện phụ thuộc:**
- Tiêu thụ: `getItinerary` (Task 1).
- Kết quả: `POST /api/itinerary` khớp hình dạng ở spec mục 4.4.

- [ ] **Bước 1: Viết `server/src/routes/itinerary.ts`**

```ts
import { Router } from 'express';
import { getItinerary } from '../services/openai';

const router = Router();

router.post('/itinerary', async (req, res) => {
  try {
    const days = await getItinerary(req.body);
    res.json({ days });
  } catch {
    res.status(502).json({ message: 'Không tạo được lịch trình lúc này, thử lại nhé' });
  }
});

export default router;
```

- [ ] **Bước 2: Sửa `server/src/app.ts` để nối thêm router**

```ts
import express from 'express';
import suggestRouter from './routes/suggest';
import imageRouter from './routes/image';
import weatherRouter from './routes/weather';
import itineraryRouter from './routes/itinerary';

const app = express();
app.use(express.json());
app.use('/api', suggestRouter);
app.use('/api', imageRouter);
app.use('/api', weatherRouter);
app.use('/api', itineraryRouter);

export default app;
```

- [ ] **Bước 3: Xác nhận biên dịch và khởi động được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

Chạy: `npm run dev -w server`, kiểm tra server khởi động không lỗi. Dừng bằng Ctrl+C.

- [ ] **Bước 4: Commit**

```bash
git add server/src/routes/itinerary.ts server/src/app.ts
git commit -m "feat(server): add itinerary route"
```

---

### Task 3: Client API wrapper — fetchItinerary

**Files:**
- Create: `client/src/api/itinerary.ts`

**Giao diện phụ thuộc:**
- Tiêu thụ: `apiPost` (Plan 0, Task 6); kiểu `ItineraryRequest`, `ItineraryResponse` (Plan 0, Task 3).
- Kết quả: `fetchItinerary(req: ItineraryRequest): Promise<ItineraryResponse>` — dùng ở `App.tsx` (Task 5).

- [ ] **Bước 1: Viết `client/src/api/itinerary.ts`**

```ts
import { apiPost } from './client';
import type { ItineraryRequest, ItineraryResponse } from '../types';

export function fetchItinerary(req: ItineraryRequest): Promise<ItineraryResponse> {
  return apiPost<ItineraryResponse>('/itinerary', req);
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Commit**

```bash
git add client/src/api/itinerary.ts
git commit -m "feat(client): add fetchItinerary wrapper"
```

---

### Task 4: DayTabs + TimeSlotCard + ItineraryScreen

**Files:**
- Create: `client/src/components/DayTabs.tsx`, `client/src/components/DayTabs.module.css`
- Create: `client/src/components/TimeSlotCard.tsx`, `client/src/components/TimeSlotCard.module.css`
- Create: `client/src/screens/ItineraryScreen.tsx`, `client/src/screens/ItineraryScreen.module.css`

**Giao diện phụ thuộc:**
- Tiêu thụ: `ItineraryDay`, `Slot`, `ImageResponse` từ `../types` (Plan 0, Task 3); `fetchImage` (Plan 1, Task 6); `Skeleton`, `ErrorBanner` (Plan 0, Task 4).
- Kết quả: `<DayTabs count, activeIndex, onSelect />`; `<TimeSlotCard label, slot />` (tự gọi `/api/image`, giống hệt cơ chế của `PlaceCard`); `<ItineraryScreen placeName, days, loading, error, onRetry, onBack />` — việc gọi `/api/itinerary` nằm ở `App.tsx` (Task 5), cùng kiến trúc với `SuggestionsScreen`.

- [ ] **Bước 1: Viết `client/src/components/DayTabs.module.css`**

```css
.tabs {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-lg);
}

.tab {
  flex-shrink: 0;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: var(--space-md) var(--space-lg);
  font-family: var(--font-family);
  font-size: 16px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.tabActive {
  color: var(--color-coral);
  border-bottom-color: var(--color-coral);
}
```

- [ ] **Bước 2: Viết `client/src/components/DayTabs.tsx`**

```tsx
import styles from './DayTabs.module.css';

interface DayTabsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function DayTabs({ count, activeIndex, onSelect }: DayTabsProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          className={`${styles.tab} ${i === activeIndex ? styles.tabActive : ''}`}
          onClick={() => onSelect(i)}
        >
          Ngày {i + 1}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Bước 3: Viết `client/src/components/TimeSlotCard.module.css`**

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-rounded);
  padding: var(--space-md);
  box-shadow: var(--shadow-raised);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-coral);
  text-transform: uppercase;
}

.imageWrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-subtle);
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 200ms ease;
}

.imageLoaded {
  opacity: 1;
}

.name {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}
```

- [ ] **Bước 4: Viết `client/src/components/TimeSlotCard.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Slot, ImageResponse } from '../types';
import { fetchImage } from '../api/image';
import { Skeleton } from './Skeleton';
import styles from './TimeSlotCard.module.css';

interface TimeSlotCardProps {
  label: string;
  slot: Slot;
}

export function TimeSlotCard({ label, slot }: TimeSlotCardProps) {
  const [image, setImage] = useState<ImageResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchImage(slot.imageQuery, '', slot.name).then(setImage);
  }, [slot.imageQuery, slot.name]);

  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <div className={styles.imageWrap}>
        {!image && <Skeleton />}
        {image && (
          <img
            src={image.url}
            alt={image.alt}
            className={`${styles.image} ${loaded ? styles.imageLoaded : ''}`}
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>
      <h4 className={styles.name}>{slot.name}</h4>
      <p className={styles.description}>{slot.description}</p>
    </div>
  );
}
```

- [ ] **Bước 5: Viết `client/src/screens/ItineraryScreen.module.css`**

```css
.screen {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-md);
}

.header {
  margin-bottom: var(--space-md);
}

.backButton {
  background: transparent;
  border: none;
  color: var(--color-charcoal);
  font-size: 16px;
  cursor: pointer;
  padding: 0 0 var(--space-sm);
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.slotGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (min-width: 640px) {
  .slotGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .slotGrid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

- [ ] **Bước 6: Viết `client/src/screens/ItineraryScreen.tsx`**

```tsx
import { useState } from 'react';
import type { ItineraryDay } from '../types';
import { DayTabs } from '../components/DayTabs';
import { TimeSlotCard } from '../components/TimeSlotCard';
import { Skeleton } from '../components/Skeleton';
import { ErrorBanner } from '../components/ErrorBanner';
import styles from './ItineraryScreen.module.css';

const SLOT_LABELS: { key: keyof ItineraryDay['slots']; label: string }[] = [
  { key: 'morning', label: 'Sáng' },
  { key: 'noon', label: 'Trưa' },
  { key: 'afternoon', label: 'Chiều' },
  { key: 'evening', label: 'Tối' },
];

interface ItineraryScreenProps {
  placeName: string;
  days: ItineraryDay[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

export function ItineraryScreen({
  placeName,
  days,
  loading,
  error,
  onRetry,
  onBack,
}: ItineraryScreenProps) {
  const [activeDay, setActiveDay] = useState(0);
  const dayCount = days?.length ?? (loading ? 1 : 0);
  const activeDayData = days?.[activeDay];

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Quay lại gợi ý
        </button>
        <h1 className={styles.title}>Lịch trình tại {placeName}</h1>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRetry} />}

      {!error && dayCount > 0 && <DayTabs count={dayCount} activeIndex={activeDay} onSelect={setActiveDay} />}

      {!error && (
        <div className={styles.slotGrid}>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={240} borderRadius="16px" />)}
          {!loading &&
            activeDayData &&
            SLOT_LABELS.map(({ key, label }) => (
              <TimeSlotCard key={key} label={label} slot={activeDayData.slots[key]} />
            ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Bước 7: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 8: Commit**

```bash
git add client/src/components/DayTabs.tsx client/src/components/DayTabs.module.css client/src/components/TimeSlotCard.tsx client/src/components/TimeSlotCard.module.css client/src/screens/ItineraryScreen.tsx client/src/screens/ItineraryScreen.module.css
git commit -m "feat(client): add DayTabs, TimeSlotCard, and ItineraryScreen"
```

---

### Task 5: Hoàn thiện `App.tsx` — nối toàn bộ điều hướng 3 màn hình

**Files:**
- Modify: `client/src/App.tsx` (mở rộng bản của Plan 2 — thêm state lịch trình + điều hướng sang `ItineraryScreen`)

**Giao diện phụ thuộc:**
- Tiêu thụ: `ItineraryScreen` (Task 4), `fetchItinerary` (Task 3), toàn bộ những gì Plan 1/2 đã nối.
- Kết quả: SPA 3 màn hình hoàn chỉnh đúng spec mục 3 — `App` là nơi giữ toàn bộ state xuyên suốt (`request`, `suggestions`, `selectedPlace`, `itineraryDays`), nên quay lại `SuggestionsScreen` từ `ItineraryScreen` dùng lại danh sách đã tải, quay lại `InputScreen` giữ nguyên giá trị đã nhập.

- [ ] **Bước 1: Viết lại toàn bộ `client/src/App.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type { SuggestRequest, ItineraryRequest, Place, ItineraryDay } from './types';
import { InputScreen, createDefaultSuggestRequest } from './screens/InputScreen';
import { SuggestionsScreen } from './screens/SuggestionsScreen';
import { ItineraryScreen } from './screens/ItineraryScreen';
import { DetailSheet } from './components/DetailSheet';
import { fetchSuggestions } from './api/suggest';
import { fetchItinerary } from './api/itinerary';

type Screen = 'input' | 'suggestions' | 'itinerary';

function computeTripDates(startDate: string, days: number): string[] {
  const [year, month, day] = startDate.split('-').map(Number);
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(year, month - 1, day + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dd}`);
  }
  return dates;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('input');
  const [request, setRequest] = useState<SuggestRequest>(createDefaultSuggestRequest());
  const tripDates = useMemo(
    () => computeTripDates(request.startDate, request.days),
    [request.startDate, request.days],
  );

  const [suggestions, setSuggestions] = useState<Place[] | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [itineraryPlaceName, setItineraryPlaceName] = useState('');
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[] | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [lastItineraryRequest, setLastItineraryRequest] = useState<ItineraryRequest | null>(null);

  async function loadSuggestions(req: SuggestRequest) {
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestions(null);
    try {
      const res = await fetchSuggestions(req);
      setSuggestions(res.places);
    } catch {
      setSuggestError('Không tạo được gợi ý lúc này, thử lại nhé');
    } finally {
      setSuggestLoading(false);
    }
  }

  function handleSubmitRequest(req: SuggestRequest) {
    setRequest(req);
    setScreen('suggestions');
    loadSuggestions(req);
  }

  async function loadItinerary(req: ItineraryRequest) {
    setItineraryLoading(true);
    setItineraryError(null);
    setItineraryDays(null);
    try {
      const res = await fetchItinerary(req);
      setItineraryDays(res.days);
    } catch {
      setItineraryError('Không tạo được lịch trình lúc này, thử lại nhé');
    } finally {
      setItineraryLoading(false);
    }
  }

  function handleCreateItinerary() {
    if (!selectedPlace) return;
    const itineraryRequest: ItineraryRequest = {
      placeName: selectedPlace.name,
      region: selectedPlace.region,
      country: selectedPlace.country,
      days: request.days,
      startDate: request.startDate,
      budget: request.budget,
      styles: request.styles,
      companion: request.companion,
    };
    setItineraryPlaceName(selectedPlace.name);
    setLastItineraryRequest(itineraryRequest);
    setSelectedPlace(null);
    setScreen('itinerary');
    loadItinerary(itineraryRequest);
  }

  return (
    <>
      {screen === 'input' && <InputScreen initialValue={request} onSubmit={handleSubmitRequest} />}

      {screen === 'suggestions' && (
        <SuggestionsScreen
          places={suggestions}
          loading={suggestLoading}
          error={suggestError}
          onRetry={() => loadSuggestions(request)}
          onSelectPlace={setSelectedPlace}
          onBack={() => setScreen('input')}
        />
      )}

      {screen === 'itinerary' && (
        <ItineraryScreen
          placeName={itineraryPlaceName}
          days={itineraryDays}
          loading={itineraryLoading}
          error={itineraryError}
          onRetry={() => lastItineraryRequest && loadItinerary(lastItineraryRequest)}
          onBack={() => setScreen('suggestions')}
        />
      )}

      {selectedPlace && screen === 'suggestions' && (
        <DetailSheet
          place={selectedPlace}
          region={request.region || selectedPlace.region}
          dates={tripDates}
          onClose={() => setSelectedPlace(null)}
          onCreateItinerary={handleCreateItinerary}
        />
      )}
    </>
  );
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Xác nhận cả stack build được**

Chạy: `npm run build`
Kỳ vọng: cả `server` và `client` build không lỗi.

- [ ] **Bước 4: Kiểm thử thủ công luồng đầy đủ**

Chạy: `npm run dev`, đi hết golden path: nhập yêu cầu → xem gợi ý → mở chi tiết → xem thời tiết → bấm "Tạo lịch trình cho [Tên]" → xác nhận sheet đóng, chuyển sang `ItineraryScreen` với tabs theo ngày, mỗi ngày đúng 4 khung giờ.
Kỳ vọng: không lỗi console, không ô ảnh trắng.

- [ ] **Bước 5: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(client): wire full 3-screen navigation with itinerary"
```

---

## Sau khi hoàn tất Plan 3

Chuyển sang **Plan 4 — Kiểm thử thủ công & hoàn thiện** (`docs/superpowers/plans/2026-08-11-travel-planner-04-kiem-thu.md`).

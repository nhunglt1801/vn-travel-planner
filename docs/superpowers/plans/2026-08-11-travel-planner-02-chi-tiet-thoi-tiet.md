# Kế hoạch triển khai — Plan 2: Chi tiết địa điểm & Thời tiết

> **Dành cho agent thực thi:** BẮT BUỘC dùng sub-skill superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực thi plan này theo từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Yêu cầu trước:** Đã hoàn tất **Plan 0 — Nền tảng dùng chung** và **Plan 1 — Nhập yêu cầu & Gợi ý địa điểm** (`docs/superpowers/plans/2026-08-11-travel-planner-00-nen-tang.md` và `...-01-nhap-yeu-cau-goi-y.md`). Plan này build tiếp trên `App.tsx`, `SuggestionsScreen`, chuỗi ảnh Wikipedia→Unsplash→mặc định đã có từ Plan 1.

**Vị trí trong chuỗi 5 plan:** Plan 0 → Plan 1 → **Plan 2 (plan này)** → Plan 3 (Lịch trình chi tiết) → Plan 4 (Kiểm thử).

**Mục tiêu:** Khi người dùng bấm vào một `PlaceCard` ở `SuggestionsScreen`, mở `DetailSheet` hiển thị ảnh lớn, tóm tắt thông tin, và dự báo thời tiết theo từng ngày trong khoảng ngày đi đã chọn — responsive: bottom sheet trên mobile, modal căn giữa trên tablet/desktop.

**Kiến trúc:** Backend thêm route `GET /api/weather` và service `openMeteo.ts` (geocode + forecast, không cần key). Frontend thêm `WeatherRow` + `DetailSheet`, và mở rộng `App.tsx` để quản lý `selectedPlace` + hiển thị sheet chồng lên `SuggestionsScreen`.

**Tech Stack:** kế thừa Plan 0/1 (React 19, Vite, TypeScript, CSS Modules, Express) + `fetch` gốc cho Open-Meteo.

## Ràng buộc chung (nhắc lại — áp dụng cho mọi task)

- Design tokens phải khớp `wanderlog.com-DESIGN.md` — accent coral `#F75940`, text charcoal `#212529`, font Source Sans 3, card bo góc `16px`, spacing base `8px`.
- Breakpoints: mobile `<640px`, tablet `640–1024px`, desktop `≥1024px`.
- Không dùng thư viện UI ngoài — chỉ CSS Modules + CSS variables.
- Với mỗi ngày ngoài phạm vi dự báo (~16 ngày tới), API trả `{ date, available: false }` — không phải lỗi.
- Test tự động vẫn giới hạn ở chuỗi fallback ảnh (đã làm ở Plan 1); phần thời tiết kiểm thử thủ công ở Plan 4.

## File Structure (phần Plan 2 tạo mới / sửa)

```
/client/src
  /api/weather.ts                        # mới
  /components/WeatherRow.tsx, .module.css        # mới
  /components/DetailSheet.tsx, .module.css       # mới
  /App.tsx                                # sửa — thêm selectedPlace + DetailSheet
/server/src
  /services/openMeteo.ts                  # mới
  /routes/weather.ts                      # mới
  /app.ts                                 # sửa — nối thêm weatherRouter
```

---

### Task 1: Service Open-Meteo (geocode + dự báo)

**Files:**
- Create: `server/src/services/openMeteo.ts`

**Giao diện phụ thuộc:**
- Kết quả: `geocode(place: string, region?: string): Promise<{ lat: number; lon: number; resolvedName: string } | null>`, `getForecast(lat: number, lon: number): Promise<Map<string, { date: string; tempMin: number; tempMax: number; condition: string; icon: string }>>` — dùng ở `routes/weather.ts` (Task 2). Cả hai chỉ throw khi lấy dự báo thất bại ngoài dự kiến (route bọc try/catch); `geocode` trả `null` khi không tìm thấy/lỗi mạng thay vì throw.

- [ ] **Bước 1: Viết `server/src/services/openMeteo.ts`**

```ts
interface GeocodeResult {
  lat: number;
  lon: number;
  resolvedName: string;
}

export async function geocode(place: string, region?: string): Promise<GeocodeResult | null> {
  const query = [place, region].filter(Boolean).join(', ');
  if (!query) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=vi`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const result = data?.results?.[0];
    if (!result) return null;
    return { lat: result.latitude, lon: result.longitude, resolvedName: result.name };
  } catch {
    return null;
  }
}

interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

const WEATHER_CODE_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Trời quang', icon: '☀️' },
  1: { condition: 'Ít mây', icon: '🌤️' },
  2: { condition: 'Có mây', icon: '⛅' },
  3: { condition: 'Nhiều mây', icon: '☁️' },
  45: { condition: 'Sương mù', icon: '🌫️' },
  48: { condition: 'Sương mù đóng băng', icon: '🌫️' },
  51: { condition: 'Mưa phùn nhẹ', icon: '🌦️' },
  53: { condition: 'Mưa phùn', icon: '🌦️' },
  55: { condition: 'Mưa phùn dày', icon: '🌧️' },
  61: { condition: 'Mưa nhẹ', icon: '🌧️' },
  63: { condition: 'Mưa vừa', icon: '🌧️' },
  65: { condition: 'Mưa to', icon: '⛈️' },
  71: { condition: 'Tuyết nhẹ', icon: '🌨️' },
  80: { condition: 'Mưa rào nhẹ', icon: '🌦️' },
  81: { condition: 'Mưa rào vừa', icon: '🌧️' },
  82: { condition: 'Mưa rào to', icon: '⛈️' },
  95: { condition: 'Dông', icon: '⛈️' },
};

function describeWeatherCode(code: number) {
  return WEATHER_CODE_MAP[code] ?? { condition: 'Không rõ', icon: '🌡️' };
}

export async function getForecast(lat: number, lon: number): Promise<Map<string, ForecastDay>> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=16`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo forecast request failed: ${res.status}`);
  const data = (await res.json()) as any;

  const map = new Map<string, ForecastDay>();
  const dates: string[] = data.daily.time;
  dates.forEach((date: string, i: number) => {
    const { condition, icon } = describeWeatherCode(data.daily.weathercode[i]);
    map.set(date, {
      date,
      tempMin: data.daily.temperature_2m_min[i],
      tempMax: data.daily.temperature_2m_max[i],
      condition,
      icon,
    });
  });
  return map;
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Commit**

```bash
git add server/src/services/openMeteo.ts
git commit -m "feat(server): add Open-Meteo geocoding and forecast service"
```

---

### Task 2: Route `/api/weather` + nối vào Express app

**Files:**
- Create: `server/src/routes/weather.ts`
- Modify: `server/src/app.ts` (nối thêm `weatherRouter`)

**Giao diện phụ thuộc:**
- Tiêu thụ: `geocode`/`getForecast` (Task 1), kiểu `WeatherDay` (Plan 0, Task 2).
- Kết quả: `GET /api/weather` khớp hình dạng ở spec mục 4.3.

- [ ] **Bước 1: Viết `server/src/routes/weather.ts`**

```ts
import { Router } from 'express';
import { geocode, getForecast } from '../services/openMeteo';
import type { WeatherDay } from '../types';

const router = Router();

router.get('/weather', async (req, res) => {
  const place = String(req.query.place ?? '');
  const region = req.query.region ? String(req.query.region) : undefined;
  const dates = String(req.query.dates ?? '').split(',').filter(Boolean);

  try {
    const location = await geocode(place, region);
    if (!location) {
      res.status(502).json({ message: 'Không tải được dự báo thời tiết lúc này' });
      return;
    }

    const forecast = await getForecast(location.lat, location.lon);
    const days: WeatherDay[] = dates.map((date) => {
      const day = forecast.get(date);
      if (!day) return { date, available: false };
      return {
        date,
        available: true,
        tempMin: day.tempMin,
        tempMax: day.tempMax,
        condition: day.condition,
        icon: day.icon,
      };
    });

    res.json({
      location: { lat: location.lat, lon: location.lon, resolvedName: location.resolvedName },
      days,
    });
  } catch {
    res.status(502).json({ message: 'Không tải được dự báo thời tiết lúc này' });
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

const app = express();
app.use(express.json());
app.use('/api', suggestRouter);
app.use('/api', imageRouter);
app.use('/api', weatherRouter);

export default app;
```

- [ ] **Bước 3: Xác nhận biên dịch và khởi động được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

Chạy: `npm run dev -w server`, gọi thử `curl "http://localhost:4000/api/weather?place=Da+Lat&region=Lam+Dong&dates=2026-08-15"`
Kỳ vọng: JSON hợp lệ với `location` và `days`. Dừng bằng Ctrl+C.

- [ ] **Bước 4: Commit**

```bash
git add server/src/routes/weather.ts server/src/app.ts
git commit -m "feat(server): add weather route"
```

---

### Task 3: Client API wrapper — fetchWeather

**Files:**
- Create: `client/src/api/weather.ts`

**Giao diện phụ thuộc:**
- Tiêu thụ: `apiGet` (Plan 0, Task 6); kiểu `WeatherResponse` (Plan 0, Task 3).
- Kết quả: `fetchWeather(place: string, region: string, dates: string[]): Promise<WeatherResponse>` — dùng ở `DetailSheet` (Task 4).

- [ ] **Bước 1: Viết `client/src/api/weather.ts`**

```ts
import { apiGet } from './client';
import type { WeatherResponse } from '../types';

export function fetchWeather(place: string, region: string, dates: string[]): Promise<WeatherResponse> {
  return apiGet<WeatherResponse>('/weather', { place, region, dates: dates.join(',') });
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Commit**

```bash
git add client/src/api/weather.ts
git commit -m "feat(client): add fetchWeather wrapper"
```

---

### Task 4: WeatherRow + DetailSheet

**Files:**
- Create: `client/src/components/WeatherRow.tsx`, `client/src/components/WeatherRow.module.css`
- Create: `client/src/components/DetailSheet.tsx`, `client/src/components/DetailSheet.module.css`

**Ghi chú kiến trúc:** Không có endpoint backend nào trả tóm tắt thông tin thật về địa điểm (spec mục 4 chỉ định nghĩa suggest/image/weather/itinerary), nên phần tóm tắt trong sheet dùng lại `Place.reason`/`region`/`country`/`tags` đã có từ `/api/suggest` — không cần thêm API mới.

**Giao diện phụ thuộc:**
- Tiêu thụ: `Place`, `WeatherDay`, `ImageResponse` từ `../types` (Plan 0, Task 3); `fetchImage` (Plan 1, Task 6); `fetchWeather` (Task 3); `Skeleton` (Plan 0, Task 4).
- Kết quả: `<WeatherRow days: WeatherDay[] | null, loading: boolean, error: boolean />`; `<DetailSheet place, region, dates, onClose, onCreateItinerary />` — `dates` là danh sách ngày ISO trong chuyến đi, do `App.tsx` (Task 5) tính từ `startDate`+`days`. `onCreateItinerary` được gọi khi bấm CTA; ở Plan 2 sẽ chỉ đóng sheet (điều hướng sang `ItineraryScreen` thật được nối ở Plan 3).

- [ ] **Bước 1: Viết `client/src/components/WeatherRow.module.css`**

```css
.row {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
}

.day {
  min-width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-sm);
  background: var(--color-gray-1);
  border-radius: var(--radius-subtle);
  flex-shrink: 0;
}

.date {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.icon {
  font-size: 24px;
}

.temp {
  font-size: 14px;
  font-weight: 700;
}

.unavailable {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.errorText {
  font-size: 14px;
  color: var(--color-danger);
}
```

- [ ] **Bước 2: Viết `client/src/components/WeatherRow.tsx`**

```tsx
import type { WeatherDay } from '../types';
import { Skeleton } from './Skeleton';
import styles from './WeatherRow.module.css';

interface WeatherRowProps {
  days: WeatherDay[] | null;
  loading: boolean;
  error: boolean;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function WeatherRow({ days, loading, error }: WeatherRowProps) {
  if (loading) {
    return (
      <div className={styles.row}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width={72} height={72} borderRadius="12px" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className={styles.errorText}>Không tải được dự báo thời tiết lúc này</p>;
  }

  if (!days || days.length === 0) return null;

  return (
    <div className={styles.row}>
      {days.map((day) =>
        day.available ? (
          <div key={day.date} className={styles.day}>
            <span className={styles.date}>{formatShortDate(day.date)}</span>
            <span className={styles.icon}>{day.icon}</span>
            <span className={styles.temp}>
              {Math.round(day.tempMin)}° - {Math.round(day.tempMax)}°
            </span>
          </div>
        ) : (
          <div key={day.date} className={styles.day}>
            <span className={styles.date}>{formatShortDate(day.date)}</span>
            <span className={styles.unavailable}>Chưa có dự báo</span>
          </div>
        ),
      )}
    </div>
  );
}
```

- [ ] **Bước 3: Viết `client/src/components/DetailSheet.module.css`**

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.sheet {
  background: var(--color-white);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px 16px 0 0;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  box-shadow: var(--shadow-floating);
}

.handle {
  width: 40px;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-circle);
  margin: 0 auto var(--space-sm);
}

.imageWrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
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
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.summary {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.tagRow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.tag {
  background: var(--color-gray-1);
  color: var(--color-charcoal);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-circle);
}

.sectionTitle {
  font-size: 16px;
  font-weight: 700;
  margin: var(--space-sm) 0 0;
}

.cta {
  height: 56px;
  border-radius: var(--radius-pill);
  background: var(--color-coral);
  color: var(--color-white);
  border: 1px solid var(--color-coral);
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: var(--space-sm);
}

.cta:disabled {
  background: var(--color-gray-2);
  border-color: var(--color-gray-2);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

@media (min-width: 640px) {
  .backdrop {
    align-items: center;
  }

  .sheet {
    max-width: 480px;
    border-radius: 16px;
    max-height: 80vh;
  }

  .handle {
    display: none;
  }
}
```

- [ ] **Bước 4: Viết `client/src/components/DetailSheet.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import type { Place, WeatherDay, ImageResponse } from '../types';
import { fetchImage } from '../api/image';
import { fetchWeather } from '../api/weather';
import { Skeleton } from './Skeleton';
import { WeatherRow } from './WeatherRow';
import styles from './DetailSheet.module.css';

interface DetailSheetProps {
  place: Place;
  region: string;
  dates: string[];
  onClose: () => void;
  onCreateItinerary: () => void;
}

export function DetailSheet({ place, region, dates, onClose, onCreateItinerary }: DetailSheetProps) {
  const [image, setImage] = useState<ImageResponse | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [weatherDays, setWeatherDays] = useState<WeatherDay[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    fetchImage(place.imageQuery, place.tags[0] ?? '', place.name).then(setImage);
  }, [place.imageQuery, place.tags, place.name]);

  useEffect(() => {
    setWeatherLoading(true);
    setWeatherError(false);
    fetchWeather(place.name, region, dates)
      .then((res) => setWeatherDays(res.days))
      .catch(() => setWeatherError(true))
      .finally(() => setWeatherLoading(false));
  }, [place.name, region, dates]);

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta);
  }

  function handleTouchEnd() {
    if (dragY > 80) onClose();
    setDragY(0);
    startYRef.current = null;
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        style={{ transform: `translateY(${dragY}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.handle} />

        <div className={styles.imageWrap}>
          {!image && <Skeleton />}
          {image && (
            <img
              src={image.url}
              alt={image.alt}
              className={`${styles.image} ${imageLoaded ? styles.imageLoaded : ''}`}
              onLoad={() => setImageLoaded(true)}
            />
          )}
        </div>

        <h2 className={styles.name}>{place.name}</h2>
        <p className={styles.summary}>
          {place.reason} — {place.region}, {place.country}.
        </p>
        <div className={styles.tagRow}>
          {place.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <h3 className={styles.sectionTitle}>Thời tiết</h3>
        <WeatherRow days={weatherDays} loading={weatherLoading} error={weatherError} />

        <button type="button" className={styles.cta} onClick={onCreateItinerary}>
          Tạo lịch trình cho {place.name}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Bước 5: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 6: Commit**

```bash
git add client/src/components/WeatherRow.tsx client/src/components/WeatherRow.module.css client/src/components/DetailSheet.tsx client/src/components/DetailSheet.module.css
git commit -m "feat(client): add WeatherRow and responsive DetailSheet"
```

---

### Task 5: Mở rộng `App.tsx` — hiển thị DetailSheet chồng lên SuggestionsScreen

**Files:**
- Modify: `client/src/App.tsx` (thêm state `selectedPlace` thật sự mở `DetailSheet`, thay cho dòng chữ tạm ở Plan 1)

**Ghi chú kiến trúc:** `onCreateItinerary` ở plan này chỉ đóng sheet lại (`setSelectedPlace(null)`) — đây là hành vi tạm thời, hoạt động đầy đủ nhưng chưa điều hướng sang màn lịch trình (màn đó chưa tồn tại). Plan 3 sẽ sửa đúng dòng này để gọi `/api/itinerary` và chuyển màn.

**Giao diện phụ thuộc:**
- Tiêu thụ: `DetailSheet` (Task 4).
- Kết quả: luồng đầy đủ Nhập yêu cầu → Gợi ý → mở chi tiết địa điểm kèm thời tiết chạy được từ đầu đến cuối.

- [ ] **Bước 1: Sửa `client/src/App.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type { SuggestRequest, Place } from './types';
import { InputScreen, createDefaultSuggestRequest } from './screens/InputScreen';
import { SuggestionsScreen } from './screens/SuggestionsScreen';
import { DetailSheet } from './components/DetailSheet';
import { fetchSuggestions } from './api/suggest';

type Screen = 'input' | 'suggestions';

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

      {selectedPlace && (
        <DetailSheet
          place={selectedPlace}
          region={request.region || selectedPlace.region}
          dates={tripDates}
          onClose={() => setSelectedPlace(null)}
          onCreateItinerary={() => setSelectedPlace(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Kiểm thử thủ công luồng Plan 2**

Chạy: `npm run dev`, mở `http://localhost:5173`, nhập yêu cầu → xem gợi ý → bấm vào 1 card.
Kỳ vọng: sheet trượt lên từ dưới (mobile) hoặc hiện giữa màn hình (tablet/desktop, thử bằng cách resize cửa sổ trình duyệt), có ảnh, tóm tắt, và hàng thời tiết (shimmer rồi hiện dữ liệu thật hoặc "Chưa có dự báo"). Bấm nút "Tạo lịch trình cho..." → sheet đóng lại (chưa điều hướng, đúng như kỳ vọng ở Plan 2).

- [ ] **Bước 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(client): wire DetailSheet with weather into App"
```

---

## Sau khi hoàn tất Plan 2

Chuyển sang **Plan 3 — Tính năng Lịch trình chi tiết** (`docs/superpowers/plans/2026-08-11-travel-planner-03-lich-trinh.md`).

# Kế hoạch triển khai — Plan 0: Nền tảng dùng chung

> **Dành cho agent thực thi:** BẮT BUỘC dùng sub-skill superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực thi plan này theo từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Đây là plan đầu tiên trong 5 plan** triển khai app "Lên Kế Hoạch Du Lịch" (theo `docs/superpowers/specs/2026-08-10-travel-planner-design.md`), được tách theo từng tính năng chính để làm tuần tự:

- **Plan 0 (plan này):** Nền tảng dùng chung — scaffold, kiểu dữ liệu, design tokens, component/App khung dùng chung.
- **Plan 1:** Tính năng Nhập yêu cầu & Gợi ý địa điểm.
- **Plan 2:** Tính năng Chi tiết địa điểm & Thời tiết.
- **Plan 3:** Tính năng Lịch trình chi tiết.
- **Plan 4:** Kiểm thử thủ công & hoàn thiện.

Các plan sau phụ thuộc vào plan trước — **phải hoàn tất Plan 0 trước khi bắt đầu Plan 1**, v.v.

**Mục tiêu:** Dựng bộ khung monorepo (client + server), kiểu dữ liệu dùng chung, design tokens, và các mảnh dùng chung ở nhiều màn hình (Skeleton, ErrorBanner, ErrorBoundary, lớp gọi API cơ bản) để 3 plan tính năng tiếp theo có nền để xây lên.

**Kiến trúc:** React 19 + Vite + TypeScript SPA (`/client`) nói chuyện với backend Express + TypeScript (`/server`) — Express là proxy duy nhất tới các dịch vụ ngoài. Không dùng database — toàn bộ state chỉ nằm trong React state của phiên làm việc. Vite dev server proxy `/api/*` sang Express để tránh CORS.

**Tech Stack:** React 19, Vite, TypeScript, CSS Modules, Node.js, Express, `openai` npm SDK (dùng ở Plan 1/3), `fetch` gốc cho Wikipedia/Unsplash/Open-Meteo (Plan 1/2), Vitest cho unit test backend (Plan 1).

## Ràng buộc chung (áp dụng cho toàn bộ 5 plan)

- Design tokens (màu, spacing, radius, shadow, typography) phải khớp `wanderlog.com-DESIGN.md` — accent coral `#F75940`, text charcoal `#212529`, font Source Sans 3, card bo góc `16px`, spacing base `8px`.
- Breakpoints: mobile `<640px`, tablet `640–1024px`, desktop `≥1024px`.
- Không dùng thư viện UI ngoài — chỉ CSS Modules + CSS variables.
- Không database, không đăng nhập, không router — 3 màn hình chuyển bằng state trong `App`.
- Thứ tự lấy ảnh (yêu cầu cứng, không bao giờ để ô ảnh trống): **Wikipedia → Unsplash → ảnh mặc định đóng gói sẵn**.
- `POST /api/suggest` phải trả đúng 6 địa điểm; `POST /api/itinerary` phải trả đúng `days` ngày × 4 khung giờ cố định (sáng/trưa/chiều/tối).
- `OPENAI_MODEL` mặc định `gpt-4o-mini`, đổi được qua biến môi trường mà không cần sửa code.
- Test tự động ở backend chỉ giới hạn ở chuỗi fallback ảnh (1-2 unit test, làm ở Plan 1); phần còn lại kiểm thử thủ công theo golden path của spec (mục 8, làm ở Plan 4).

## Cấu trúc thư mục (toàn bộ dự án — mỗi plan chỉ tạo phần thuộc về mình)

```
/package.json                          # root workspace scripts (dev: client+server song song)
/client
  /public/fallback-images/             # ảnh mặc định đóng gói sẵn (SVG) — tạo ở Plan 1
  /src
    /api/client.ts                     # apiGet/apiPost — Plan 0
    /api/suggest.ts, image.ts          # Plan 1
    /api/weather.ts                    # Plan 2
    /api/itinerary.ts                  # Plan 3
    /types/index.ts                    # Plan 0 — giống hệt kiểu bên server
    /styles/tokens.css                 # Plan 0 — design tokens dạng CSS variables
    /components/Skeleton.tsx           # Plan 0 — khối shimmer khi đang tải
    /components/ErrorBanner.tsx        # Plan 0 — banner báo lỗi + nút thử lại
    /components/PlaceCard.tsx          # Plan 1
    /components/DetailSheet.tsx        # Plan 2
    /components/WeatherRow.tsx         # Plan 2
    /components/DayTabs.tsx            # Plan 3
    /components/TimeSlotCard.tsx       # Plan 3
    /screens/InputScreen.tsx           # Plan 1
    /screens/SuggestionsScreen.tsx     # Plan 1
    /screens/ItineraryScreen.tsx       # Plan 3
    /ErrorBoundary.tsx                 # Plan 0
    /App.tsx                           # Plan 0 tạo khung, Plan 1/2/3 nối dần
    /main.tsx                          # Plan 0
  vite.config.ts                       # Plan 0 — proxy /api sang Express
/server
  /src
    /types/index.ts                    # Plan 0
    /services/openai.ts                # Plan 1 (getSuggestions), Plan 3 bổ sung getItinerary
    /services/wikipedia.ts             # Plan 1
    /services/unsplash.ts              # Plan 1
    /services/imageFallback.ts         # Plan 1 — kèm unit test
    /services/openMeteo.ts             # Plan 2
    /routes/suggest.ts, image.ts       # Plan 1
    /routes/weather.ts                 # Plan 2
    /routes/itinerary.ts               # Plan 3
    /app.ts                            # Plan 1 tạo, Plan 2/3 nối thêm router
    /index.ts                          # Plan 1
  .env.example                         # Plan 0
```

Mỗi service backend chỉ phụ trách đúng một dịch vụ ngoài; route chỉ điều phối service + định dạng response HTTP. Mỗi màn hình frontend giữ state cấp điều hướng; component thuần hiển thị, nhận dữ liệu qua props.

---

### Task 1: Scaffold monorepo (client + server + git + dev proxy)

**Files:**
- Create: `package.json` (root)
- Create: `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`
- Create: `server/package.json`, `server/tsconfig.json`
- Create: `server/.env.example`
- Create: `.gitignore`

**Giao diện phụ thuộc:**
- Kết quả: `npm run dev` ở root chạy song song client (Vite, cổng 5173) và server (Express, cổng 4000); request từ client tới `/api/*` được proxy sang `http://localhost:4000`. Có git repository để các plan sau có thể commit theo từng task.

- [ ] **Bước 1: Khởi tạo git repository**

Kiểm tra thư mục hiện tại chưa phải git repo (`git status` báo lỗi "not a git repository"), sau đó chạy:

```bash
git init
```

- [ ] **Bước 2: Tạo `package.json` gốc với workspaces + script dev**

```json
{
  "name": "travel-planner",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently -k -n client,server -c blue,green \"npm run dev -w client\" \"npm run dev -w server\"",
    "build": "npm run build -w server && npm run build -w client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Bước 3: Tạo `server/package.json`**

```json
{
  "name": "server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.19.2",
    "dotenv": "^16.4.5",
    "openai": "^4.56.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.9",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Bước 4: Tạo `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Bước 5: Tạo `server/.env.example`**

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
UNSPLASH_ACCESS_KEY=
PORT=4000
```

- [ ] **Bước 6: Scaffold `client` bằng Vite React-TS template**

Chạy: `npm create vite@latest client -- --template react-ts` (chỉ xác nhận ghi đè nếu `client/` đang trống).

- [ ] **Bước 7: Cấu hình `client/vite.config.ts` với proxy `/api`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
```

- [ ] **Bước 8: Kiểm tra script trong `client/package.json`**

Đảm bảo có `"dev": "vite --port 5173"` và `"build": "tsc -b && vite build"`.

- [ ] **Bước 9: Tạo `.gitignore` ở root**

```
node_modules/
dist/
.env
*.local
```

- [ ] **Bước 10: Cài dependencies**

Chạy: `npm install` (từ root, cài luôn cho cả 2 workspace).

- [ ] **Bước 11: Xác nhận stack dev khởi động được**

Chạy: `npm run dev`
Kỳ vọng: Vite in ra `Local: http://localhost:5173/`; server chưa in gì (chưa có `index.ts`, sẽ tạo ở Plan 1) — đây là kết quả chấp nhận được ở bước này, chỉ cần xác nhận `npm install` thành công và Vite khởi động không lỗi cấu hình. Dừng tiến trình (Ctrl+C).

- [ ] **Bước 12: Commit**

```bash
git add package.json client server .gitignore
git commit -m "chore: scaffold client/server workspaces with dev proxy"
```

- [ ] **Bước 13: Commit lockfile để đảm bảo cài đặt lại luôn ra đúng version**

```bash
git add package-lock.json
git commit -m "chore: commit npm lockfile for reproducible installs"
```

---

### Task 2: Kiểu dữ liệu dùng chung phía server

**Files:**
- Create: `server/src/types/index.ts`

**Giao diện phụ thuộc:**
- Kết quả: các kiểu `Budget`, `Companion`, `Place`, `SuggestRequest`, `SuggestResponse`, `ImageResponse`, `WeatherDay`, `WeatherResponse`, `ItineraryRequest`, `Slot`, `ItineraryDay`, `ItineraryResponse` — được dùng ở mọi service/route trong Plan 1-3.

- [ ] **Bước 1: Viết file kiểu dữ liệu**

```ts
export type Budget = 'budget' | 'mid' | 'premium';
export type Companion = 'solo' | 'couple' | 'family' | 'friends';

export interface SuggestRequest {
  prompt: string;
  region?: string;
  days: number;
  startDate: string;
  budget: Budget;
  styles: string[];
  companion: Companion;
}

export interface Place {
  id: string;
  name: string;
  region: string;
  country: string;
  reason: string;
  tags: string[];
  imageQuery: string;
}

export interface SuggestResponse {
  places: Place[];
}

export interface ImageResponse {
  url: string;
  alt: string;
  source: 'wikipedia' | 'unsplash' | 'fallback';
}

export interface WeatherDayAvailable {
  date: string;
  available: true;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

export interface WeatherDayUnavailable {
  date: string;
  available: false;
}

export type WeatherDay = WeatherDayAvailable | WeatherDayUnavailable;

export interface WeatherResponse {
  location: { lat: number; lon: number; resolvedName: string };
  days: WeatherDay[];
}

export interface ItineraryRequest {
  placeName: string;
  region: string;
  country: string;
  days: number;
  startDate: string;
  budget: Budget;
  styles: string[];
  companion: Companion;
}

export interface Slot {
  name: string;
  description: string;
  imageQuery: string;
}

export interface ItineraryDay {
  date: string;
  slots: {
    morning: Slot;
    noon: Slot;
    afternoon: Slot;
    evening: Slot;
  };
}

export interface ItineraryResponse {
  days: ItineraryDay[];
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Commit**

```bash
git add server/src/types/index.ts
git commit -m "feat(server): add shared domain types"
```

---

### Task 3: Kiểu dữ liệu phía client + design tokens

**Files:**
- Create: `client/src/types/index.ts` (giống hệt cấu trúc `server/src/types/index.ts`)
- Create: `client/src/styles/tokens.css`
- Modify: `client/src/main.tsx` (import tokens.css)

**Giao diện phụ thuộc:**
- Kết quả: các kiểu dữ liệu tên giống Task 2, import được từ `../types` trong `client/src`; CSS variables (`--color-coral`, `--space-md`, v.v.) dùng được toàn cục sau khi import `tokens.css`.

- [ ] **Bước 1: Viết `client/src/types/index.ts`**

Copy nguyên văn nội dung `server/src/types/index.ts` từ Task 2 sang file này (giống hệt interface, giống hệt tên — client và server phải đồng bộ tay vì không có package dùng chung).

- [ ] **Bước 2: Viết `client/src/styles/tokens.css`**

```css
:root {
  --color-coral: #F75940;
  --color-coral-hover: #E74A2F;
  --color-coral-active: #D93D1F;
  --color-charcoal: #212529;
  --color-deep-blue: #3F52E3;
  --color-rose: #E23E57;
  --color-success: #17B978;
  --color-info: #17A2B8;
  --color-danger: #FF253A;
  --color-warning: #EC9B3B;
  --color-white: #FFFFFF;
  --color-gray-1: #F3F4F5;
  --color-gray-2: #E9ECEF;
  --color-gray-3: #EEEEEE;
  --color-border: #DEE2E6;
  --color-text-secondary: #6C757D;
  --color-text-tertiary: #495057;

  --font-family: "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 20px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  --radius-subtle: 8px;
  --radius-rounded: 16px;
  --radius-pill: 20px;
  --radius-circle: 9999px;

  --shadow-raised: rgba(0, 0, 0, 0.1) 0px 2px 4px 0px;
  --shadow-lifted: rgba(0, 0, 0, 0.176) 0px 8px 16px 0px;
  --shadow-floating: rgba(0, 0, 0, 0.2) 0px 4px 24px 0px;

  --breakpoint-tablet: 640px;
  --breakpoint-desktop: 1024px;
}

* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  color: var(--color-charcoal);
  background: var(--color-white);
  margin: 0;
}

button {
  font-family: var(--font-family);
}
```

- [ ] **Bước 3: Import tokens trong `client/src/main.tsx`**

Thêm `import './styles/tokens.css';` làm import đầu tiên trong `client/src/main.tsx`, phía trên các import `App.css`/`index.css` mặc định của template (xoá reset `index.css` của Vite nếu xung đột với `* { box-sizing: border-box; }`).

- [ ] **Bước 4: Xác nhận build**

Chạy: `npm run build -w client`
Kỳ vọng: build thành công, không lỗi CSS/type.

- [ ] **Bước 5: Commit**

```bash
git add client/src/types/index.ts client/src/styles/tokens.css client/src/main.tsx
git commit -m "feat(client): add domain types and design tokens"
```

---

### Task 4: Component dùng chung Skeleton + ErrorBanner

**Files:**
- Create: `client/src/components/Skeleton.tsx`, `client/src/components/Skeleton.module.css`
- Create: `client/src/components/ErrorBanner.tsx`, `client/src/components/ErrorBanner.module.css`

**Giao diện phụ thuộc:**
- Kết quả: `<Skeleton width?, height?, borderRadius?, className? />` — mọi màn hình ở Plan 1-3 dùng trong lúc tải; `<ErrorBanner message, onRetry />` — dùng ở mọi nơi gọi `/api/suggest` hoặc `/api/itinerary` có thể lỗi (Plan 1, Plan 3).

- [ ] **Bước 1: Viết `client/src/components/Skeleton.module.css`**

```css
.skeleton {
  background: var(--color-gray-1);
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-rounded);
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
```

- [ ] **Bước 2: Viết `client/src/components/Skeleton.tsx`**

```tsx
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '100%', borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius }}
    />
  );
}
```

- [ ] **Bước 3: Viết `client/src/components/ErrorBanner.module.css`**

```css
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  background: #FFE8EC;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-subtle);
  padding: var(--space-md);
  color: var(--color-charcoal);
  font-size: 14px;
}

.retryButton {
  flex-shrink: 0;
  background: var(--color-coral);
  color: var(--color-white);
  border: 1px solid var(--color-coral);
  border-radius: var(--radius-pill);
  padding: 7px 16px;
  height: 32px;
  font-family: var(--font-family);
  font-size: 16px;
  cursor: pointer;
}

.retryButton:hover {
  background: var(--color-coral-hover);
}
```

- [ ] **Bước 4: Viết `client/src/components/ErrorBanner.tsx`**

```tsx
import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      <span>{message}</span>
      <button type="button" className={styles.retryButton} onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}
```

- [ ] **Bước 5: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 6: Commit**

```bash
git add client/src/components/Skeleton.tsx client/src/components/Skeleton.module.css client/src/components/ErrorBanner.tsx client/src/components/ErrorBanner.module.css
git commit -m "feat(client): add Skeleton and ErrorBanner shared components"
```

---

### Task 5: ErrorBoundary + khung App ban đầu

**Files:**
- Create: `client/src/ErrorBoundary.tsx`
- Modify: `client/src/App.tsx` (thay nội dung mặc định của Vite template bằng khung tối giản — Plan 1/2/3 sẽ nối dần logic điều hướng thật)
- Modify: `client/src/main.tsx`
- Delete: `client/src/App.css` (style mặc định của Vite template xung đột với design tokens; đồng thời gỡ import của nó)

**Giao diện phụ thuộc:**
- Kết quả: `<ErrorBoundary>` bọc toàn bộ cây component trong `main.tsx`, chặn mọi lỗi render không lường trước theo đúng spec mục 6 ("Error Boundary tổng bọc App chỉ để chặn crash-trắng-trang"). `App.tsx` export component mặc định mà Plan 1 sẽ mở rộng với state điều hướng thật.

- [ ] **Bước 1: Viết `client/src/ErrorBoundary.tsx`**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2>Đã có lỗi xảy ra</h2>
          <p>Vui lòng tải lại trang để tiếp tục.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: '#F75940',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 20,
              padding: '7px 16px',
              height: 32,
              cursor: 'pointer',
            }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Bước 2: Thay `client/src/App.tsx` bằng khung tối giản**

```tsx
export default function App() {
  return <div style={{ padding: 32 }}>Travel Planner</div>;
}
```

- [ ] **Bước 3: Viết lại `client/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import { ErrorBoundary } from './ErrorBoundary';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
```

- [ ] **Bước 4: Xoá `client/src/App.css` mặc định của Vite template**

Xoá file; xác nhận không còn nơi nào import nó (`App.tsx` ở Bước 2 không import file này).

- [ ] **Bước 5: Xác nhận build và hiển thị được**

Chạy: `npm run dev -w client`, mở `http://localhost:5173` trên trình duyệt.
Kỳ vọng: trang hiển thị chữ "Travel Planner", không có lỗi console.

- [ ] **Bước 6: Commit**

```bash
git add client/src/ErrorBoundary.tsx client/src/App.tsx client/src/main.tsx
git rm client/src/App.css
git commit -m "feat(client): add error boundary and minimal app shell"
```

---

### Task 6: Lớp gọi API cơ bản (apiGet/apiPost)

**Files:**
- Create: `client/src/api/client.ts`

**Giao diện phụ thuộc:**
- Kết quả: `apiGet<T>(path: string, params?: Record<string, string>): Promise<T>`, `apiPost<T>(path: string, body: unknown): Promise<T>` — cả hai đều `throw new Error` khi response không phải 2xx. Đây là hàm nền mà tất cả các wrapper API theo tính năng (`fetchSuggestions`, `fetchImage` ở Plan 1; `fetchWeather` ở Plan 2; `fetchItinerary` ở Plan 3) sẽ gọi lại.

- [ ] **Bước 1: Viết `client/src/api/client.ts`**

```ts
export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`/api${path}${query}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Commit**

```bash
git add client/src/api/client.ts
git commit -m "feat(client): add base apiGet/apiPost fetch helpers"
```

---

## Sau khi hoàn tất Plan 0

Chuyển sang **Plan 1 — Tính năng Nhập yêu cầu & Gợi ý địa điểm** (`docs/superpowers/plans/2026-08-11-travel-planner-01-nhap-yeu-cau-goi-y.md`).

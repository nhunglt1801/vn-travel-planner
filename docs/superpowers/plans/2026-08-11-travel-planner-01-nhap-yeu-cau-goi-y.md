# Kế hoạch triển khai — Plan 1: Nhập yêu cầu & Gợi ý địa điểm

> **Dành cho agent thực thi:** BẮT BUỘC dùng sub-skill superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực thi plan này theo từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Yêu cầu trước:** Đã hoàn tất **Plan 0 — Nền tảng dùng chung** (`docs/superpowers/plans/2026-08-11-travel-planner-00-nen-tang.md`). Plan này build tiếp trên monorepo, kiểu dữ liệu, design tokens, Skeleton/ErrorBanner, ErrorBoundary/App khung, và `apiGet`/`apiPost` đã có sẵn.

**Vị trí trong chuỗi 5 plan:** Plan 0 (Nền tảng) → **Plan 1 (plan này)** → Plan 2 (Chi tiết địa điểm & Thời tiết) → Plan 3 (Lịch trình chi tiết) → Plan 4 (Kiểm thử).

**Mục tiêu:** Hoàn thiện tính năng đầu tiên có thể chạy được độc lập từ đầu đến cuối: người dùng nhập mô tả chuyến đi mong muốn ở `InputScreen`, bấm CTA, và thấy lưới 6 `PlaceCard` gợi ý từ AI với ảnh thật (Wikipedia trước, Unsplash/ảnh mặc định dự phòng), có xử lý loading skeleton và lỗi.

**Kiến trúc:** Backend thêm 2 route (`POST /api/suggest`, `GET /api/image`) và service tương ứng (OpenAI cho gợi ý, chuỗi Wikipedia→Unsplash→ảnh mặc định cho ảnh). Frontend thêm `InputScreen` (form) và `SuggestionsScreen` + `PlaceCard` (hiển thị kết quả), nối bằng state trong `App.tsx`.

**Tech Stack:** kế thừa Plan 0 (React 19, Vite, TypeScript, CSS Modules, Express) + `openai` npm SDK, `fetch` gốc cho Wikipedia/Unsplash, Vitest.

## Ràng buộc chung (nhắc lại từ Plan 0 — áp dụng cho mọi task)

- Design tokens phải khớp `wanderlog.com-DESIGN.md` — accent coral `#F75940`, text charcoal `#212529`, font Source Sans 3, card bo góc `16px`, spacing base `8px`.
- Breakpoints: mobile `<640px`, tablet `640–1024px`, desktop `≥1024px`.
- Không dùng thư viện UI ngoài — chỉ CSS Modules + CSS variables. **Ngoại lệ (2026-08-12, theo yêu cầu trực tiếp của người dùng; đổi thư viện ngày 2026-08-12 sau khi phát hiện lỗi runtime):** ô "Ngày đi" trong `InputScreen` (Task 7) dùng `DayPicker` từ `react-day-picker` — xem chi tiết ở Task 7 bên dưới.
- Thứ tự lấy ảnh (yêu cầu cứng, không bao giờ để ô ảnh trống): **Wikipedia → Unsplash → ảnh mặc định đóng gói sẵn**.
- `POST /api/suggest` phải trả đúng 6 địa điểm.
- `OPENAI_MODEL` mặc định `gpt-4o-mini`, đổi được qua biến môi trường mà không cần sửa code.
- Test tự động ở backend chỉ giới hạn ở chuỗi fallback ảnh (làm ở Task 3 dưới đây); phần còn lại kiểm thử thủ công ở Plan 4.

## File Structure (phần Plan 1 tạo mới)

```
/client
  /public/fallback-images/fallback-1..4.svg   # ảnh mặc định dự phòng
  /src
    /api/suggest.ts, image.ts
    /components/PlaceCard.tsx, PlaceCard.module.css
    /screens/InputScreen.tsx, InputScreen.module.css
    /screens/SuggestionsScreen.tsx, SuggestionsScreen.module.css
/server
  /src
    /services/openai.ts             # getSuggestions
    /services/wikipedia.ts
    /services/unsplash.ts
    /services/imageFallback.ts      # + imageFallback.test.ts
    /routes/suggest.ts, image.ts
    /app.ts
    /index.ts
```

---

### Task 1: Service ảnh Wikipedia

**Files:**
- Create: `server/src/services/wikipedia.ts`

**Giao diện phụ thuộc:**
- Kết quả: `getWikipediaImage(query: string): Promise<{ url: string; alt: string } | null>` — dùng ở `services/imageFallback.ts` (Task 3) làm nguồn ảnh chính. Trả `null` khi thất bại (không tìm thấy trang liên quan, không có bản tiếng Việt tương ứng, không có ảnh, lỗi mạng) thay vì throw — nơi gọi tự quyết định fallback.

**Cập nhật 2026-08-12 #2 (sửa mâu thuẫn trong chính thiết kế ở bản đầu, phát hiện qua unit test khi triển khai):** `GENERIC_WORDS` bản đầu có cả `'a'`, `'an'` (mạo từ tiếng Anh) — nhưng `"an"` cũng chính là âm tiết đầu của tên địa danh thật "An Bàng", nên nếu giữ `'a'`/`'an'` trong danh sách, `stripGenericWords('an-bang-beach')` sẽ làm mất luôn từ khoá `"an"` cần giữ để nhận diện đúng địa danh. Đã bỏ `'a'`, `'an'` khỏi `GENERIC_WORDS` bên dưới (giữ `'the'`, `'of'`, `'in'`, `'at'`, `'and'` vì các từ này không trùng với âm tiết tên địa danh romanized tiếng Việt) — đã kiểm chứng lại cả 3 test case (`an-bang-beach` → `"an bang"`, `con-dao-beach` → `"con dao"`, `the-beach` → `""`) đều đúng sau khi sửa.

**Cập nhật 2026-08-12 (sửa lỗi ảnh sai chủ đề, phát hiện khi kiểm thử với API key thật):** Bản gốc bên dưới (tìm full-text trực tiếp trên `vi.wikipedia.org` bằng `imageQuery`) đã bị thay thế hoàn toàn — `imageQuery` do AI sinh ra là slug tiếng Anh (vd `"an-bang-beach"`), search full-text trực tiếp trên Wikipedia tiếng Việt bằng chuỗi này rất dễ khớp nhầm sang trang không liên quan (đã xác nhận thực tế: ra ảnh cờ Myanmar cho query `"an-bang-beach"`, lặp lại ổn định nhiều lần, không phải ngẫu nhiên). Xem chi tiết nguyên nhân và quy trình mới ở spec mục 4.2. Toàn bộ các bước gọi API dưới đây đã được kiểm chứng thủ công bằng `curl` thật trước khi đưa vào code — không phải suy đoán.

- [ ] **Bước 1: Viết `server/src/services/wikipedia.ts`**

```ts
interface WikiImageResult {
  url: string;
  alt: string;
}

const GENERIC_WORDS = new Set([
  'beach', 'beaches', 'island', 'islands', 'bay', 'national', 'park',
  'city', 'town', 'province', 'district', 'the', 'of', 'in', 'at', 'and',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function stripGenericWords(query: string): string {
  return tokenize(query)
    .filter((token) => !GENERIC_WORDS.has(token))
    .join(' ');
}

function isRelevantMatch(cleanedQuery: string, title: string): boolean {
  const queryTokens = tokenize(cleanedQuery);
  if (queryTokens.length === 0) return false;
  const titleTokens = new Set(tokenize(title));
  return queryTokens.every((token) => titleTokens.has(token));
}

async function findEnglishTitle(cleanedQuery: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanedQuery)}&format=json&limit=3`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const titles: string[] = data?.[1] ?? [];
  for (const title of titles) {
    if (isRelevantMatch(cleanedQuery, title)) return title;
  }
  return null;
}

async function getVietnameseTitle(englishTitle: string): Promise<string | null> {
  const propsUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(englishTitle)}&prop=pageprops&redirects=1&format=json`;
  const propsRes = await fetch(propsUrl);
  if (!propsRes.ok) return null;
  const propsData = (await propsRes.json()) as any;
  const pages = propsData?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0] as any;
  const qid = page?.pageprops?.wikibase_item;
  if (!qid) return null;

  const sitelinksUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks&sitefilter=viwiki&format=json`;
  const sitelinksRes = await fetch(sitelinksUrl);
  if (!sitelinksRes.ok) return null;
  const sitelinksData = (await sitelinksRes.json()) as any;
  const viTitle = sitelinksData?.entities?.[qid]?.sitelinks?.viwiki?.title;
  return viTitle ?? null;
}

export async function getWikipediaImage(query: string): Promise<WikiImageResult | null> {
  if (!query) return null;
  try {
    const cleanedQuery = stripGenericWords(query);
    if (!cleanedQuery) return null;

    const englishTitle = await findEnglishTitle(cleanedQuery);
    if (!englishTitle) return null;

    const vietnameseTitle = await getVietnameseTitle(englishTitle);
    if (!vietnameseTitle) return null;

    const summaryUrl = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(vietnameseTitle)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return null;
    const summary = (await summaryRes.json()) as any;
    const imageUrl = summary?.originalimage?.source || summary?.thumbnail?.source;
    if (!imageUrl) return null;

    return { url: imageUrl, alt: summary.title || query };
  } catch {
    return null;
  }
}
```

Giải thích từng bước (đã kiểm chứng bằng `curl` thật):
1. `stripGenericWords` loại các từ chung chung (beach, island...) khỏi query — vd `"an-bang-beach"` → `"an bang"`.
2. `findEnglishTitle` gọi `action=opensearch` trên `en.wikipedia.org` (chính xác hơn `action=query&list=search` cho việc tìm đúng tên trang theo tên riêng — đã kiểm chứng: full-text search cho `"con-dao-beach"` ra toàn kết quả sai, trong khi opensearch cho `"con dao"` ra đúng `"Con Dao"` ngay kết quả đầu).
3. `isRelevantMatch` chặn các kết quả không liên quan (vd `"Bang Saen Beach"` ở Thái Lan không chứa từ `"an"` nên bị loại) — duyệt qua 3 kết quả top, chọn kết quả đầu tiên qua được kiểm tra.
4. `getVietnameseTitle` lấy Wikidata QID của trang tiếng Anh (`prop=pageprops`, bắt buộc `redirects=1` vì nhiều trang là redirect, vd `"Con Dao"` → redirect sang `"Côn Đảo"`), rồi lấy tên bài viết tiếng Việt tương ứng qua `action=wbgetentities&props=sitelinks&sitefilter=viwiki` trên `www.wikidata.org`. **Không dùng `prop=langlinks`** (API cũ — đã kiểm chứng thực tế: phần lớn trang hiện đại không còn populate field này, Wikipedia đã chuyển hẳn sang Wikidata cho liên kết ngôn ngữ).
5. Ảnh + alt text cuối cùng luôn lấy từ đúng trang **Wikipedia tiếng Việt** qua REST API `page/summary` như bản gốc.

- [ ] **Bước 2: Viết unit test cho các hàm lọc thuần (không cần gọi mạng)**

`server/src/services/wikipedia.test.ts` — export thêm `stripGenericWords`, `isRelevantMatch`, `tokenize` từ `wikipedia.ts` (thêm `export` vào 3 hàm này) để test được:

```ts
import { describe, it, expect } from 'vitest';
import { stripGenericWords, isRelevantMatch } from './wikipedia';

describe('stripGenericWords', () => {
  it('loại các từ chung chung khỏi slug', () => {
    expect(stripGenericWords('an-bang-beach')).toBe('an bang');
    expect(stripGenericWords('con-dao-beach')).toBe('con dao');
  });

  it('trả về chuỗi rỗng nếu toàn từ chung chung', () => {
    expect(stripGenericWords('the-beach')).toBe('');
  });
});

describe('isRelevantMatch', () => {
  it('chấp nhận khi mọi từ khoá đều khớp', () => {
    expect(isRelevantMatch('con dao', 'Con Dao')).toBe(true);
  });

  it('từ chối khi thiếu từ khoá', () => {
    expect(isRelevantMatch('an bang', 'Bang Saen Beach')).toBe(false);
  });

  it('từ chối khi query rỗng', () => {
    expect(isRelevantMatch('', 'Con Dao')).toBe(false);
  });
});
```

Chạy: `npm run test -w server`
Kỳ vọng: các test trên pass (cùng chạy với 3 test cũ của `imageFallback.test.ts` — tổng số test tăng lên).

- [ ] **Bước 3: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 4: Commit**

```bash
git add server/src/services/wikipedia.ts server/src/services/wikipedia.test.ts
git commit -m "fix(server): search Wikipedia via English opensearch + relevance check + Wikidata sitelinks to Vietnamese, avoiding topic-mismatched images"
```

---

### Task 2: Service ảnh Unsplash (dự phòng)

**Files:**
- Create: `server/src/services/unsplash.ts`

**Giao diện phụ thuộc:**
- Kết quả: `searchUnsplashImage(query: string): Promise<{ url: string; alt: string } | null>` — dùng ở `services/imageFallback.ts` (Task 3) chỉ khi Wikipedia trả `null`. Trả `null` (không throw) khi thiếu key, request lỗi, hoặc không có kết quả.

- [ ] **Bước 1: Viết `server/src/services/unsplash.ts`**

```ts
interface UnsplashImageResult {
  url: string;
  alt: string;
}

export async function searchUnsplashImage(query: string): Promise<UnsplashImageResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query) return null;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const photo = data?.results?.[0];
    if (!photo) return null;
    return { url: photo.urls.regular, alt: photo.alt_description || query };
  } catch {
    return null;
  }
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Commit**

```bash
git add server/src/services/unsplash.ts
git commit -m "feat(server): add Unsplash fallback image service"
```

---

### Task 3: Chuỗi fallback ảnh (Wikipedia → Unsplash → mặc định) kèm unit test

**Files:**
- Create: `server/src/services/imageFallback.ts`
- Test: `server/src/services/imageFallback.test.ts`
- Create: `client/public/fallback-images/fallback-1.svg`, `fallback-2.svg`, `fallback-3.svg`, `fallback-4.svg`

**Giao diện phụ thuộc:**
- Tiêu thụ: `getWikipediaImage` (Task 1), `searchUnsplashImage` (Task 2), `ImageResponse` (Plan 0, Task 2).
- Kết quả: `resolveImage(queries: string[], placeName: string): Promise<ImageResponse>`, `pickFallbackImage(placeName: string): string`, `hashToIndex(input: string, mod: number): number` — dùng ở `routes/image.ts` (Task 5).

- [ ] **Bước 1: Tạo 4 ảnh mặc định đóng gói sẵn**

`client/public/fallback-images/fallback-1.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F75940"/>
      <stop offset="100%" stop-color="#E23E57"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <path d="M0 420 L200 260 L340 380 L520 200 L800 420 L800 600 L0 600 Z" fill="rgba(255,255,255,0.15)"/>
  <circle cx="640" cy="140" r="60" fill="rgba(255,255,255,0.25)"/>
  <text x="400" y="560" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#FFFFFF" opacity="0.85">Ảnh minh hoạ</text>
</svg>
```

`client/public/fallback-images/fallback-2.svg` (giữ nguyên hình dạng, gradient `#3F52E3` → `#17B978`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3F52E3"/>
      <stop offset="100%" stop-color="#17B978"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <path d="M0 420 L200 260 L340 380 L520 200 L800 420 L800 600 L0 600 Z" fill="rgba(255,255,255,0.15)"/>
  <circle cx="640" cy="140" r="60" fill="rgba(255,255,255,0.25)"/>
  <text x="400" y="560" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#FFFFFF" opacity="0.85">Ảnh minh hoạ</text>
</svg>
```

`client/public/fallback-images/fallback-3.svg` (gradient `#EC9B3B` → `#F75940`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EC9B3B"/>
      <stop offset="100%" stop-color="#F75940"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <path d="M0 420 L200 260 L340 380 L520 200 L800 420 L800 600 L0 600 Z" fill="rgba(255,255,255,0.15)"/>
  <circle cx="640" cy="140" r="60" fill="rgba(255,255,255,0.25)"/>
  <text x="400" y="560" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#FFFFFF" opacity="0.85">Ảnh minh hoạ</text>
</svg>
```

`client/public/fallback-images/fallback-4.svg` (gradient `#17B978` → `#3F52E3`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#17B978"/>
      <stop offset="100%" stop-color="#3F52E3"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <path d="M0 420 L200 260 L340 380 L520 200 L800 420 L800 600 L0 600 Z" fill="rgba(255,255,255,0.15)"/>
  <circle cx="640" cy="140" r="60" fill="rgba(255,255,255,0.25)"/>
  <text x="400" y="560" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#FFFFFF" opacity="0.85">Ảnh minh hoạ</text>
</svg>
```

- [ ] **Bước 2: Viết test thất bại trước**

`server/src/services/imageFallback.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWikipediaImage } from './wikipedia';
import { searchUnsplashImage } from './unsplash';
import { resolveImage } from './imageFallback';

vi.mock('./wikipedia', () => ({ getWikipediaImage: vi.fn() }));
vi.mock('./unsplash', () => ({ searchUnsplashImage: vi.fn() }));

const mockedWiki = vi.mocked(getWikipediaImage);
const mockedUnsplash = vi.mocked(searchUnsplashImage);

beforeEach(() => {
  mockedWiki.mockReset();
  mockedUnsplash.mockReset();
});

describe('resolveImage', () => {
  it('dùng ảnh Wikipedia khi có, không gọi Unsplash', async () => {
    mockedWiki.mockResolvedValue({ url: 'https://wiki/img.jpg', alt: 'Đà Lạt' });
    const result = await resolveImage(['Đà Lạt'], 'Đà Lạt');
    expect(result).toEqual({ url: 'https://wiki/img.jpg', alt: 'Đà Lạt', source: 'wikipedia' });
    expect(mockedUnsplash).not.toHaveBeenCalled();
  });

  it('chuyển sang Unsplash khi Wikipedia không có ảnh', async () => {
    mockedWiki.mockResolvedValue(null);
    mockedUnsplash.mockResolvedValue({ url: 'https://unsplash/img.jpg', alt: 'beach' });
    const result = await resolveImage(['Đà Lạt', 'mountain'], 'Đà Lạt');
    expect(result).toEqual({ url: 'https://unsplash/img.jpg', alt: 'beach', source: 'unsplash' });
  });

  it('trả về ảnh mặc định khi cả Wikipedia lẫn Unsplash đều lỗi', async () => {
    mockedWiki.mockResolvedValue(null);
    mockedUnsplash.mockResolvedValue(null);
    const result = await resolveImage(['Đà Lạt', 'mountain', 'travel destination'], 'Đà Lạt');
    expect(result.source).toBe('fallback');
    expect(result.url).toMatch(/^\/fallback-images\/fallback-\d\.svg$/);
  });
});
```

- [ ] **Bước 3: Chạy test để xác nhận thất bại**

Chạy: `npm run test -w server`
Kỳ vọng: FAIL — `Cannot find module './imageFallback'` (file chưa tồn tại).

- [ ] **Bước 4: Viết phần triển khai**

`server/src/services/imageFallback.ts`:
```ts
import { getWikipediaImage } from './wikipedia';
import { searchUnsplashImage } from './unsplash';
import type { ImageResponse } from '../types';

const FALLBACK_IMAGES = [
  '/fallback-images/fallback-1.svg',
  '/fallback-images/fallback-2.svg',
  '/fallback-images/fallback-3.svg',
  '/fallback-images/fallback-4.svg',
];

export function hashToIndex(input: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

let lastFallbackIndex = -1;

export function pickFallbackImage(placeName: string): string {
  let index = hashToIndex(placeName, FALLBACK_IMAGES.length);
  if (index === lastFallbackIndex) {
    index = (index + 1) % FALLBACK_IMAGES.length;
  }
  lastFallbackIndex = index;
  return FALLBACK_IMAGES[index];
}

export async function resolveImage(queries: string[], placeName: string): Promise<ImageResponse> {
  const wiki = await getWikipediaImage(queries[0] ?? '');
  if (wiki) {
    return { url: wiki.url, alt: wiki.alt, source: 'wikipedia' };
  }

  for (const query of queries) {
    const unsplash = await searchUnsplashImage(query);
    if (unsplash) {
      return { url: unsplash.url, alt: unsplash.alt, source: 'unsplash' };
    }
  }

  return { url: pickFallbackImage(placeName), alt: placeName, source: 'fallback' };
}
```

- [ ] **Bước 5: Chạy test để xác nhận đã pass**

Chạy: `npm run test -w server`
Kỳ vọng: PASS — 3 test xanh.

- [ ] **Bước 6: Commit**

```bash
git add server/src/services/imageFallback.ts server/src/services/imageFallback.test.ts client/public/fallback-images
git commit -m "feat(server): add Wikipedia-first image fallback chain with tests"
```

---

### Task 4: Service OpenAI — gợi ý địa điểm

**Files:**
- Create: `server/src/services/openai.ts`

**Ghi chú kiến trúc:** File này sẽ được Plan 3 mở rộng thêm hàm `getItinerary` — ở Plan 1 chỉ viết phần gợi ý địa điểm.

**Giao diện phụ thuộc:**
- Tiêu thụ: `SuggestRequest`, `Place` từ `../types` (Plan 0, Task 2).
- Kết quả: `getSuggestions(req: SuggestRequest): Promise<Place[]>` — dùng ở `routes/suggest.ts` (Task 5). Throw khi OpenAI lỗi, nội dung rỗng, hoặc số lượng phần tử không đúng 6 — route bắt lỗi và chuyển thành lỗi HTTP.

**Cập nhật 2026-08-12 (phát hiện ở buổi review tổng thể Plan 1 — lỗi Critical):** Bản gốc của brief này có `minItems: 6` và `maxItems: 6` trong `suggestSchema.properties.places` — hai keyword này **không được OpenAI Structured Outputs hỗ trợ ở chế độ `strict: true`** (xác nhận qua tài liệu chính thức và cộng đồng OpenAI), khiến request luôn bị từ chối với lỗi 400 ngay từ đầu, tức `/api/suggest` sẽ **luôn thất bại** dù server/API key đều đúng. Đã xoá cả hai keyword khỏi schema bên dưới. Việc đảm bảo đúng 6 phần tử vẫn được giữ nguyên qua: (1) chỉ dẫn trong system prompt ("đúng 6 địa điểm"), và (2) kiểm tra runtime `parsed.places.length !== 6` đã có sẵn trong `getSuggestions`. Áp dụng bài học này cho Task 3 của Plan 3 (`getItinerary`) — schema đó cũng không được dùng `minItems`/`maxItems` cho mảng `days`.

- [ ] **Bước 1: Viết `server/src/services/openai.ts`**

```ts
import OpenAI from 'openai';
import type { Place, SuggestRequest } from '../types';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const suggestSchema = {
  type: 'object',
  properties: {
    places: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          region: { type: 'string' },
          country: { type: 'string' },
          reason: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          imageQuery: { type: 'string' },
        },
        required: ['id', 'name', 'region', 'country', 'reason', 'tags', 'imageQuery'],
        additionalProperties: false,
      },
    },
  },
  required: ['places'],
  additionalProperties: false,
};

export async function getSuggestions(req: SuggestRequest): Promise<Place[]> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Bạn là chuyên gia tư vấn du lịch. Dựa trên mong muốn của người dùng, gợi ý đúng 6 địa điểm du lịch phù hợp, đa dạng, kèm lý do ngắn gọn vì sao hợp với họ.',
      },
      { role: 'user', content: JSON.stringify(req) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'suggestions', strict: true, schema: suggestSchema },
    },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('OpenAI trả về nội dung rỗng');

  const parsed = JSON.parse(content) as { places: Place[] };
  if (parsed.places.length !== 6) {
    throw new Error(`Kỳ vọng 6 địa điểm, nhận được ${parsed.places.length}`);
  }
  return parsed.places;
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi (cần đã cài `openai` từ Plan 0, Task 1).

- [ ] **Bước 3: Commit**

```bash
git add server/src/services/openai.ts
git commit -m "feat(server): add OpenAI service for place suggestions"
```

---

### Task 5: Route `/api/suggest` + `/api/image` và khởi tạo Express app

**Files:**
- Create: `server/src/routes/suggest.ts`, `server/src/routes/image.ts`
- Create: `server/src/app.ts`, `server/src/index.ts`

**Ghi chú kiến trúc:** `app.ts` được tạo ở đây với 2 router; Plan 2 và Plan 3 sẽ **modify** file này để nối thêm router `weather` và `itinerary`.

**Giao diện phụ thuộc:**
- Tiêu thụ: `getSuggestions` (Task 4), `resolveImage` (Task 3), kiểu dữ liệu từ Plan 0 Task 2.
- Kết quả: Express app chạy được với `POST /api/suggest`, `GET /api/image`, khớp hình dạng request/response ở mục 4.1/4.2 của spec.

- [ ] **Bước 1: Viết `server/src/routes/suggest.ts`**

```ts
import { Router } from 'express';
import { getSuggestions } from '../services/openai';

const router = Router();

router.post('/suggest', async (req, res) => {
  try {
    const places = await getSuggestions(req.body);
    res.json({ places });
  } catch {
    res.status(502).json({ message: 'Không tạo được gợi ý lúc này, thử lại nhé' });
  }
});

export default router;
```

- [ ] **Bước 2: Viết `server/src/routes/image.ts`**

```ts
import { Router } from 'express';
import { resolveImage } from '../services/imageFallback';

const router = Router();

router.get('/image', async (req, res) => {
  const query = String(req.query.query ?? '');
  const tag = String(req.query.tag ?? '');
  const place = String(req.query.place || query || 'travel');
  const queries = [query, tag, 'travel destination'].filter(Boolean);

  const result = await resolveImage(queries, place);
  res.json(result);
});

export default router;
```

- [ ] **Bước 3: Viết `server/src/app.ts`**

```ts
import express from 'express';
import suggestRouter from './routes/suggest';
import imageRouter from './routes/image';

const app = express();
app.use(express.json());
app.use('/api', suggestRouter);
app.use('/api', imageRouter);

export default app;
```

- [ ] **Bước 4: Viết `server/src/index.ts`**

```ts
import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
```

- [ ] **Bước 5: Xác nhận biên dịch và khởi động được**

Chạy: `npx tsc --noEmit -p server/tsconfig.json`
Kỳ vọng: không lỗi.

Chạy: `npm run dev -w server` (đã copy `server/.env.example` thành `server/.env` với `OPENAI_API_KEY` thật)
Kỳ vọng: in ra `Server đang chạy tại http://localhost:4000`. Dừng bằng Ctrl+C.

- [ ] **Bước 6: Commit**

```bash
git add server/src/routes/suggest.ts server/src/routes/image.ts server/src/app.ts server/src/index.ts
git commit -m "feat(server): wire up suggest and image routes"
```

---

### Task 6: Client API wrapper — fetchSuggestions + fetchImage

**Files:**
- Create: `client/src/api/suggest.ts`, `client/src/api/image.ts`

**Giao diện phụ thuộc:**
- Tiêu thụ: `apiGet`/`apiPost` (Plan 0, Task 6); kiểu dữ liệu từ `../types` (Plan 0, Task 3).
- Kết quả: `fetchSuggestions(req: SuggestRequest): Promise<SuggestResponse>`, `fetchImage(query: string, tag: string, place: string): Promise<ImageResponse>` — dùng ở `InputScreen`/`App` (Task 9) và `PlaceCard` (Task 8).

- [ ] **Bước 1: Viết `client/src/api/suggest.ts`**

```ts
import { apiPost } from './client';
import type { SuggestRequest, SuggestResponse } from '../types';

export function fetchSuggestions(req: SuggestRequest): Promise<SuggestResponse> {
  return apiPost<SuggestResponse>('/suggest', req);
}
```

- [ ] **Bước 2: Viết `client/src/api/image.ts`**

```ts
import { apiGet } from './client';
import type { ImageResponse } from '../types';

export function fetchImage(query: string, tag: string, place: string): Promise<ImageResponse> {
  return apiGet<ImageResponse>('/image', { query, tag, place });
}
```

- [ ] **Bước 3: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 4: Commit**

```bash
git add client/src/api/suggest.ts client/src/api/image.ts
git commit -m "feat(client): add fetchSuggestions and fetchImage wrappers"
```

---

### Task 7: InputScreen

**Files:**
- Create: `client/src/screens/InputScreen.tsx`, `client/src/screens/InputScreen.module.css`

**Giao diện phụ thuộc:**
- Tiêu thụ: `SuggestRequest`, `Budget`, `Companion` từ `../types` (Plan 0, Task 3).
- Kết quả: `createDefaultSuggestRequest(): SuggestRequest` (dùng ở `App.tsx` — Task 9 — để khởi tạo state), `tomorrowIso(): string`, và component `InputScreen({ initialValue: SuggestRequest, onSubmit: (request: SuggestRequest) => void })` — `onSubmit` được gọi với toàn bộ state form khi bấm CTA; `App.tsx` (Task 9) dùng nó để chuyển sang `SuggestionsScreen`.

**Cập nhật 2026-08-12 (theo phản hồi của người dùng sau khi xem preview):** Bỏ hành vi thu gọn/mở rộng của khối "Tinh chỉnh thêm" — toàn bộ các trường chọn nhanh hiển thị **luôn luôn**, ngay dưới ô prompt, không cần bấm gì thêm. Không còn state `advancedOpen`, không còn nút toggle, không còn CSS class `.advancedToggle`. Nhãn "Tinh chỉnh thêm" giữ lại dưới dạng tiêu đề tĩnh (không phải nút) để nhóm các trường lại cho dễ quét mắt.

**Cập nhật 2026-08-12 #2 (theo yêu cầu trực tiếp của người dùng):** Trường "Ngày đi" đổi từ `<input type="date">` mặc định của trình duyệt sang một ô bấm mở popover lịch chọn ngày, dùng component `DayPicker` của thư viện `react-day-picker`. Đây là **ngoại lệ duy nhất** cho ràng buộc "không dùng thư viện UI ngoài" của dự án, được người dùng xác nhận trực tiếp.

**Cập nhật 2026-08-12 #3 (đổi thư viện sau khi phát hiện lỗi runtime ở Task 9):** Bản đầu tiên dùng `react-rainbow-components`, nhưng khi nối vào `App.tsx` thật (Task 9) và render trong trình duyệt, app bị lỗi "Invalid hook call" — nguyên nhân: `react-rainbow-components@1.32.0` tự kéo theo một bản React 16.14.0 riêng (qua dependency thật `react-async-script-loader` yêu cầu React `^15.5.4`, không phải qua peerDependency), đụng độ với React 19 thật của app. Lỗi này không lộ ra ở bước `tsc --noEmit` (vì import đã bị `@ts-expect-error` che, biến thành kiểu `any`) cũng không lộ ra ở bản preview HTML tĩnh (vì đó là bản dựng lại thủ công bằng CSS/JS thuần, không phải component React thật) — chỉ lộ ra khi thực sự render trong React runtime, đúng vào lúc Task 9 nối `App.tsx`. Đã gỡ bỏ hoàn toàn `react-rainbow-components` và `styled-components`, thay bằng `react-day-picker` (`npm install react-day-picker --save`) — thư viện này không có dependency React nào khác ngoài peerDependency (`date-fns`/`@date-fns/tz` là các thư viện xử lý ngày thuần, không đụng tới React), nên không có rủi ro đụng độ tương tự; file khai báo `types` đúng chuẩn trong `exports` map nên không cần `@ts-expect-error`.

Chi tiết kỹ thuật (bản dùng `react-day-picker`):
- `DayPicker` (`mode="single"`) nhận `selected`/trả về qua `onSelect` dưới dạng đối tượng `Date` của JavaScript (hoặc `undefined`), không phải chuỗi ISO — cần 2 hàm chuyển đổi cục bộ `parseIsoDate(iso: string): Date` và `formatIsoDate(date: Date): string`, dựng bằng `getFullYear`/`getMonth`/`getDate` (**không** dùng `toISOString()`, để tránh lỗi lệch ngày do quy đổi múi giờ UTC — cùng nguyên tắc đã áp dụng cho `tomorrowIso()`).
- `react-day-picker` chỉ là lưới lịch (calendar grid) thuần, không có sẵn ô input + popover — cần tự dựng một wrapper nhỏ: nút bấm hiển thị ngày đã chọn (kèu icon lịch), bấm vào mở/đóng một `<div>` popover chứa `<DayPicker>`, đóng lại khi chọn xong hoặc bấm ra ngoài.
- Màu khi chọn ngày = màu accent coral `#F75940` của hệ thống, áp qua CSS variable `--rdp-accent-color` của thư viện (đặt trong CSS Module của `InputScreen`, không cần theme-provider/context nào của thư viện).
- Ngày trước ngày mai bị khoá bằng `disabled={{ before: parseIsoDate(tomorrowIso()) }}`.
- Cần import CSS mặc định của thư viện: `import 'react-day-picker/style.css';` ở đầu file `InputScreen.tsx`.
- Locale tiếng Việt: import `{ vi }` từ `'react-day-picker/locale'` nếu export này tồn tại trong bản đã cài (xác nhận sau khi `npm install`); nếu không có, bỏ qua prop `locale` (mặc định `en-US`) thay vì đoán mò.

- [ ] **Bước 1: Viết `client/src/screens/InputScreen.module.css`**

```css
.screen {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-md) var(--space-md) calc(var(--space-3xl) + var(--space-md));
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.title {
  font-size: 36px;
  font-weight: 700;
  margin: var(--space-lg) 0 0;
}

.promptInput {
  width: 100%;
  min-height: 120px;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-subtle);
  font-family: var(--font-family);
  font-size: 18px;
  resize: vertical;
}

.promptInput:focus {
  outline: none;
  border: 2px solid var(--color-deep-blue);
  box-shadow: 0 0 0 3px rgba(63, 82, 227, 0.1);
}

.advancedToggle {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: var(--color-charcoal);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  padding: var(--space-sm) 0;
}

.advancedPanel {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-gray-1);
  border-radius: var(--radius-rounded);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.fieldLabel {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.textInput {
  height: 56px;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-subtle);
  font-family: var(--font-family);
  font-size: 16px;
  background: var(--color-white);
}

.chipRow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.chip {
  height: 44px;
  padding: 0 var(--space-md);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-charcoal);
  font-family: var(--font-family);
  font-size: 14px;
  cursor: pointer;
}

.chipSelected {
  background: var(--color-coral);
  border-color: var(--color-coral);
  color: var(--color-white);
}

.cta {
  position: sticky;
  bottom: var(--space-md);
  height: 56px;
  border-radius: var(--radius-pill);
  background: var(--color-coral);
  color: var(--color-white);
  border: 1px solid var(--color-coral);
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.cta:hover {
  background: var(--color-coral-hover);
}

@media (min-width: 640px) {
  .screen {
    padding-top: var(--space-2xl);
  }
}
```

- [ ] **Bước 2: Viết `client/src/screens/InputScreen.tsx`**

```tsx
import { useState } from 'react';
import type { SuggestRequest, Budget, Companion } from '../types';
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

export function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
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
  const [advancedOpen, setAdvancedOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches,
  );

  function toggleStyle(value: string) {
    setForm((f) => ({
      ...f,
      styles: f.styles.includes(value) ? f.styles.filter((s) => s !== value) : [...f.styles, value],
    }));
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Bạn muốn đi đâu?</h1>
      <textarea
        className={styles.promptInput}
        placeholder="Mô tả chuyến đi mơ ước của bạn... (vd: Tôi muốn đi biển 3 ngày, ăn uống ngon, không quá đông đúc)"
        value={form.prompt}
        onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
        rows={4}
      />

      <button
        type="button"
        className={styles.advancedToggle}
        onClick={() => setAdvancedOpen((v) => !v)}
        aria-expanded={advancedOpen}
      >
        ⚙️ Tinh chỉnh thêm {advancedOpen ? '▲' : '▼'}
      </button>

      {advancedOpen && (
        <div className={styles.advancedPanel}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Khu vực</span>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Vd: Đà Lạt, miền Trung..."
              value={form.region ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
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

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Ngày đi</span>
            <input
              type="date"
              className={styles.textInput}
              value={form.startDate}
              min={tomorrowIso()}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </label>

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
      )}

      <button type="button" className={styles.cta} onClick={() => onSubmit(form)}>
        Gợi ý cho tôi ✨
      </button>
    </div>
  );
}
```

- [ ] **Bước 3: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 4: Commit**

```bash
git add client/src/screens/InputScreen.tsx client/src/screens/InputScreen.module.css
git commit -m "feat(client): add InputScreen with prompt hero and collapsible refinements"
```

---

### Task 8: PlaceCard + SuggestionsScreen

**Files:**
- Create: `client/src/components/PlaceCard.tsx`, `client/src/components/PlaceCard.module.css`
- Create: `client/src/screens/SuggestionsScreen.tsx`, `client/src/screens/SuggestionsScreen.module.css`

**Ghi chú kiến trúc:** Việc gọi `/api/suggest` nằm ở `App.tsx` (Task 9), không nằm ở đây — `SuggestionsScreen` chỉ hiển thị, nhận `places`/`loading`/`error` qua props, để khi quay lại màn này từ `ItineraryScreen` (Plan 3) không cần gọi lại API. Riêng mỗi `PlaceCard` tự gọi `/api/image` độc lập, đúng mô hình "AI trả text trước, ảnh tải song song sau" của spec (mục 5).

**Giao diện phụ thuộc:**
- Tiêu thụ: `Place`, `ImageResponse` từ `../types` (Plan 0, Task 3); `fetchImage` từ `../api/image` (Task 6); `Skeleton`, `ErrorBanner` (Plan 0, Task 4).
- Kết quả: `<PlaceCard place, onClick />`; `<SuggestionsScreen places, loading, error, onRetry, onSelectPlace, onBack />` — `onSelectPlace(place)` được gọi khi bấm vào card; ở Plan 1 tạm thời chưa mở modal chi tiết (việc đó thuộc Plan 2), Task 9 sẽ nối `onSelectPlace` với một xử lý tối giản.

**Cập nhật 2026-08-12 (theo yêu cầu trực tiếp của người dùng):** Khi `error` có giá trị, `SuggestionsScreen` không còn hiện `ErrorBanner` như một banner nội tuyến trong luồng nữa — component `ErrorBanner` (Plan 0, Task 4) được đổi thành **modal cảnh báo lỗi giữa màn hình** (overlay mờ phía sau, khối modal căn giữa chứa nội dung lỗi + nút "Thử lại" căn giữa bên dưới, responsive theo breakpoint để không vỡ giao diện). Xem chi tiết thiết kế ở spec mục 6. Vì `ErrorBanner` là component dùng chung, thay đổi này áp dụng luôn cho `ItineraryScreen` ở Plan 3 (khi được xây), không cần sửa riêng lần nữa.

**Cập nhật 2026-08-12 #2 (theo yêu cầu trực tiếp của người dùng, sau khi kiểm thử thủ công phát hiện modal không có lối thoát nếu API cứ lỗi):** `ErrorBanner` có thêm prop bắt buộc `onClose: () => void` và một nút **✕** ở góc trên bên phải modal — bấm vào gọi `onClose()`, đóng modal. `SuggestionsScreen` truyền `onClose={onBack}` (tái dùng đúng handler "← Chỉnh lại yêu cầu" đã có sẵn) để bấm ✕ vừa đóng modal vừa quay lại `InputScreen` luôn trong 1 thao tác — không cần thêm state mới ở `SuggestionsScreen` hay `App.tsx`.

- [ ] **Bước 1: Viết `client/src/components/PlaceCard.module.css`**

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-rounded);
  padding: var(--space-md);
  box-shadow: var(--shadow-raised);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.card:hover {
  box-shadow: var(--shadow-lifted);
  transform: scale(1.02);
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

.reason {
  font-size: 14px;
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
  height: 24px;
  display: flex;
  align-items: center;
}
```

- [ ] **Bước 2: Viết `client/src/components/PlaceCard.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Place, ImageResponse } from '../types';
import { fetchImage } from '../api/image';
import { Skeleton } from './Skeleton';
import styles from './PlaceCard.module.css';

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  const [image, setImage] = useState<ImageResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchImage(place.imageQuery, place.tags[0] ?? '', place.name).then((result) => {
      if (!cancelled) setImage(result);
    });
    return () => {
      cancelled = true;
    };
  }, [place.imageQuery, place.tags, place.name]);

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
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
      <h3 className={styles.name}>{place.name}</h3>
      <p className={styles.reason}>{place.reason}</p>
      <div className={styles.tagRow}>
        {place.tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Bước 3: Viết `client/src/screens/SuggestionsScreen.module.css`**

```css
.screen {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-md);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.backButton {
  background: transparent;
  border: none;
  color: var(--color-charcoal);
  font-size: 16px;
  cursor: pointer;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

- [ ] **Bước 4: Viết `client/src/screens/SuggestionsScreen.tsx`**

```tsx
import type { Place } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { Skeleton } from '../components/Skeleton';
import { ErrorBanner } from '../components/ErrorBanner';
import styles from './SuggestionsScreen.module.css';

interface SuggestionsScreenProps {
  places: Place[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectPlace: (place: Place) => void;
  onBack: () => void;
}

export function SuggestionsScreen({
  places,
  loading,
  error,
  onRetry,
  onSelectPlace,
  onBack,
}: SuggestionsScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Chỉnh lại yêu cầu
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRetry} />}

      {!error && (
        <div className={styles.grid}>
          {loading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={280} borderRadius="16px" />)}
          {!loading &&
            places?.map((place) => (
              <PlaceCard key={place.id} place={place} onClick={() => onSelectPlace(place)} />
            ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Bước 5: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 6: Commit**

```bash
git add client/src/components/PlaceCard.tsx client/src/components/PlaceCard.module.css client/src/screens/SuggestionsScreen.tsx client/src/screens/SuggestionsScreen.module.css
git commit -m "feat(client): add PlaceCard and SuggestionsScreen with per-card image loading"
```

---

### Task 9: Nối `App.tsx` cho luồng Nhập yêu cầu → Gợi ý

**Files:**
- Modify: `client/src/App.tsx` (thay khung tối giản của Plan 0 bằng logic điều hướng thật cho 2 màn hình đầu tiên)

**Ghi chú kiến trúc:** Đây là bản `App.tsx` **tạm thời** của Plan 1 — chỉ xử lý `input` ↔ `suggestions`. Plan 2 sẽ mở rộng thêm `selectedPlace`/`DetailSheet`, Plan 3 sẽ mở rộng thêm màn `itinerary`. Mỗi lần mở rộng đều là sửa trên file này, không viết lại từ đầu.

**Giao diện phụ thuộc:**
- Tiêu thụ: `InputScreen`/`createDefaultSuggestRequest` (Task 7), `SuggestionsScreen` (Task 8), `fetchSuggestions` (Task 6), kiểu dữ liệu (Plan 0, Task 3).
- Kết quả: SPA 2 màn hình chạy được độc lập — nhập yêu cầu → xem lưới gợi ý có ảnh, skeleton, và banner lỗi/thử lại.

- [ ] **Bước 1: Viết lại `client/src/App.tsx`**

```tsx
import { useState } from 'react';
import type { SuggestRequest, Place } from './types';
import { InputScreen, createDefaultSuggestRequest } from './screens/InputScreen';
import { SuggestionsScreen } from './screens/SuggestionsScreen';
import { fetchSuggestions } from './api/suggest';

type Screen = 'input' | 'suggestions';

export default function App() {
  const [screen, setScreen] = useState<Screen>('input');
  const [request, setRequest] = useState<SuggestRequest>(createDefaultSuggestRequest());

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
        <p style={{ position: 'fixed', bottom: 16, left: 16, right: 16, textAlign: 'center' }}>
          Đã chọn: {selectedPlace.name} — modal chi tiết sẽ được thêm ở Plan 2.
        </p>
      )}
    </>
  );
}
```

- [ ] **Bước 2: Xác nhận biên dịch được**

Chạy: `npx tsc --noEmit -p client/tsconfig.json`
Kỳ vọng: không lỗi.

- [ ] **Bước 3: Kiểm thử thủ công luồng Plan 1**

Chạy: `npm run dev` (với `server/.env` có `OPENAI_API_KEY` thật), mở `http://localhost:5173`.
Nhập một mô tả chuyến đi bất kỳ → bấm "Gợi ý cho tôi ✨" → xác nhận 6 khung skeleton hiện ra, sau đó điền text thật, ảnh fade-in dần → bấm vào 1 card, xác nhận dòng "Đã chọn: ..." hiện ở cuối trang.
Kỳ vọng: không có lỗi console, không có ô ảnh trắng.

- [ ] **Bước 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(client): wire InputScreen and SuggestionsScreen navigation"
```

---

## Sau khi hoàn tất Plan 1

Chuyển sang **Plan 2 — Tính năng Chi tiết địa điểm & Thời tiết** (`docs/superpowers/plans/2026-08-11-travel-planner-02-chi-tiet-thoi-tiet.md`).

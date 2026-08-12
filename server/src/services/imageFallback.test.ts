import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWikipediaImage } from './wikipedia.js';
import { searchUnsplashImage } from './unsplash.js';
import { resolveImage } from './imageFallback.js';

vi.mock('./wikipedia.js', () => ({ getWikipediaImage: vi.fn() }));
vi.mock('./unsplash.js', () => ({ searchUnsplashImage: vi.fn() }));

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

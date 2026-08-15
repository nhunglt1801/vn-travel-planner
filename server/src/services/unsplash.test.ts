import { describe, it, expect } from 'vitest';
import { buildUnsplashQuery } from './unsplash.js';

describe('buildUnsplashQuery', () => {
  it('thêm "vietnam" vào query để tránh nhầm sang nước khác (vd "thai" bị hiểu là Thái Lan)', () => {
    expect(buildUnsplashQuery('thai-van-lung-street')).toBe('thai-van-lung-street vietnam');
  });

  it('không thêm trùng lặp nếu query đã có sẵn "vietnam"', () => {
    expect(buildUnsplashQuery('ha-long-bay-vietnam')).toBe('ha-long-bay-vietnam');
    expect(buildUnsplashQuery('Ha Long Bay Vietnam')).toBe('Ha Long Bay Vietnam');
  });
});

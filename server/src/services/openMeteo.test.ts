import { describe, it, expect } from 'vitest';
import { normalizeRegionForGeocode } from './openMeteo.js';

describe('normalizeRegionForGeocode', () => {
  it('bỏ tiền tố "TP." vì Open-Meteo không nhận diện được (chỉ nhận tên đầy đủ hoặc không tiền tố)', () => {
    expect(normalizeRegionForGeocode('TP. Hồ Chí Minh')).toBe('Hồ Chí Minh');
  });

  it('bỏ tiền tố "Tp" không dấu chấm', () => {
    expect(normalizeRegionForGeocode('Tp Hà Nội')).toBe('Hà Nội');
  });

  it('giữ nguyên khi không có tiền tố', () => {
    expect(normalizeRegionForGeocode('Kiên Giang')).toBe('Kiên Giang');
  });
});

import { describe, it, expect } from 'vitest';
import { normalizeRegionForGeocode, stripDiacritics, stripGeoDescriptorPrefix } from './openMeteo.js';

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

describe('stripDiacritics', () => {
  it('bỏ dấu tiếng Việt, giữ nguyên độ dài chuỗi', () => {
    expect(stripDiacritics('Vịnh Hạ Long')).toBe('vinh ha long');
    expect(stripDiacritics('Quảng Ninh')).toBe('quang ninh');
    expect(stripDiacritics('Đà Lạt')).toBe('da lat');
  });
});

describe('stripGeoDescriptorPrefix', () => {
  it('bỏ tiền tố mô tả địa lý chung chung (Vịnh, Núi, Hồ...) vì Open-Meteo geocoding không nhận diện được các cụm mô tả này, chỉ nhận tên định cư gốc', () => {
    expect(stripGeoDescriptorPrefix('Vịnh Hạ Long')).toBe('Hạ Long');
    expect(stripGeoDescriptorPrefix('Bãi biển Mỹ Khê')).toBe('Mỹ Khê');
    expect(stripGeoDescriptorPrefix('Núi Bà Đen')).toBe('Bà Đen');
  });

  it('giữ nguyên khi không có tiền tố mô tả, kể cả khi từ mô tả nằm trong tên riêng ghép (vd "Côn Đảo")', () => {
    expect(stripGeoDescriptorPrefix('Côn Đảo')).toBe('Côn Đảo');
    expect(stripGeoDescriptorPrefix('Phú Quốc')).toBe('Phú Quốc');
  });
});

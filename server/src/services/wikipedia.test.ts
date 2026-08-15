import { describe, it, expect } from 'vitest';
import { stripGenericWords, isRelevantMatch, isExactMatch, tokenize } from './wikipedia.js';

describe('tokenize', () => {
  it('bỏ dấu tiếng Việt thay vì coi dấu là ký tự phân tách', () => {
    expect(tokenize('Huế')).toEqual(['hue']);
    expect(tokenize('Đà Lạt')).toEqual(['da', 'lat']);
    expect(tokenize('vịnh Hạ Long')).toEqual(['vinh', 'ha', 'long']);
  });

  it('vẫn tách đúng slug tiếng Anh gạch ngang như trước', () => {
    expect(tokenize('phu-quoc-beach')).toEqual(['phu', 'quoc', 'beach']);
  });
});

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

describe('isExactMatch', () => {
  it('chấp nhận khi tiêu đề khớp chính xác từng từ khoá', () => {
    expect(isExactMatch('phu quoc', 'Phu Quoc')).toBe(true);
  });

  it('từ chối khi tiêu đề có thêm từ khác (vd tên sân bay trùng địa danh)', () => {
    expect(isExactMatch('phu quoc', 'Phu Quoc International Airport')).toBe(false);
    expect(isExactMatch('con dao', 'Con Dao Airport')).toBe(false);
  });

  it('từ chối khi query rỗng', () => {
    expect(isExactMatch('', 'Phu Quoc')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { stripGenericWords, isRelevantMatch } from './wikipedia.js';

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

import { describe, it, expect } from 'vitest';
import { cleanPlaceName } from './openai.js';

describe('cleanPlaceName', () => {
  it('bỏ cụm tiền tố "Khu phố ẩm thực " để giữ lại địa danh gốc', () => {
    expect(cleanPlaceName('Khu phố ẩm thực Quận 7')).toBe('Quận 7');
    expect(cleanPlaceName('Khu phố ẩm thực Hào Sĩ Phường')).toBe('Hào Sĩ Phường');
  });

  it('bỏ cụm tiền tố "Phố ẩm thực " / "Góc Phố Ẩm Thực "', () => {
    expect(cleanPlaceName('Phố ẩm thực Vĩnh Khánh')).toBe('Vĩnh Khánh');
    expect(cleanPlaceName('Góc Phố Ẩm Thực Vĩnh Khánh')).toBe('Vĩnh Khánh');
  });

  it('bỏ "Khu " thừa khi đứng trước "phố" + tên thật, giữ lại "Phố ..."', () => {
    expect(cleanPlaceName('Khu phố Tây Bùi Viện')).toBe('Phố Tây Bùi Viện');
  });

  it('bỏ hậu tố tiếng Anh kiểu "Market Food Court"', () => {
    expect(cleanPlaceName('Bến Thành Market Food Court')).toBe('Bến Thành');
  });

  it('giữ nguyên tên địa danh thật hợp lệ, không đụng vào', () => {
    expect(cleanPlaceName('Chợ Bến Thành')).toBe('Chợ Bến Thành');
    expect(cleanPlaceName('Phố đi bộ Nguyễn Huệ')).toBe('Phố đi bộ Nguyễn Huệ');
    expect(cleanPlaceName('Phố Tây Bùi Viện')).toBe('Phố Tây Bùi Viện');
    expect(cleanPlaceName('Đường Vĩnh Khánh')).toBe('Đường Vĩnh Khánh');
    expect(cleanPlaceName('Đà Lạt')).toBe('Đà Lạt');
  });
});

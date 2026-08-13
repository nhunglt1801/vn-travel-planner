export const VIETNAM_PROVINCES: string[] = [
  'Hà Nội', 'Hải Phòng', 'Huế', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Cần Thơ',
  'Tuyên Quang', 'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên',
  'Ninh Bình', 'Quảng Ninh', 'Cao Bằng', 'Lạng Sơn', 'Lai Châu', 'Điện Biên',
  'Sơn La', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Trị', 'Quảng Ngãi',
  'Gia Lai', 'Khánh Hòa', 'Lâm Đồng', 'Đắk Lắk', 'Đồng Nai', 'Tây Ninh',
  'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang',
];

export interface HotDestination {
  icon: string;
  label: string;
  province: string;
}

export const HOT_DESTINATIONS: HotDestination[] = [
  { icon: '🏛️', label: 'Hà Nội', province: 'Hà Nội' },
  { icon: '🏯', label: 'Đà Nẵng', province: 'Đà Nẵng' },
  { icon: '🌊', label: 'Khánh Hòa (Nha Trang)', province: 'Khánh Hòa' },
  { icon: '🏔️', label: 'Lâm Đồng (Đà Lạt)', province: 'Lâm Đồng' },
  { icon: '⛵', label: 'Quảng Ninh (Vịnh Hạ Long)', province: 'Quảng Ninh' },
  { icon: '🏙️', label: 'TP. Hồ Chí Minh', province: 'TP. Hồ Chí Minh' },
];

import { useState } from 'react';
import type { SuggestRequest, Budget, Companion } from '../types';
// @ts-expect-error - types are at index.d.ts but not properly exported in package.json
import { DatePicker, RainbowThemeContainer } from 'react-rainbow-components';
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

const datePickerTheme = {
  rainbow: {
    palette: {
      brand: '#F75940',
    },
  },
};

export function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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

      <h2 className={styles.advancedLabel}>Tinh chỉnh thêm</h2>

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

          <div className={styles.field}>
            <RainbowThemeContainer theme={datePickerTheme}>
              <DatePicker
                id="startDate"
                label="Ngày đi"
                value={parseIsoDate(form.startDate)}
                minDate={parseIsoDate(tomorrowIso())}
                onChange={(date: Date) => setForm((f) => ({ ...f, startDate: formatIsoDate(date) }))}
                formatStyle="medium"
                locale="vi"
              />
            </RainbowThemeContainer>
          </div>

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

      <button type="button" className={styles.cta} onClick={() => onSubmit(form)}>
        Gợi ý cho tôi ✨
      </button>
    </div>
  );
}

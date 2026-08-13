import { useEffect, useRef, useState } from 'react';
import { VIETNAM_PROVINCES } from '../data/provinces';
import { stripDiacritics } from '../utils/text';
import styles from './ProvinceCombobox.module.css';

interface ProvinceComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProvinceCombobox({ value, onChange }: ProvinceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setQuery(value);
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, value]);

  const filtered = VIETNAM_PROVINCES.filter((province) =>
    stripDiacritics(province).includes(stripDiacritics(query)),
  );

  function selectProvince(province: string) {
    onChange(province);
    setQuery(province);
    setOpen(false);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="text"
        className={styles.input}
        placeholder="Vd: Hà Nội, Đà Nẵng..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div className={styles.dropdown}>
          {filtered.length === 0 && (
            <div className={styles.empty}>Không tìm thấy tỉnh/thành phù hợp</div>
          )}
          {filtered.map((province) => (
            <button
              key={province}
              type="button"
              className={styles.option}
              onClick={() => selectProvince(province)}
            >
              {province}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

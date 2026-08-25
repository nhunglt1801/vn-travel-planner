import styles from './DayTabs.module.css';

interface DayTabsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function DayTabs({ count, activeIndex, onSelect }: DayTabsProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          className={`${styles.tab} ${i === activeIndex ? styles.tabActive : ''}`}
          onClick={() => onSelect(i)}
        >
          Ngày {i + 1}
        </button>
      ))}
    </div>
  );
}

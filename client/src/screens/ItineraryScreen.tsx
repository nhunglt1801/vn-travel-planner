import { useState } from 'react';
import type { ItineraryDay } from '../types';
import { DayTabs } from '../components/DayTabs';
import { TimeSlotCard } from '../components/TimeSlotCard';
import { Skeleton } from '../components/Skeleton';
import { ErrorBanner } from '../components/ErrorBanner';
import styles from './ItineraryScreen.module.css';

const SLOT_LABELS: { key: keyof ItineraryDay['slots']; label: string }[] = [
  { key: 'morning', label: 'Sáng' },
  { key: 'noon', label: 'Trưa' },
  { key: 'afternoon', label: 'Chiều' },
  { key: 'evening', label: 'Tối' },
];

interface ItineraryScreenProps {
  placeName: string;
  days: ItineraryDay[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

export function ItineraryScreen({
  placeName,
  days,
  loading,
  error,
  onRetry,
  onBack,
}: ItineraryScreenProps) {
  const [activeDay, setActiveDay] = useState(0);
  const dayCount = days?.length ?? (loading ? 1 : 0);
  const activeDayData = days?.[activeDay];

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Quay lại gợi ý
        </button>
        <h1 className={styles.title}>Lịch trình tại {placeName}</h1>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRetry} onClose={onBack} />}

      {!error && dayCount > 0 && <DayTabs count={dayCount} activeIndex={activeDay} onSelect={setActiveDay} />}

      {!error && (
        <div className={styles.slotGrid}>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={240} borderRadius="16px" />)}
          {!loading &&
            activeDayData &&
            SLOT_LABELS.map(({ key, label }) => (
              <TimeSlotCard key={`${activeDay}-${key}`} label={label} slot={activeDayData.slots[key]} />
            ))}
        </div>
      )}
    </div>
  );
}

import type { WeatherDay } from '../types';
import { Skeleton } from './Skeleton';
import styles from './WeatherRow.module.css';

interface WeatherRowProps {
  days: WeatherDay[] | null;
  loading: boolean;
  error: boolean;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function WeatherRow({ days, loading, error }: WeatherRowProps) {
  if (loading) {
    return (
      <div className={styles.row}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width={72} height={72} borderRadius="12px" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className={styles.errorText}>Không tải được dự báo thời tiết lúc này</p>;
  }

  if (!days || days.length === 0) return null;

  return (
    <div className={styles.row}>
      {days.map((day) =>
        day.available ? (
          <div key={day.date} className={styles.day}>
            <span className={styles.date}>{formatShortDate(day.date)}</span>
            <span className={styles.icon}>{day.icon}</span>
            <span className={styles.temp}>
              {Math.round(day.tempMin)}° - {Math.round(day.tempMax)}°
            </span>
          </div>
        ) : (
          <div key={day.date} className={styles.day}>
            <span className={styles.date}>{formatShortDate(day.date)}</span>
            <span className={styles.unavailable}>Chưa có dự báo</span>
          </div>
        ),
      )}
    </div>
  );
}

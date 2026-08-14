import { useEffect, useRef, useState } from 'react';
import type { Place, WeatherDay, ImageResponse } from '../types';
import { fetchImage } from '../api/image';
import { fetchWeather } from '../api/weather';
import { Skeleton } from './Skeleton';
import { WeatherRow } from './WeatherRow';
import styles from './DetailSheet.module.css';

interface DetailSheetProps {
  place: Place;
  region: string;
  dates: string[];
  onClose: () => void;
  onCreateItinerary: () => void;
}

export function DetailSheet({ place, region, dates, onClose, onCreateItinerary }: DetailSheetProps) {
  const [image, setImage] = useState<ImageResponse | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [weatherDays, setWeatherDays] = useState<WeatherDay[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    fetchImage(place.imageQuery, place.tags[0] ?? '', place.name).then(setImage);
  }, [place.imageQuery, place.tags, place.name]);

  useEffect(() => {
    setWeatherLoading(true);
    setWeatherError(false);
    fetchWeather(place.name, region, dates)
      .then((res) => setWeatherDays(res.days))
      .catch(() => setWeatherError(true))
      .finally(() => setWeatherLoading(false));
  }, [place.name, region, dates]);

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta);
  }

  function handleTouchEnd() {
    if (dragY > 80) onClose();
    setDragY(0);
    startYRef.current = null;
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        style={{ transform: `translateY(${dragY}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.handle} />

        <div className={styles.imageWrap}>
          {!image && <Skeleton />}
          {image && (
            <img
              src={image.url}
              alt={image.alt}
              className={`${styles.image} ${imageLoaded ? styles.imageLoaded : ''}`}
              onLoad={() => setImageLoaded(true)}
            />
          )}
        </div>

        <h2 className={styles.name}>{place.name}</h2>
        <p className={styles.summary}>
          {place.reason} — {place.region}, {place.country}.
        </p>
        <div className={styles.tagRow}>
          {place.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <h3 className={styles.sectionTitle}>Thời tiết</h3>
        <WeatherRow days={weatherDays} loading={weatherLoading} error={weatherError} />

        <button type="button" className={styles.cta} onClick={onCreateItinerary}>
          Tạo lịch trình cho {place.name}
        </button>
      </div>
    </div>
  );
}

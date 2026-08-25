import { useEffect, useState } from 'react';
import type { Slot, ImageResponse } from '../types';
import { fetchImage } from '../api/image';
import { Skeleton } from './Skeleton';
import styles from './TimeSlotCard.module.css';

interface TimeSlotCardProps {
  label: string;
  slot: Slot;
}

export function TimeSlotCard({ label, slot }: TimeSlotCardProps) {
  const [image, setImage] = useState<ImageResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchImage(slot.imageQuery, '', slot.name)
      .then((result) => {
        if (!cancelled) setImage(result);
      })
      .catch(() => {
        if (!cancelled) setImage({ url: '/fallback-images/fallback-1.svg', alt: slot.name, source: 'fallback' });
      });
    return () => {
      cancelled = true;
    };
  }, [slot.imageQuery, slot.name]);

  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <div className={styles.imageWrap}>
        {!image && <Skeleton />}
        {image && (
          <img
            src={image.url}
            alt={image.alt}
            className={`${styles.image} ${loaded ? styles.imageLoaded : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setImage((img) => (img ? { ...img, url: '/fallback-images/fallback-1.svg' } : img))}
          />
        )}
      </div>
      <h4 className={styles.name}>{slot.name}</h4>
      <p className={styles.description}>{slot.description}</p>
    </div>
  );
}

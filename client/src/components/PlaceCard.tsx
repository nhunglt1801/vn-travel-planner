import { useEffect, useState } from 'react';
import type { Place, ImageResponse } from '../types';
import { fetchImage } from '../api/image';
import { Skeleton } from './Skeleton';
import styles from './PlaceCard.module.css';

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  const [image, setImage] = useState<ImageResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchImage(place.imageQuery, place.tags[0] ?? '', place.name).then((result) => {
      if (!cancelled) setImage(result);
    });
    return () => {
      cancelled = true;
    };
  }, [place.imageQuery, place.tags, place.name]);

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.imageWrap}>
        {!image && <Skeleton />}
        {image && (
          <img
            src={image.url}
            alt={image.alt}
            className={`${styles.image} ${loaded ? styles.imageLoaded : ''}`}
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>
      <h3 className={styles.name}>{place.name}</h3>
      <p className={styles.reason}>{place.reason}</p>
      <div className={styles.tagRow}>
        {place.tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

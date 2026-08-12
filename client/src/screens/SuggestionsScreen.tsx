import type { Place } from '../types';
import { PlaceCard } from '../components/PlaceCard';
import { Skeleton } from '../components/Skeleton';
import { ErrorBanner } from '../components/ErrorBanner';
import styles from './SuggestionsScreen.module.css';

interface SuggestionsScreenProps {
  places: Place[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectPlace: (place: Place) => void;
  onBack: () => void;
}

export function SuggestionsScreen({
  places,
  loading,
  error,
  onRetry,
  onSelectPlace,
  onBack,
}: SuggestionsScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Chỉnh lại yêu cầu
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={onRetry} onClose={onBack} />}

      {!error && (
        <div className={styles.grid}>
          {loading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={280} borderRadius="16px" />)}
          {!loading &&
            places?.map((place) => (
              <PlaceCard key={place.id} place={place} onClick={() => onSelectPlace(place)} />
            ))}
        </div>
      )}
    </div>
  );
}

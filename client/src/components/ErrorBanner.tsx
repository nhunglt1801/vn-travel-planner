import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      <span>{message}</span>
      <button type="button" className={styles.retryButton} onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}

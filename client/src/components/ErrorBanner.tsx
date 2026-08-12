import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} role="alertdialog">
        <p className={styles.message}>{message}</p>
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Thử lại
        </button>
      </div>
    </div>
  );
}

import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}

export function ErrorBanner({ message, onRetry, onClose }: ErrorBannerProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal} role="alertdialog" aria-labelledby="error-banner-message">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
          ✕
        </button>
        <p id="error-banner-message" className={styles.message}>{message}</p>
        <button type="button" className={styles.retryButton} onClick={onRetry} autoFocus>
          Thử lại
        </button>
      </div>
    </div>
  );
}

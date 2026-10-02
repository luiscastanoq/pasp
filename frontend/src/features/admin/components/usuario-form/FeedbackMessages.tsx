import type { FeedbackState } from './types';
import styles from '../../../../shared/components/ui/ui.module.css';

interface FeedbackMessagesProps {
  feedback: FeedbackState;
  onClose: () => void;
}

export function FeedbackMessages({ feedback, onClose }: FeedbackMessagesProps) {
  if (feedback?.type === 'success') {
    return (
      <div className={styles.toastSuccess} role="status" aria-live="polite">
        <span className={styles.toastIcon}>✓</span>
        <span className={styles.toastText}>{feedback.message}</span>
        <button
          type="button"
          className={styles.toastClose}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    );
  }

  if (feedback?.type === 'error') {
    return (
      <div className={styles.bannerError} role="alert">
        <span className={styles.bannerIcon}>! </span>
        <span className={styles.bannerText}>{feedback.message}</span>
        <button
          type="button"
          className={styles.bannerClose}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}

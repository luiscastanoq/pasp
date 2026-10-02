import type { ReactNode } from 'react';
import styles from './ui.module.css';

interface FeedbackBannerProps {
  children: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
}

export function FeedbackBanner({ children, icon = '! ', onClose }: FeedbackBannerProps) {
  return (
    <div className={styles.bannerError} role="alert">
      <span className={styles.bannerIcon}>{icon}</span>
      <span className={styles.bannerText}>{children}</span>
      {onClose && (
        <button
          type="button"
          className={styles.bannerClose}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
}

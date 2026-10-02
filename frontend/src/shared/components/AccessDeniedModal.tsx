import styles from './TokenExpiredModal.module.css';

interface AccessDeniedModalProps {
  onGoBack: () => void;
}

export function AccessDeniedModal({ onGoBack }: AccessDeniedModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.iconContainer}>
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
        </div>
        <h2 className={styles.title}>Acceso no permitido</h2>
        <p className={styles.message}>
          Tu rol no tiene permisos para acceder a esta pantalla.
        </p>
        <button type="button" onClick={onGoBack} className={styles.button}>
          Ir a mi panel
        </button>
      </div>
    </div>
  );
}

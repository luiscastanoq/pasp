import styles from './ErrorRecoveryActions.module.css';

interface ErrorRecoveryActionsProps {
  hasRetried: boolean;
  onRetry: () => void;
  onResetSession: () => void;
}

export function ErrorRecoveryActions({
  hasRetried,
  onRetry,
  onResetSession,
}: ErrorRecoveryActionsProps) {
  return (
    <div className={styles.container}>
      {hasRetried ? (
        <p className={styles.recoveryHint} role="status">
          Si el error continúa, reinicia la sesión para volver a empezar.
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onRetry}
          className={hasRetried ? styles.secondaryButton : styles.primaryButton}
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={onResetSession}
          className={hasRetried ? styles.resetButtonEmphasized : styles.resetButton}
        >
          Reiniciar sesión
        </button>
      </div>
    </div>
  );
}

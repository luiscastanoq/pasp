import { useEffect, useState } from 'react';
import {
  authService,
  type DatabaseReadinessStatus,
} from '../services/authService';
import styles from './Login.module.css';

function formatDuration(seconds: number): string {
  return seconds < 60
    ? `${seconds} s`
    : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

export function LoginProgress() {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [readiness, setReadiness] = useState<DatabaseReadinessStatus>({
    phase: 'checking',
    lastResponseAt: null,
  });

  useEffect(() => authService.subscribeDatabaseReadiness(setReadiness), []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1_000));
  const responseAge =
    readiness.lastResponseAt === null
      ? null
      : Math.max(0, Math.floor((now - readiness.lastResponseAt) / 1_000));
  const phaseMessage =
    readiness.phase === 'ready'
      ? 'Servicio disponible. Iniciando sesión…'
      : readiness.phase === 'waking'
        ? 'El servidor responde. El servicio sigue iniciándose.'
        : 'Comprobando disponibilidad…';

  return (
    <div className={`${styles.preparingMessage} ${styles.loginProgress}`}>
      <div className={styles.progressHeading}>
        <span className={styles.spinner} aria-hidden="true" />
        <strong>Preparando tu acceso</strong>
        <span
          className={styles.elapsedTime}
          aria-label={`Tiempo de espera: ${formatDuration(elapsed)}`}
        >
          {formatDuration(elapsed)}
        </span>
      </div>
      <span>
        {readiness.phase === 'ready'
          ? 'La conexión está preparada. Estamos completando tu acceso.'
          : 'Reactivando el servicio tras un período sin uso. Entrarás automáticamente.'}
      </span>
      <span className={styles.responseStatus}>
        {readiness.phase === 'ready'
          ? phaseMessage
          : responseAge === null
            ? 'Esperando la primera respuesta del servidor…'
            : readiness.phase === 'waking'
              ? `El servidor respondió hace ${formatDuration(responseAge)}: sigue iniciándose.`
              : `Última respuesta hace ${formatDuration(responseAge)} · Comprobando disponibilidad…`}
      </span>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {phaseMessage}
      </span>
    </div>
  );
}

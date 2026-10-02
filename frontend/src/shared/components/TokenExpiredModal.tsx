/**
 * Modal que se muestra cuando el token ha expirado
 * Informa al usuario y le permite reiniciar sesión
 */

import { useEffect } from 'react';
import styles from './TokenExpiredModal.module.css';

interface TokenExpiredModalProps {
  onRetry: () => void;
}

export function TokenExpiredModal({ onRetry }: TokenExpiredModalProps) {
  // Auto-cerrar después de 5 segundos si el usuario no hace clic
  useEffect(() => {
    const timer = setTimeout(() => {
      onRetry();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onRetry]);

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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className={styles.title}>Sesión Expirada</h2>
        <p className={styles.message}>
          Tu sesión ha expirado por seguridad. Por favor, inicia sesión
          nuevamente.
        </p>
        <button onClick={onRetry} className={styles.button}>
          Volver al Login
        </button>
        <p className={styles.autoRedirect}>
          Redirigiendo automáticamente en 5 segundos...
        </p>
      </div>
    </div>
  );
}

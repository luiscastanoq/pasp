import { useState, useEffect } from 'react';
import { fichajeService } from '../../../../fichajes/services/fichajeService';
import type { FichajeActivo } from '../../../../../types/fichaje';
import { ApiError } from '../../../../../shared/api/api';
import styles from './FichajeModal.module.css';

interface FichajeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fichajeActivo: FichajeActivo | null;
  onFichajeCompleted: () => void;
}

export const FichajeModal = ({
  isOpen,
  onClose,
  fichajeActivo,
  onFichajeCompleted,
}: FichajeModalProps) => {
  const [horasImputadas, setHorasImputadas] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [localFichajeActivo, setLocalFichajeActivo] =
    useState<FichajeActivo | null>(null);
  const fichajeActual = localFichajeActivo ?? fichajeActivo;

  // Estados posibles:
  // - fichajeActual === null         → Sin fichaje hoy → Solo entrada habilitada
  // - fichajeActual.horaSalida null  → Entrada fichada, sin salida → Solo salida habilitada
  // - fichajeActual.horaSalida set   → Jornada completa → Ambos deshabilitados
  const hasFichajeDelDia = fichajeActual !== null;
  const jornadaCompleta =
    fichajeActual !== null && fichajeActual.horaSalida !== null;
  const isEntradaDisabled = hasFichajeDelDia || isLoading;
  const isSalidaDisabled = !hasFichajeDelDia || jornadaCompleta || isLoading;

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setHorasImputadas('');
        setError(null);
        setSuccessMessage(null);
        setLocalFichajeActivo(null);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleHorasChange = (value: string) => {
    setHorasImputadas(value);
    setError(null);
  };

  const handleFicharEntrada = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fichajeService.ficharEntrada();

      if (response.success) {
        setSuccessMessage('Entrada registrada correctamente');
        if (response.data) {
          setLocalFichajeActivo({ ...response.data, horaSalida: null });
        }
        onFichajeCompleted();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        let errorMessage = err.message;
        if (errorMessage.includes('Ya existe un fichaje para hoy')) {
          errorMessage =
            'Ya has fichado la entrada hoy. Solo puedes fichar una vez al día.';
        }
        setError(errorMessage);
      } else {
        setError('Error al registrar entrada. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFicharSalida = async () => {
    if (!fichajeActual) {
      setError('No hay fichaje activo para cerrar');
      return;
    }

    const horas = parseFloat(horasImputadas);

    if (!Number.isFinite(horas) || horas < 0.5 || horas > 16) {
      setError('Las horas imputadas deben estar entre 0.5 y 16');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fichajeService.ficharSalida(
        fichajeActual.idFichaje,
        { horasImputadas: horas }
      );

      if (response.success) {
        setSuccessMessage('Salida registrada correctamente');
        setTimeout(() => {
          onFichajeCompleted();
          onClose();
        }, 1500);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        let errorMessage = err.message;
        if (errorMessage.includes('Ya existe un fichaje para hoy')) {
          errorMessage =
            'Ya has fichado la entrada hoy. Solo puedes fichar una vez al día.';
        }
        setError(errorMessage);
      } else {
        setError('Error al registrar salida. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Fichaje</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar modal"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {successMessage && (
            <div className={styles.successAlert}>
              <span className={styles.alertIcon}>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className={styles.errorAlert} role="alert">
              <span className={styles.alertIcon}>! </span>
              <span>{error}</span>
            </div>
          )}

          {hasFichajeDelDia && fichajeActual && (
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <span className={styles.infoTitle}>Fichaje del día</span>
              </div>
              <div className={styles.infoContent}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Fecha:</span>
                  <span className={styles.infoValue}>
                    {new Date(fichajeActual.fecha).toLocaleDateString(
                      'es-ES',
                      { day: '2-digit', month: '2-digit', year: 'numeric' }
                    )}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Hora entrada:</span>
                  <span className={styles.infoValue}>
                    {formatDateTime(fichajeActual.horaEntrada)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.actionButtons}>
            <button
              onClick={handleFicharEntrada}
              disabled={isEntradaDisabled}
              className={`${styles.fichajeButton} ${styles.fichajeButtonEntrada} ${
                isEntradaDisabled ? styles.fichajeButtonDisabled : ''
              }`}
            >
              <span className={styles.fichajeButtonIcon}>▶</span>
              <span className={styles.fichajeButtonText}>Fichar Entrada</span>
            </button>

            <button
              onClick={handleFicharSalida}
              disabled={isSalidaDisabled}
              className={`${styles.fichajeButton} ${styles.fichajeButtonSalida} ${
                isSalidaDisabled ? styles.fichajeButtonDisabled : ''
              }`}
            >
              <span className={styles.fichajeButtonIcon}>◼</span>
              <span className={styles.fichajeButtonText}>Fichar Salida</span>
            </button>
          </div>

          <div className={styles.horasSection}>
            <label htmlFor="horasImputadas" className={styles.horasLabel}>
              Horas a imputar
              {!hasFichajeDelDia && (
                <span className={styles.horasHint}>
                  {' '}
                  (Disponible tras fichar entrada)
                </span>
              )}
            </label>
            <div className={styles.horasInputWrapper}>
              <input
                id="horasImputadas"
                type="number"
                step="0.1"
                min="0.5"
                max="16"
                value={horasImputadas}
                onChange={e => handleHorasChange(e.target.value)}
                placeholder="Ej: 8.5"
                className={styles.horasInput}
                disabled={!hasFichajeDelDia || isLoading}
              />
              <span className={styles.horasUnit}>horas</span>
            </div>
          </div>

          <div className={styles.statusBadge}>
            <span
              className={`${styles.statusDot} ${hasFichajeDelDia ? styles.statusActive : styles.statusInactive}`}
            ></span>
            <span className={styles.statusText}>
              {hasFichajeDelDia
                ? 'Fichaje activo del día'
                : 'Sin fichaje del día'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

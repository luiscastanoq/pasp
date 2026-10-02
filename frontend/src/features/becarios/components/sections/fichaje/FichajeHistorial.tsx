import { useState, useEffect, useCallback } from 'react';
import { fichajeService } from '../../../../fichajes/services/fichajeService';
import type {
  FichajeHistorialEntry,
  PaginationInfo,
} from '../../../../../types/fichaje';
import { ApiError } from '../../../../../shared/api/api';
import styles from './FichajeHistorial.module.css';

interface FichajeHistorialProps {
  isOpen: boolean;
  onClose: () => void;
}

function getEstadoFichaje(entry: FichajeHistorialEntry): {
  label: string;
  className: string;
} {
  if (entry.horaSalida)
    return { label: 'Completo', className: styles.estadoCompleto };
  const fechaFichaje = new Date(entry.horaEntrada).toISOString().slice(0, 10);
  const hoy = new Date().toISOString().slice(0, 10);
  if (fechaFichaje === hoy)
    return { label: 'En curso', className: styles.estadoEnCurso };
  return { label: 'Incompleto', className: styles.estadoIncompleto };
}

function formatFecha(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatHora(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const FichajeHistorial = ({
  isOpen,
  onClose,
}: FichajeHistorialProps) => {
  const [fichajes, setFichajes] = useState<FichajeHistorialEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistorial = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fichajeService.getHistorialFichajes({
        page,
        limit: 5,
      });
      setFichajes(response.data.fichajes);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Error al cargar el historial de fichajes'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        void loadHistorial(1);
      });
    }
  }, [isOpen, loadHistorial]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handlePageChange = (newPage: number) => {
    void loadHistorial(newPage);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Historial de Fichajes</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar historial"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          {isLoading && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Cargando historial...</p>
            </div>
          )}
          {!isLoading && error && (
            <div className={styles.errorAlert}>
              <span>!</span>
              <span>{error}</span>
            </div>
          )}
          {!isLoading && !error && (
            <>
              {fichajes.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyIcon}>[]</p>
                  <p className={styles.emptyText}>
                    No hay fichajes registrados
                  </p>
                  <p className={styles.emptySubtext}>
                    Aqui apareceran tus registros de entrada y salida
                  </p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Fecha</th>
                        <th className={styles.th}>Entrada</th>
                        <th className={styles.th}>Salida</th>
                        <th className={styles.thNumber}>H. Trabajadas</th>
                        <th className={styles.thNumber}>H. Imputadas</th>
                        <th className={styles.th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fichajes.map(entry => {
                        const estado = getEstadoFichaje(entry);
                        return (
                          <tr key={entry.idFichaje} className={styles.tr}>
                            <td className={styles.td}>
                              {formatFecha(entry.horaEntrada)}
                            </td>
                            <td className={styles.td}>
                              {formatHora(entry.horaEntrada)}
                            </td>
                            <td className={styles.td}>
                              {entry.horaSalida
                                ? formatHora(entry.horaSalida)
                                : '-'}
                            </td>
                            <td className={styles.tdNumber}>
                              {entry.horasTrabajadas != null
                                ? `${entry.horasTrabajadas}h`
                                : '-'}
                            </td>
                            <td className={styles.tdNumber}>
                              {entry.horasImputadas != null
                                ? `${entry.horasImputadas}h`
                                : '-'}
                            </td>
                            <td className={styles.td}>
                              <span
                                className={`${styles.estadoBadge} ${estado.className}`}
                              >
                                {estado.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  {/* Flecha izquierda */}
                  <button
                    className={styles.pageArrow}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    aria-label="Página anterior"
                  >
                    ‹
                  </button>

                  {/* Números de página */}
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map(page => (
                    <button
                      key={page}
                      className={`${styles.pageNumber} ${page === pagination.page ? styles.pageNumberActive : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Flecha derecha */}
                  <button
                    className={styles.pageArrow}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    aria-label="Página siguiente"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

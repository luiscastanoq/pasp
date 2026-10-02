import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../auth/context/useAuth';
import type { BecarioSummary } from '../../../../types/becario';
import type { Evaluacion } from '../../../../types/evaluacion';
import {
  deleteEvaluacion,
  getEvaluacionesByBecario,
} from '../../services/tutorService';
import { Header } from '../../../../shared/components/Header';
import { ErrorRecoveryActions } from '../../../../shared/components/ErrorRecoveryActions';
import { NuevaEvaluacionModal } from './NuevaEvaluacionModal';
import { useErrorRecovery } from '../../../auth/hooks/useErrorRecovery';
import { FileEditIcon } from './FileEditIcon';
import styles from './EvaluacionView.module.css';

interface EvaluacionViewProps {
  becario: BecarioSummary;
  onBack: () => void;
  readOnly?: boolean;
  roleLabel?: string;
  getEvaluaciones?: typeof getEvaluacionesByBecario;
}

type IconName = 'back' | 'close' | 'trash' | 'chevronLeft' | 'chevronRight';

const PAGE_SIZE = 7;

function Icon({ name }: { name: IconName }) {
  const common = {
    className: styles.icon,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'back':
      return (
        <svg {...common}>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6 18 20H6L5 6" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      );
    case 'chevronLeft':
      return (
        <svg {...common}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case 'chevronRight':
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
  }
}

const formatFecha = (fechaStr: string): string => {
  return new Date(fechaStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getInitials = (nombre: string, apellidos: string) =>
  `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

const scoreRows = [
  ['Puntualidad', 'puntuacionPuntualidad'],
  ['Calidad del Trabajo', 'puntuacionCalidad'],
  ['Actitud', 'puntuacionActitud'],
  ['Autonomía', 'puntuacionAutonomia'],
  ['Comunicación', 'puntuacionComunicacion'],
] as const;

export const EvaluacionView = ({
  becario,
  onBack,
  readOnly = false,
  roleLabel = 'Tutor de empresa',
  getEvaluaciones = getEvaluacionesByBecario,
}: EvaluacionViewProps) => {
  const { user, logout } = useAuth();
  const { hasRetried, retry, markRecovered, resetSession } =
    useErrorRecovery(logout);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(true);
  const [errorEvaluaciones, setErrorEvaluaciones] = useState<string | null>(
    null
  );
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] =
    useState<Evaluacion | null>(null);
  const [showNuevaEvaluacion, setShowNuevaEvaluacion] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const puedeGestionar =
    !readOnly &&
    (user?.rol === 'Administrador' || user?.rol === 'Tutor_Empresa');

  const totalPages = Math.max(1, Math.ceil(evaluaciones.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvaluaciones = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return evaluaciones.slice(startIndex, startIndex + PAGE_SIZE);
  }, [evaluaciones, safeCurrentPage]);

  const cargarEvaluaciones = useCallback(async () => {
    try {
      setLoadingEvaluaciones(true);
      setErrorEvaluaciones(null);
      const response = await getEvaluaciones(becario.idBecario);
      setEvaluaciones(response.data);
      setEvaluacionSeleccionada(response.data[0] ?? null);
      setCurrentPage(1);
      markRecovered();
    } catch (err) {
      console.error('Error al cargar evaluaciones:', err);
      setErrorEvaluaciones('Error al cargar las evaluaciones');
    } finally {
      setLoadingEvaluaciones(false);
    }
  }, [becario.idBecario, getEvaluaciones, markRecovered]);

  useEffect(() => {
    queueMicrotask(() => {
      void cargarEvaluaciones();
    });
  }, [cargarEvaluaciones]);

  const handleNuevaEvaluacion = (nuevaEvaluacion: Evaluacion) => {
    setEvaluaciones(prev => [nuevaEvaluacion, ...prev]);
    setEvaluacionSeleccionada(nuevaEvaluacion);
    setCurrentPage(1);
  };

  const handleDeleteEvaluacion = async (evaluacion: Evaluacion) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar esta evaluación? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    try {
      setDeletingId(evaluacion.idEvaluacion);
      await deleteEvaluacion(becario.idBecario, evaluacion.idEvaluacion);

      setEvaluaciones(prev => {
        const next = prev.filter(
          item => item.idEvaluacion !== evaluacion.idEvaluacion
        );
        if (evaluacionSeleccionada?.idEvaluacion === evaluacion.idEvaluacion) {
          setEvaluacionSeleccionada(next[0] ?? null);
        }
        return next;
      });
    } catch (err) {
      console.error('Error al eliminar evaluación:', err);
      setErrorEvaluaciones(
        err instanceof Error ? err.message : 'Error al eliminar la evaluación'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel={roleLabel}
        onLogout={logout}
      />

      <main className={styles.main}>
        <section className={styles.titleSection}>
          <div className={styles.becarioTitleRow}>
            <div className={styles.avatar}>
              {getInitials(becario.nombre, becario.apellidos)}
            </div>
            <div>
              <h1 className={styles.becarioName}>
                {becario.nombre} {becario.apellidos}
              </h1>
              <p className={styles.subtitle}>Evaluaciones</p>
            </div>
          </div>

          <button onClick={onBack} className={styles.backButton}>
            <Icon name="back" />
            Volver a la ficha
          </button>
        </section>

        {puedeGestionar && (
          <button
            className={styles.evaluarBtn}
            onClick={() => setShowNuevaEvaluacion(true)}
          >
            <FileEditIcon size={18} color="white" />
            EVALUAR
          </button>
        )}

        <section className={styles.splitLayout}>
          <article className={styles.listPanel}>
            <header className={styles.listHeader}>
              <h2>Evaluaciones registradas</h2>
              {!loadingEvaluaciones && (
                <span className={styles.countBadge}>{evaluaciones.length}</span>
              )}
            </header>

            <div className={styles.listBody}>
              {loadingEvaluaciones ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} />
                  <p>Cargando evaluaciones...</p>
                </div>
              ) : errorEvaluaciones ? (
                <div className={styles.errorState}>
                  <p>{errorEvaluaciones}</p>
                  <ErrorRecoveryActions
                    hasRetried={hasRetried}
                    onRetry={() => retry(cargarEvaluaciones)}
                    onResetSession={resetSession}
                  />
                </div>
              ) : evaluaciones.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>
                    Aún no hay evaluaciones registradas para este becario.
                  </p>
                </div>
              ) : (
                <div className={styles.evaluationList}>
                  {paginatedEvaluaciones.map(evaluacion => {
                    const isSelected =
                      evaluacionSeleccionada?.idEvaluacion ===
                      evaluacion.idEvaluacion;
                    return (
                      <button
                        key={evaluacion.idEvaluacion}
                        className={`${styles.evaluationItem} ${
                          isSelected ? styles.evaluationItemActive : ''
                        }`}
                        onClick={() => setEvaluacionSeleccionada(evaluacion)}
                      >
                        <span className={styles.evaluationText}>
                          <span className={styles.evaluationDate}>
                            {formatFecha(evaluacion.fechaEvaluacion)}
                          </span>
                          <span className={styles.evaluationTitle}>
                            {evaluacion.titulo}
                          </span>
                        </span>
                        {puedeGestionar && (
                          <span
                            role="button"
                            tabIndex={0}
                            className={styles.deleteButton}
                            aria-label={`Eliminar ${evaluacion.titulo}`}
                            onClick={event => {
                              event.preventDefault();
                              event.stopPropagation();
                              void handleDeleteEvaluacion(evaluacion);
                            }}
                            onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                void handleDeleteEvaluacion(evaluacion);
                              }
                            }}
                          >
                            {deletingId === evaluacion.idEvaluacion ? (
                              <span className={styles.spinnerSmall} />
                            ) : (
                              <Icon name="trash" />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <footer className={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <Icon name="chevronLeft" />
              </button>
              <span className={styles.pageNumber}>{safeCurrentPage}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                <Icon name="chevronRight" />
              </button>
            </footer>
          </article>

          <article className={styles.detailPanel}>
            <header className={styles.detailHeader}>
              <h2>Detalle de Evaluación</h2>
              <button
                className={styles.closeDetailButton}
                onClick={() => setEvaluacionSeleccionada(null)}
                aria-label="Cerrar detalle"
              >
                <Icon name="close" />
              </button>
            </header>

            {evaluacionSeleccionada ? (
              <div className={styles.detailBody}>
                <div className={styles.summaryGrid}>
                  <div>
                    <span className={styles.fieldLabel}>TÍTULO</span>
                    <p className={styles.fieldValue}>
                      {evaluacionSeleccionada.titulo}
                    </p>
                  </div>
                  <div>
                    <span className={styles.fieldLabel}>FECHA</span>
                    <p className={styles.fieldValue}>
                      {formatFecha(evaluacionSeleccionada.fechaEvaluacion)}
                    </p>
                  </div>
                </div>

                <section className={styles.detailSection}>
                  <h3>DESCRIPCIÓN</h3>
                  <p className={styles.descriptionBox}>
                    {evaluacionSeleccionada.comentarios || '—'}
                  </p>
                </section>

                <section className={styles.detailSection}>
                  <h3>PUNTUACIONES</h3>
                  <div className={styles.scoresList}>
                    {scoreRows.map(([label, field]) => (
                      <div key={field} className={styles.scoreRow}>
                        <span>{label}</span>
                        <div className={styles.scoreScale}>
                          {[1, 2, 3, 4, 5].map(score => (
                            <span
                              key={score}
                              className={
                                evaluacionSeleccionada[field] === score
                                  ? styles.scoreActive
                                  : styles.scoreDot
                              }
                            >
                              {score}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className={styles.mediaSection}>
                  <span>Puntuación Media</span>
                  <strong>
                    {evaluacionSeleccionada.puntuacionMedia !== null
                      ? evaluacionSeleccionada.puntuacionMedia.toFixed(1)
                      : '—'}
                  </strong>
                </div>
              </div>
            ) : (
              <div className={styles.emptyDetail}>
                Selecciona una evaluación para ver su detalle.
              </div>
            )}
          </article>
        </section>
      </main>

      {showNuevaEvaluacion && (
        <NuevaEvaluacionModal
          idBecario={becario.idBecario}
          onClose={() => setShowNuevaEvaluacion(false)}
          onSuccess={handleNuevaEvaluacion}
        />
      )}
    </div>
  );
};

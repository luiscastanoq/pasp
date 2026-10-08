import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BecarioSummary } from '../../../types/becario';
import {
  deleteBecario,
  getMyBecarios,
  toggleEstadoBecario,
} from '../services/tutorService';
import { useAuth } from '../../auth/context/useAuth';
import { BecarioDetailView } from '../components/becario/BecarioDetailView';
import { EvaluacionView } from '../components/evaluacion/EvaluacionView';
import { Header } from '../../../shared/components/Header';
import { ErrorRecoveryActions } from '../../../shared/components/ErrorRecoveryActions';
import { useErrorRecovery } from '../../auth/hooks/useErrorRecovery';
import styles from './TutorDashboard.module.css';

type IconName =
  | 'search'
  | 'group'
  | 'add'
  | 'edit'
  | 'personOff'
  | 'personCheck'
  | 'trash'
  | 'chevronLeft'
  | 'chevronRight';

type TutorHistoryState = {
  tutorView?: 'dashboard' | 'detail' | 'evaluation';
  idBecario?: number;
};

const PAGE_SIZE = 5;

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
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'group':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'add':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case 'personOff':
      return (
        <svg {...common}>
          <path d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="m17 8 5 5" />
          <path d="m22 8-5 5" />
        </svg>
      );
    case 'personCheck':
      return (
        <svg {...common}>
          <path d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="m16 11 2 2 4-5" />
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

function formatFechaFichaje(fechaISO: string | null | undefined): string {
  if (!fechaISO) return '-';

  const fecha = new Date(fechaISO);
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
}

function getInitials(nombre: string, apellidos: string): string {
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function getPrimerAccesoStatus(becario: BecarioSummary) {
  return becario.ultimoFichaje ? 'Completado' : 'Pendiente';
}

function esFechaHoy(fechaISO: string | null | undefined): boolean {
  if (!fechaISO) return false;

  const fechaFichaje = new Date(fechaISO);
  const hoy = new Date();

  return (
    fechaFichaje.getFullYear() === hoy.getFullYear() &&
    fechaFichaje.getMonth() === hoy.getMonth() &&
    fechaFichaje.getDate() === hoy.getDate()
  );
}

function scoreMatch(becario: BecarioSummary, term: string): number {
  const t = term.toLowerCase();
  const fields = [
    becario.nombre.toLowerCase(),
    becario.apellidos.toLowerCase(),
    becario.email.toLowerCase(),
  ];
  let score = 0;
  for (const field of fields) {
    if (field === t) score += 100;
    else if (field.startsWith(t)) score += 50;
    else if (field.includes(t)) score += 10;
  }
  return score;
}

export const TutorDashboard = () => {
  const [becarios, setBecarios] = useState<BecarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBecario, setSelectedBecario] = useState<BecarioSummary | null>(
    null
  );
  const [showingEvaluacion, setShowingEvaluacion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionBecarioId, setActionBecarioId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { hasRetried, retry, markRecovered, resetSession } =
    useErrorRecovery(logout);
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  const becariosFiltered = useMemo(() => {
    if (!searchTerm.trim()) return becarios;
    const term = searchTerm.trim().toLowerCase();
    return becarios
      .filter(
        becario =>
          becario.nombre.toLowerCase().includes(term) ||
          becario.apellidos.toLowerCase().includes(term) ||
          becario.email.toLowerCase().includes(term)
      )
      .sort((a, b) => scoreMatch(b, term) - scoreMatch(a, term));
  }, [becarios, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(becariosFiltered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const becariosPaginados = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return becariosFiltered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [becariosFiltered, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadBecarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBecarios();
      setBecarios(data);
      markRecovered();
    } catch (err) {
      console.error('Error al cargar becarios:', err);
      setError(
        'Error al cargar los becarios asignados. Por favor, intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, [markRecovered]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBecarios();
      isInitialMount.current = false;
    });
  }, [loadBecarios]);

  useEffect(() => {
    const currentState = window.history.state as TutorHistoryState | null;

    if (!currentState?.tutorView) {
      window.history.replaceState(
        { ...currentState, tutorView: 'dashboard' },
        '',
        window.location.href
      );
    }
  }, []);

  useEffect(() => {
    const handleTutorPopState = (event: PopStateEvent) => {
      const state = event.state as TutorHistoryState | null;

      if (state?.tutorView === 'detail' && state.idBecario) {
        const becario = becarios.find(b => b.idBecario === state.idBecario);
        if (becario) {
          setSelectedBecario(becario);
          setShowingEvaluacion(false);
        }
        return;
      }

      if (state?.tutorView === 'evaluation' && state.idBecario) {
        const becario = becarios.find(b => b.idBecario === state.idBecario);
        if (becario) {
          setSelectedBecario(becario);
          setShowingEvaluacion(true);
        }
        return;
      }

      setShowingEvaluacion(false);
      setSelectedBecario(null);
    };

    window.addEventListener('popstate', handleTutorPopState);
    return () => window.removeEventListener('popstate', handleTutorPopState);
  }, [becarios]);

  useEffect(() => {
    if (!selectedBecario && !isInitialMount.current) {
      queueMicrotask(() => {
        void loadBecarios();
      });
    }
  }, [loadBecarios, selectedBecario]);

  const handleBecarioClick = (idBecario: number) => {
    const becario = becarios.find(b => b.idBecario === idBecario);
    if (becario) {
      window.history.pushState(
        { tutorView: 'detail', idBecario },
        '',
        window.location.href
      );
      setSelectedBecario(becario);
      setShowingEvaluacion(false);
    }
  };

  const handleBecarioRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    idBecario: number
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBecarioClick(idBecario);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleToggleEstado = async (
    event: MouseEvent<HTMLButtonElement>,
    becario: BecarioSummary
  ) => {
    event.stopPropagation();
    setActionError(null);
    setActionBecarioId(becario.idBecario);

    try {
      const updated = await toggleEstadoBecario(becario.idBecario);
      setBecarios(prev =>
        prev.map(current =>
          current.idBecario === becario.idBecario
            ? { ...current, activo: updated.activo }
            : current
        )
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el estado del becario'
      );
    } finally {
      setActionBecarioId(null);
    }
  };

  const handleDeleteBecario = async (
    event: MouseEvent<HTMLButtonElement>,
    becario: BecarioSummary
  ) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${becario.nombre} ${becario.apellidos}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setActionError(null);
    setActionBecarioId(becario.idBecario);

    try {
      await deleteBecario(becario.idBecario);
      setBecarios(prev =>
        prev.filter(current => current.idBecario !== becario.idBecario)
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'No se pudo eliminar el becario'
      );
    } finally {
      setActionBecarioId(null);
    }
  };

  const handleBackToDashboard = () => {
    const currentState = window.history.state as TutorHistoryState | null;
    if (
      currentState?.tutorView === 'detail' ||
      currentState?.tutorView === 'evaluation'
    ) {
      window.history.back();
      return;
    }

    setShowingEvaluacion(false);
    setSelectedBecario(null);
  };

  const handleBackToDetalle = () => {
    const currentState = window.history.state as TutorHistoryState | null;
    if (currentState?.tutorView === 'evaluation') {
      window.history.back();
      return;
    }

    setShowingEvaluacion(false);
  };

  const handleGoToEvaluacion = () => {
    if (selectedBecario) {
      window.history.pushState(
        { tutorView: 'evaluation', idBecario: selectedBecario.idBecario },
        '',
        window.location.href
      );
      setShowingEvaluacion(true);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const totalAsignados = becarios.length;

  if (selectedBecario && showingEvaluacion) {
    return (
      <EvaluacionView becario={selectedBecario} onBack={handleBackToDetalle} />
    );
  }

  if (selectedBecario) {
    return (
      <BecarioDetailView
        becario={selectedBecario}
        onBack={handleBackToDashboard}
        onEvaluacion={handleGoToEvaluacion}
      />
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando becarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <ErrorRecoveryActions
            hasRetried={hasRetried}
            onRetry={() => retry(loadBecarios)}
            onResetSession={resetSession}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Tutor de empresa"
        onLogout={handleLogout}
      />

      <main className={styles.main}>
        <div className={styles.titleSection}>
            <h1>Panel de Tutor de empresa</h1>
          <p className={styles.subtitle}>
            Resumen y gestión de becarios asignados
          </p>
        </div>

        <section className={styles.tablePanel}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Icon name="search" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                aria-label="Buscar becarios por nombre, apellidos o email"
              />
              {searchTerm && (
                <button
                  className={styles.clearButton}
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>
            <div className={styles.toolbarActions}>
              <span className={styles.countLabel}>
                <Icon name="group" />
                {totalAsignados} becarios
              </span>
              <button
                type="button"
                className={styles.addButton}
                onClick={() => navigate('/tutor/nuevo-becario')}
              >
                <Icon name="add" />
                Añadir Becario
              </button>
            </div>
          </div>

          {actionError && (
            <div className={styles.actionError} role="alert">
              {actionError}
            </div>
          )}

          {becariosFiltered.length === 0 ? (
            <div className={styles.emptyState}>
              {searchTerm ? (
                <p>
                  No se encontraron coincidencias para &ldquo;
                  <strong>{searchTerm}</strong>&rdquo;.
                </p>
              ) : (
                <p>No tienes becarios asignados actualmente.</p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Ult. Fichaje</th>
                      <th>Estado</th>
                      <th>Primer Acceso</th>
                      <th>Tarea en Progreso</th>
                      <th>Tareas Pendientes</th>
                      <th>Tareas Completadas</th>
                      <th>Administrar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {becariosPaginados.map(becario => {
                      const primerAcceso = getPrimerAccesoStatus(becario);
                      const actionInProgress =
                        actionBecarioId === becario.idBecario;

                      return (
                        <tr
                          key={becario.idBecario}
                          className={styles.tableRow}
                          onClick={() => handleBecarioClick(becario.idBecario)}
                          onKeyDown={event =>
                            handleBecarioRowKeyDown(event, becario.idBecario)
                          }
                          tabIndex={0}
                          aria-label={`Ver detalles de ${becario.nombre} ${becario.apellidos}`}
                        >
                          <td>
                            <div className={styles.userCell}>
                              <span className={styles.avatar}>
                                {getInitials(becario.nombre, becario.apellidos)}
                              </span>
                              <span className={styles.userInfo}>
                                <strong>
                                  {becario.nombre} {becario.apellidos}
                                </strong>
                                <span>{becario.email}</span>
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.fichajeCell}>
                              <span>
                                {formatFechaFichaje(becario.ultimoFichaje)}
                              </span>
                              {esFechaHoy(becario.ultimoFichaje) && (
                                <span
                                  className={styles.greenDot}
                                  title="Fichaje de hoy"
                                />
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              className={
                                becario.activo
                                  ? styles.activeStatus
                                  : styles.inactiveStatus
                              }
                            >
                              {becario.activo ? 'Activo' : 'Deshabilitado'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.accessBadge} ${
                                primerAcceso === 'Completado'
                                  ? styles.accessDone
                                  : styles.accessPending
                              }`}
                            >
                              {primerAcceso}
                            </span>
                          </td>
                          <td>{becario.tareasEnProgreso ?? '—'}</td>
                          <td>{becario.tareasPendientes ?? '—'}</td>
                          <td>{becario.tareasCompletadas ?? '—'}</td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button
                                type="button"
                                className={styles.iconButton}
                                onClick={event => {
                                  event.stopPropagation();
                                  navigate(`/tutor/editar-becario/${becario.idBecario}`);
                                }}
                                aria-label={`Editar becario ${becario.nombre} ${becario.apellidos}`}
                                title="Editar becario"
                              >
                                <Icon name="edit" />
                              </button>
                              <button
                                type="button"
                                className={`${styles.iconButton} ${
                                  becario.activo
                                    ? styles.disableAction
                                    : styles.enableAction
                                }`}
                                onClick={event =>
                                  handleToggleEstado(event, becario)
                                }
                                disabled={actionInProgress}
                                aria-label={`${
                                  becario.activo ? 'Deshabilitar' : 'Habilitar'
                                } usuario ${becario.nombre} ${becario.apellidos}`}
                                title={
                                  becario.activo
                                    ? 'Deshabilitar usuario'
                                    : 'Habilitar usuario'
                                }
                              >
                                <Icon
                                  name={
                                    becario.activo ? 'personOff' : 'personCheck'
                                  }
                                />
                              </button>
                              <button
                                type="button"
                                className={`${styles.iconButton} ${styles.dangerAction}`}
                                onClick={event =>
                                  handleDeleteBecario(event, becario)
                                }
                                disabled={actionInProgress}
                                aria-label={`Eliminar usuario ${becario.nombre} ${becario.apellidos}`}
                                title="Eliminar usuario"
                              >
                                <Icon name="trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <span>
                  Mostrando{' '}
                  {becariosFiltered.length > 0
                    ? (safeCurrentPage - 1) * PAGE_SIZE + 1
                    : 0}{' '}
                  a{' '}
                  {Math.min(safeCurrentPage * PAGE_SIZE, becariosFiltered.length)}{' '}
                  de {becariosFiltered.length} entradas
                </span>
                <div className={styles.paginationButtons}>
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    aria-label="Página anterior"
                  >
                    <Icon name="chevronLeft" />
                  </button>
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map(page => (
                    <button
                      type="button"
                      key={page}
                      className={page === safeCurrentPage ? styles.currentPage : ''}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    aria-label="Página siguiente"
                  >
                    <Icon name="chevronRight" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

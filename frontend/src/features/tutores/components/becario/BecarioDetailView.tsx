import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BecarioSummary,
  UpdateBecarioData,
} from '../../../../types/becario';
import type {
  Tarea,
  CreateTareaData,
  UpdateTareaData,
  EstadoTarea,
} from '../../../../types/tarea';
import type { FichajeHistorialEntry } from '../../../../types/fichaje';
import {
  getTareasByBecario,
  createTarea,
  updateTarea,
  deleteTarea,
  updateBecario,
  getFichajesByBecario,
} from '../../services/tutorService';
import { useAuth } from '../../../auth/context/useAuth';
import { TaskCreateModal } from '../tareas/TaskCreateModal';
import { Header } from '../../../../shared/components/Header';
import { ErrorRecoveryActions } from '../../../../shared/components/ErrorRecoveryActions';
import { BecarioEditModal } from './BecarioEditModal';
import { BecarioFichajeHistorial } from './BecarioFichajeHistorial';
import { TareaDetailModal } from '../../../../shared/components/TareaDetailModal';
import { useErrorRecovery } from '../../../auth/hooks/useErrorRecovery';
import {
  normalizeTipoFormacion,
  ROLES,
  TIPO_FORMACION,
  TIPO_TUTORIA,
} from '../../../../shared/constants/domain.constants';
import styles from './BecarioDetailView.module.css';

interface BecarioDetailViewProps {
  becario: BecarioSummary;
  onBack: () => void;
  onEvaluacion?: () => void;
}

type ProfileTab = 'corporativo' | 'personal' | 'academico';

type AssignedTutor = {
  idTutor?: number;
  nombre?: string;
  apellidos?: string;
  email?: string;
  tipoTutor: string;
  fechaAsignacion?: string | null;
};

type BecarioWithTutors = BecarioSummary & {
  tutores?: AssignedTutor[];
};

type IconName =
  | 'school'
  | 'mail'
  | 'building'
  | 'addTask'
  | 'review'
  | 'tasks'
  | 'clock'
  | 'calendar'
  | 'check'
  | 'sync'
  | 'person'
  | 'money'
  | 'briefcase'
  | 'hand'
  | 'phone'
  | 'link'
  | 'history'
  | 'group'
  | 'edit'
  | 'chevronDown';

const Icon = ({ name, className }: { name: IconName; className?: string }) => {
  const commonProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'school':
      return (
        <svg {...commonProps}>
          <path d="m22 10-10-5-10 5 10 5 10-5Z" />
          <path d="M6 12v5c3.5 2 8.5 2 12 0v-5" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...commonProps}>
          <rect width="18" height="14" x="3" y="5" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case 'building':
      return (
        <svg {...commonProps}>
          <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
          <path d="M16 8h2a2 2 0 0 1 2 2v11" />
          <path d="M8 7h4M8 11h4M8 15h4M4 21h16" />
        </svg>
      );
    case 'addTask':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
          <path d="m16 6 2 2" />
        </svg>
      );
    case 'review':
      return (
        <svg {...commonProps}>
          <path d="M4 4h16v12H7l-3 3V4Z" />
          <path d="m9 11 2 2 4-5" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...commonProps}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...commonProps}>
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case 'check':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'sync':
      return (
        <svg {...commonProps}>
          <path d="M21 12a9 9 0 0 1-15 6.7" />
          <path d="M3 12a9 9 0 0 1 15-6.7" />
          <path d="M18 3v5h-5M6 21v-5h5" />
        </svg>
      );
    case 'person':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'money':
      return (
        <svg {...commonProps}>
          <rect width="18" height="12" x="3" y="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M7 12h.01M17 12h.01" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...commonProps}>
          <rect width="20" height="14" x="2" y="7" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      );
    case 'hand':
      return (
        <svg {...commonProps}>
          <path d="M8 13V6a2 2 0 1 1 4 0v5" />
          <path d="M12 11V5a2 2 0 1 1 4 0v8" />
          <path d="M16 13V8a2 2 0 1 1 4 0v5c0 5-3 8-8 8h-1a7 7 0 0 1-7-7v-2a2 2 0 1 1 4 0v1" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...commonProps}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />
        </svg>
      );
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
          <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
        </svg>
      );
    case 'history':
      return (
        <svg {...commonProps}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'group':
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...commonProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case 'chevronDown':
      return (
        <svg {...commonProps}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
  }
};

const ESTADO_LABELS: Record<EstadoTarea, string> = {
  Pendiente: 'Pendiente',
  En_Progreso: 'En Progreso',
  Completada: 'Completada',
};

const ESTADO_OPTIONS: EstadoTarea[] = ['Pendiente', 'En_Progreso', 'Completada'];
const ULTIMOS_FICHAJES_LIMIT = 7;

export const BecarioDetailView = ({
  becario,
  onEvaluacion,
}: BecarioDetailViewProps) => {
  const [updatedBecario, setUpdatedBecario] = useState<BecarioSummary | null>(
    null
  );
  const currentBecario =
    updatedBecario?.idBecario === becario.idBecario ? updatedBecario : becario;
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFichajeHistorial, setShowFichajeHistorial] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [updatingTareaId, setUpdatingTareaId] = useState<number | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);
  const ignoreNextTaskClickRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('corporativo');
  const [ultimosFichajes, setUltimosFichajes] = useState<
    FichajeHistorialEntry[]
  >([]);
  const [loadingFichajes, setLoadingFichajes] = useState(true);
  const { user, logout } = useAuth();
  const { hasRetried, retry, markRecovered, resetSession } =
    useErrorRecovery(logout);

  const loadTareas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTareasByBecario(becario.idBecario);
      setTareas(data);
      markRecovered();
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setError('Error al cargar las tareas del becario');
    } finally {
      setLoading(false);
    }
  }, [becario.idBecario, markRecovered]);

  const loadUltimosFichajes = useCallback(async () => {
    try {
      setLoadingFichajes(true);
      const response = await getFichajesByBecario(becario.idBecario, {
        page: 1,
        limit: ULTIMOS_FICHAJES_LIMIT,
      });
      if (response.success) {
        setUltimosFichajes(response.data);
      }
    } catch {
      setUltimosFichajes([]);
    } finally {
      setLoadingFichajes(false);
    }
  }, [becario.idBecario]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTareas();
      void loadUltimosFichajes();
    });
  }, [loadTareas, loadUltimosFichajes]);

  useEffect(() => {
    if (openStatusMenuId === null) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(`.${styles.statusDropdown}`)
      ) {
        return;
      }

      ignoreNextTaskClickRef.current = true;
      setOpenStatusMenuId(null);
      window.setTimeout(() => {
        ignoreNextTaskClickRef.current = false;
      }, 0);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [openStatusMenuId]);

  const handleCreateTarea = async (formData: CreateTareaData) => {
    // Si falla, la promesa llega al modal para mostrar el motivo al usuario.
    await createTarea(becario.idBecario, formData);
    setShowCreateForm(false);
    await loadTareas();
  };

  const handleUpdateTarea = async (idTarea: number, data: UpdateTareaData) => {
    try {
      await updateTarea(idTarea, data);
      await loadTareas();
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      throw err;
    }
  };

  const handleChangeEstado = async (
    idTarea: number,
    nuevoEstado: EstadoTarea
  ) => {
    setUpdatingTareaId(idTarea);
    setOpenStatusMenuId(null);
    try {
      await updateTarea(idTarea, { estado: nuevoEstado });
      await loadTareas();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    } finally {
      setUpdatingTareaId(null);
    }
  };

  const handleTaskKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    tarea: Tarea
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (openStatusMenuId !== null) {
        setOpenStatusMenuId(null);
        return;
      }
      setOpenStatusMenuId(null);
      setSelectedTarea(tarea);
    }
  };

  const handleDeleteTarea = async (idTarea: number) => {
    try {
      await deleteTarea(idTarea);
      await loadTareas();
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      throw err;
    }
  };

  async function handleUpdateBecario(data: UpdateBecarioData) {
    try {
      const becarioActualizado = await updateBecario(becario.idBecario, data);
      setUpdatedBecario(becarioActualizado);
      setShowEditModal(false);
    } catch (err) {
      console.error('Error al actualizar becario:', err);
      throw err;
    }
  }

  const getTipoFormacionLabel = (tipo: string | null) => {
    if (!tipo) return '—';
    const normalizedTipo = normalizeTipoFormacion(tipo);
    if (normalizedTipo === TIPO_FORMACION.UNIVERSITARIA) {
      return 'Grado Universitario';
    }
    if (normalizedTipo === TIPO_FORMACION.FORMACION_PROFESIONAL) {
      return 'Formación Profesional';
    }
    return tipo;
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatFechaCorta = (fecha: string | null) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatHora = (iso: string | null): string => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHoras = (horas: number | string | null): string => {
    if (horas === null || horas === undefined) return '--:--';
    const totalMinutes = Math.round(Number(horas) * 60);
    if (Number.isNaN(totalMinutes)) return '--:--';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0
      ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
      : `${hours}h`;
  };

  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const getInitials = (nombre?: string, apellidos?: string): string => {
    if (!nombre || !apellidos) return 'BC';
    return `${nombre[0]}${apellidos[0]}`.toUpperCase();
  };

  const getTipoTutorLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      [TIPO_TUTORIA.EMPRESA_PRINCIPAL]: 'Tutor Principal (Empresa)',
      [TIPO_TUTORIA.EMPRESA_SECUNDARIO]: 'Tutor Secundario (Empresa)',
      [TIPO_TUTORIA.ACADEMICO]: 'Tutor Académico',
    };

    return labels[tipo] || tipo || '—';
  };

  const getTutorHeaderLabel = (tipo: string): string =>
    tipo === TIPO_TUTORIA.ACADEMICO
      ? 'Tutor Académico Asignado'
      : 'Tutor de Empresa Asignado';

  const getTaskIcon = (estado: EstadoTarea): IconName => {
    if (estado === 'Completada') return 'check';
    if (estado === 'En_Progreso') return 'sync';
    return 'clock';
  };

  const fullName =
    `${currentBecario.nombre} ${currentBecario.apellidos}`.trim();
  const initials = getInitials(currentBecario.nombre, currentBecario.apellidos);
  const assignedTutors =
    (currentBecario as BecarioWithTutors).tutores?.length
      ? (currentBecario as BecarioWithTutors).tutores ?? []
      : [
          {
            nombre: user?.nombre,
            apellidos: user?.apellidos,
            email: user?.email,
            tipoTutor: currentBecario.tipoTutor,
            fechaAsignacion: currentBecario.fechaInicioPracticas,
          },
        ];

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Tutor de empresa"
        onLogout={logout}
      />

      <div className={styles.main}>
        <section className={styles.identityCard}>
          <div className={styles.identityLeft}>
            <div className={styles.profileAvatar}>{initials}</div>
            <div className={styles.identityText}>
              <h1>{fullName}</h1>
              <div className={styles.identityMeta}>
                <span>
                  <Icon name="school" /> Becario
                </span>
                <span>
                  <Icon name="mail" /> {currentBecario.email}
                </span>
                <span>
                  <Icon name="building" /> {currentBecario.practica || '—'}
                  {currentBecario.cliente ? ` - ${currentBecario.cliente}` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.identityActions}>
            <button
              onClick={() => setShowCreateForm(true)}
              className={styles.primaryAction}
            >
              <Icon name="addTask" />
              Asignar Tarea
            </button>
            {(user?.rol === ROLES.ADMIN ||
              user?.rol === ROLES.TUTOR_EMPRESA) &&
              onEvaluacion && (
                <button
                  onClick={onEvaluacion}
                  className={styles.secondaryAction}
                  title="Ver evaluaciones del becario"
                >
                  <Icon name="review" />
                  Evaluar
                </button>
              )}
          </div>
        </section>

        <section className={styles.dashboardGrid}>
          <article className={`${styles.panel} ${styles.tasksPanel}`}>
            <div className={styles.panelHeader}>
              <h2>
                <Icon name="tasks" />
                Tablón de Tareas
              </h2>
              <span className={styles.countBadge}>{tareas.length}</span>
            </div>

            <div className={styles.taskList}>
              {loading ? (
                <div className={styles.inlineState}>
                  <div className={styles.spinner}></div>
                  <p>Cargando tareas...</p>
                </div>
              ) : error ? (
                <div className={styles.inlineState}>
                  <p>{error}</p>
                  <ErrorRecoveryActions
                    hasRetried={hasRetried}
                    onRetry={() => retry(loadTareas)}
                    onResetSession={resetSession}
                  />
                </div>
              ) : tareas.length > 0 ? (
                tareas.map(tarea => (
                  <div
                    key={tarea.idTarea}
                    role="button"
                    tabIndex={0}
                    className={`${styles.taskItem} ${
                      openStatusMenuId === tarea.idTarea
                        ? styles.taskItemMenuOpen
                        : ''
                    }`}
                    onClick={() => {
                      if (
                        ignoreNextTaskClickRef.current ||
                        openStatusMenuId !== null
                      ) {
                        ignoreNextTaskClickRef.current = false;
                        setOpenStatusMenuId(null);
                        return;
                      }

                      setOpenStatusMenuId(null);
                      setSelectedTarea(tarea);
                    }}
                    onKeyDown={event => handleTaskKeyDown(event, tarea)}
                  >
                    <div className={styles.taskItemHeader}>
                      <h3>{tarea.nombreTarea}</h3>
                      <Icon
                        name={getTaskIcon(tarea.estado)}
                        className={styles.taskStateIcon}
                      />
                    </div>
                    {tarea.descripcion && <p>{tarea.descripcion}</p>}
                    <div className={styles.taskFooter}>
                      <span className={styles.taskDate}>
                        <Icon name="calendar" />
                        Fecha límite:{' '}
                        {formatFecha(
                          tarea.fechaFinEstimada || tarea.fechaInicio
                        )}
                      </span>
                      <div
                        className={styles.statusDropdown}
                        onClick={event => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={updatingTareaId === tarea.idTarea}
                          className={`${styles.statusTrigger} ${
                            styles[`taskStatus${tarea.estado}`]
                          }`}
                          onClick={() =>
                            setOpenStatusMenuId(current =>
                              current === tarea.idTarea ? null : tarea.idTarea
                            )
                          }
                          aria-label={`Cambiar estado de ${tarea.nombreTarea}`}
                          aria-expanded={openStatusMenuId === tarea.idTarea}
                          aria-haspopup="menu"
                        >
                          {updatingTareaId === tarea.idTarea
                            ? 'Actualizando...'
                            : ESTADO_LABELS[tarea.estado]}
                          <Icon
                            name="chevronDown"
                            className={styles.statusChevron}
                          />
                        </button>

                        {openStatusMenuId === tarea.idTarea && (
                          <div className={styles.statusMenu} role="menu">
                            {ESTADO_OPTIONS.map(option => (
                              <button
                                key={option}
                                type="button"
                                role="menuitem"
                                className={`${styles.statusOption} ${
                                  option === tarea.estado
                                    ? styles.statusOptionActive
                                    : ''
                                }`}
                                onClick={() => {
                                  if (option !== tarea.estado) {
                                    void handleChangeEstado(
                                      tarea.idTarea,
                                      option
                                    );
                                  } else {
                                    setOpenStatusMenuId(null);
                                  }
                                }}
                              >
                                <span
                                  className={`${styles.statusDot} ${
                                    styles[`statusDot${option}`]
                                  }`}
                                />
                                {ESTADO_LABELS[option]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.inlineState}>
                  No hay tareas asignadas todavía
                </div>
              )}
            </div>
          </article>

          <article className={`${styles.panel} ${styles.clockPanel}`}>
            <div className={styles.panelHeader}>
              <h2>
                <Icon name="clock" />
                Últimos Fichajes
              </h2>
              <button
                className={styles.historyButton}
                onClick={() => setShowFichajeHistorial(true)}
              >
                <Icon name="history" />
                Historial
              </button>
            </div>

            {loadingFichajes ? (
              <div className={styles.inlineState}>Cargando registros...</div>
            ) : ultimosFichajes.length > 0 ? (
              <div className={styles.clockTableWrapper}>
                <table className={styles.clockTable}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th>Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosFichajes.map(fichaje => (
                      <tr key={fichaje.idFichaje}>
                        <td>
                          {isToday(fichaje.fecha)
                            ? 'Hoy'
                            : formatFechaCorta(fichaje.fecha)}
                        </td>
                        <td>
                          <span className={styles.timeBadgeSuccess}>
                            {formatHora(fichaje.horaEntrada)}
                          </span>
                        </td>
                        <td>
                          <span className={styles.timeBadge}>
                            {formatHora(fichaje.horaSalida)}
                          </span>
                        </td>
                        <td>{formatHoras(fichaje.horasImputadas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.inlineState}>
                No hay fichajes registrados aún
              </div>
            )}
          </article>
        </section>

        <section className={styles.tabsPanel}>
          <div
            className={styles.tabsHeader}
            role="tablist"
            aria-label="Datos del becario"
          >
            <button
              className={
                activeTab === 'corporativo' ? styles.tabActive : styles.tab
              }
              onClick={() => setActiveTab('corporativo')}
              role="tab"
              aria-selected={activeTab === 'corporativo'}
            >
              <Icon name="building" />
              Corporativo
            </button>
            <button
              className={
                activeTab === 'personal' ? styles.tabActive : styles.tab
              }
              onClick={() => setActiveTab('personal')}
              role="tab"
              aria-selected={activeTab === 'personal'}
            >
              <Icon name="person" />
              Personal
            </button>
            <button
              className={
                activeTab === 'academico' ? styles.tabActive : styles.tab
              }
              onClick={() => setActiveTab('academico')}
              role="tab"
              aria-selected={activeTab === 'academico'}
            >
              <Icon name="school" />
              Académico
            </button>
            <button
              className={styles.editDataButton}
              onClick={() => setShowEditModal(true)}
            >
              <Icon name="edit" />
              Modificar
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'corporativo' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="briefcase" /> Práctica
                  </span>
                  <strong>{currentBecario.practica || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="hand" /> Cliente
                  </span>
                  <strong>{currentBecario.cliente || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="clock" /> Horas de Contrato
                  </span>
                  <strong>{currentBecario.horasContrato}h</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="money" /> Ayuda economica
                  </span>
                  <strong>{currentBecario.ayudaEconomica ?? '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="briefcase" /> Equipo en uso
                  </span>
                  <strong>{currentBecario.equipoEnUso || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="calendar" /> Fecha de Incorporación
                  </span>
                  <strong>
                    {formatFechaCorta(currentBecario.fechaInicioPracticas)}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="calendar" /> Fecha de Fin
                  </span>
                  <strong>
                    {formatFechaCorta(currentBecario.fechaFinPracticas)}
                  </strong>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="mail" /> Email empresa
                  </span>
                  <strong>{currentBecario.email}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="phone" /> Teléfono
                  </span>
                  <strong>{currentBecario.telefonoPersonal || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="mail" /> Email personal
                  </span>
                  <strong>{currentBecario.emailPersonal || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="link" /> LinkedIn
                  </span>
                  <strong>
                    {currentBecario.linkedin ? (
                      <a
                        href={currentBecario.linkedin}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver perfil
                      </a>
                    ) : (
                      '—'
                    )}
                  </strong>
                </div>
              </div>
            )}

            {activeTab === 'academico' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="school" /> Tipo
                  </span>
                  <strong>
                    {getTipoFormacionLabel(currentBecario.tipoFormacion)}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="tasks" /> Estudios
                  </span>
                  <strong>
                    {currentBecario.nombreGradoUniversitario ||
                      currentBecario.nombreFormacionProfesional ||
                      '—'}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="building" /> Centro
                  </span>
                  <strong>{currentBecario.centroEstudios || '—'}</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles.tutorsGrid}>
          {assignedTutors.map((tutor, index) => {
            const tutorName =
              `${tutor.nombre ?? ''} ${tutor.apellidos ?? ''}`.trim() || '—';
            const tutorEmail = tutor.email;

            return (
              <article
                className={styles.tutorCard}
                key={tutor.idTutor ?? `${tutorEmail ?? 'tutor'}-${index}`}
              >
                <div className={styles.tutorHeaderBar}>
                  <Icon name="group" />
                  <h2>{getTutorHeaderLabel(tutor.tipoTutor)}</h2>
                </div>
                <div className={styles.tutorBody}>
                  <div className={styles.tutorIdentity}>
                    <span className={styles.tutorAvatar}>
                      {getInitials(tutor.nombre, tutor.apellidos)}
                    </span>
                    <h3>{tutorName}</h3>
                  </div>
                  <dl className={styles.tutorDetails}>
                    <div>
                      <dt>Tipo:</dt>
                      <dd>{getTipoTutorLabel(tutor.tipoTutor)}</dd>
                    </div>
                    <div>
                      <dt>Email:</dt>
                      <dd>
                        {tutorEmail ? (
                          <a href={`mailto:${tutorEmail}`}>{tutorEmail}</a>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Asignado desde:</dt>
                      <dd>{formatFecha(tutor.fechaAsignacion ?? null)}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {showCreateForm && (
        <TaskCreateModal
          onSubmit={handleCreateTarea}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {showEditModal && (
        <BecarioEditModal
          becario={currentBecario}
          onSave={handleUpdateBecario}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      <BecarioFichajeHistorial
        isOpen={showFichajeHistorial}
        onClose={() => setShowFichajeHistorial(false)}
        idBecario={becario.idBecario}
        nombreBecario={`${currentBecario.nombre} ${currentBecario.apellidos}`}
      />

      {selectedTarea && (
        <TareaDetailModal
          tarea={selectedTarea}
          userRole={ROLES.TUTOR_EMPRESA}
          onClose={() => setSelectedTarea(null)}
          onUpdate={handleUpdateTarea}
          onDelete={handleDeleteTarea}
        />
      )}
    </div>
  );
};

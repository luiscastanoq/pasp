import { useCallback, useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { becarioService } from '../services/becarioService';
import { fichajeService } from '../../fichajes/services/fichajeService';
import type {
  BecarioProfile as BecarioProfileType,
  UpdateBecarioProfileData,
} from '../services/becarioService';
import type { Tarea, EstadoTarea } from '../../../types/tarea';
import type {
  FichajeActivo,
  FichajeHistorialEntry,
} from '../../../types/fichaje';
import { ApiError, getToken } from '../../../shared/api/api';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import { ErrorRecoveryActions } from '../../../shared/components/ErrorRecoveryActions';
import { TareaDetailModal } from '../../../shared/components/TareaDetailModal';
import { useErrorRecovery } from '../../auth/hooks/useErrorRecovery';
import { FichajeModal } from '../components/sections/fichaje/FichajeModal';
import { FichajeHistorial } from '../components/sections/fichaje/FichajeHistorial';
import {
  normalizeTipoFormacion,
  TIPO_FORMACION,
  TIPO_TUTORIA,
} from '../../../shared/constants/domain.constants';
import styles from './BecarioProfile.module.css';

type ProfileTab = 'corporativo' | 'personal' | 'academico';

type IconName =
  | 'home'
  | 'school'
  | 'mail'
  | 'building'
  | 'hand'
  | 'clockCheck'
  | 'history'
  | 'tasks'
  | 'clock'
  | 'calendar'
  | 'check'
  | 'sync'
  | 'person'
  | 'group'
  | 'money'
  | 'briefcase'
  | 'phone'
  | 'link'
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
    case 'home':
      return (
        <svg {...commonProps}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
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
    case 'hand':
      return (
        <svg {...commonProps}>
          <path d="M8 13V6a2 2 0 1 1 4 0v5" />
          <path d="M12 11V5a2 2 0 1 1 4 0v8" />
          <path d="M16 13V8a2 2 0 1 1 4 0v5c0 5-3 8-8 8h-1a7 7 0 0 1-7-7v-2a2 2 0 1 1 4 0v1" />
        </svg>
      );
    case 'clockCheck':
      return (
        <svg {...commonProps}>
          <rect width="16" height="18" x="4" y="3" rx="2" />
          <path d="M9 3v4h6V3" />
          <path d="m8 14 2.25 2.25L16 10.5" />
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
    case 'tasks':
      return (
        <svg {...commonProps}>
          <path d="M9 11 11 13 15 9" />
          <path d="M20 6 9 17l-5-5" />
          <rect width="18" height="18" x="3" y="3" rx="2" />
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
    case 'group':
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a4 4 0 0 1 0 7.8" />
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

export const BecarioProfile = () => {
  const { logout } = useAuth();
  const { hasRetried, retry, markRecovered, resetSession } =
    useErrorRecovery(logout);

  // ── Estado principal ──────────────────────────────────────────
  const [profile, setProfile] = useState<BecarioProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Estado de tareas ──────────────────────────────────────────
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(true);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [updatingTareaId, setUpdatingTareaId] = useState<number | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);
  const ignoreNextTaskClickRef = useRef(false);

  // ── Estado de fichaje ─────────────────────────────────────────
  const [showFichajeModal, setShowFichajeModal] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [fichajeActivo, setFichajeActivo] = useState<FichajeActivo | null>(
    null
  );
  const [loadingFichaje, setLoadingFichaje] = useState(false);
  const [ultimosFichajes, setUltimosFichajes] = useState<
    FichajeHistorialEntry[]
  >([]);
  const [loadingUltimos, setLoadingUltimos] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('corporativo');

  // ── Estado del formulario de contacto ─────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateBecarioProfileData>({
    telefonoPersonal: '',
    emailPersonal: '',
    linkedin: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    telefonoPersonal?: string;
    emailPersonal?: string;
    linkedin?: string;
  }>({});
  // ── Loaders ───────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await becarioService.getMyProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          telefonoPersonal: response.data.contacto.telefonoPersonal || '',
          emailPersonal: response.data.contacto.emailPersonal || '',
          linkedin: response.data.contacto.linkedin || '',
        });
        markRecovered();
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al cargar el perfil.'
      );
      console.error('Error al cargar perfil:', err);
    } finally {
      setIsLoading(false);
    }
  }, [markRecovered]);

  const loadTareas = async () => {
    try {
      setLoadingTareas(true);
      const response = await becarioService.getMyTareas();
      if (response.success) setTareas(response.data);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
    } finally {
      setLoadingTareas(false);
    }
  };

  const loadFichajeActivo = async () => {
    try {
      setLoadingFichaje(true);
      const response = await fichajeService.getFichajeActivo();
      setFichajeActivo(
        response.success && response.data ? response.data : null
      );
    } catch (err) {
      console.error('Error al cargar fichaje activo:', err);
      setFichajeActivo(null);
    } finally {
      setLoadingFichaje(false);
    }
  };

  const loadUltimosFichajes = useCallback(async () => {
    if (!getToken()) {
      setLoadingUltimos(false);
      return;
    }

    try {
      setLoadingUltimos(true);
      const response = await fichajeService.getHistorialFichajes({
        page: 1,
        limit: ULTIMOS_FICHAJES_LIMIT,
      });
      if (response.success) {
        setUltimosFichajes(response.data.fichajes);
      }
    } catch {
      setUltimosFichajes([]);
    } finally {
      setLoadingUltimos(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
      void loadTareas();
      void loadFichajeActivo();
      void loadUltimosFichajes();
    });
  }, [loadProfile, loadUltimosFichajes]);

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

  // ── Handlers de fichaje ───────────────────────────────────────
  const handleOpenFichajeModal = async () => {
    await loadFichajeActivo();
    setShowFichajeModal(true);
  };

  const handleFichajeCompleted = async () => {
    await loadFichajeActivo();
    await loadUltimosFichajes();
  };

  // ── Handlers de tareas ────────────────────────────────────────
  const handleUpdateEstadoTarea = async (
    idTarea: number,
    estado: EstadoTarea
  ) => {
    setUpdatingTareaId(idTarea);
    setOpenStatusMenuId(null);
    try {
      await becarioService.updateTareaEstado(idTarea, estado);
      const fechaCompletada =
        estado === 'Completada' ? new Date().toISOString().split('T')[0] : null;
      setTareas(prev =>
        prev.map(t =>
          t.idTarea === idTarea ? { ...t, estado, fechaCompletada } : t
        )
      );
    } catch (err) {
      console.error('Error al actualizar estado de tarea:', err);
    } finally {
      setUpdatingTareaId(null);
    }
  };

  const handleTaskKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    tarea: Tarea
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (openStatusMenuId !== null) {
        setOpenStatusMenuId(null);
        return;
      }
      setSelectedTarea(tarea);
    }
  };

  // ── Handlers de contacto ──────────────────────────────────────
  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage(null);
    setValidationErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValidationErrors({});
    if (profile) {
      setFormData({
        telefonoPersonal: profile.contacto.telefonoPersonal || '',
        emailPersonal: profile.contacto.emailPersonal || '',
        linkedin: profile.contacto.linkedin || '',
      });
    }
  };

  const handleInputChange = (
    field: keyof UpdateBecarioProfileData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    if (formData.emailPersonal?.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailPersonal)) {
        errors.emailPersonal = 'Email inválido';
      }
    }
    if (formData.telefonoPersonal?.trim()) {
      if (!/^[+]?[\d\s()-]+$/.test(formData.telefonoPersonal)) {
        errors.telefonoPersonal =
          'Teléfono inválido (solo números, espacios, +, -, ( ))';
      }
    }
    if (formData.linkedin?.trim()) {
      if (
        !/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i.test(
          formData.linkedin
        )
      ) {
        errors.linkedin =
          'URL de LinkedIn inválida (ej: https://linkedin.com/in/usuario)';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setIsSaving(true);
      setError(null);
      const response = await becarioService.updateMyProfile({
        telefonoPersonal: formData.telefonoPersonal?.trim() || null,
        emailPersonal: formData.emailPersonal?.trim() || null,
        linkedin: formData.linkedin?.trim() || null,
      });
      if (response.success) {
        await loadProfile();
        setIsEditing(false);
        setSuccessMessage('Perfil actualizado correctamente');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Error al actualizar el perfil.'
      );
      console.error('Error al actualizar perfil:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTipoFormacionLabel = (tipo: string | null): string => {
    if (!tipo) return 'No especificado';
    const normalizedTipo = normalizeTipoFormacion(tipo);
    if (normalizedTipo === TIPO_FORMACION.UNIVERSITARIA) {
      return 'Grado Universitario';
    }
    if (normalizedTipo === TIPO_FORMACION.FORMACION_PROFESIONAL) {
      return 'Formación Profesional';
    }
    return tipo;
  };

  const formatShortDate = (dateString: string | null): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-ES', {
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

  const getTaskIcon = (estado: EstadoTarea): IconName => {
    if (estado === 'Completada') return 'check';
    if (estado === 'En_Progreso') return 'sync';
    return 'clock';
  };

  const getFichajeStatus = (): { label: string; tone: 'success' | 'muted' } => {
    if (loadingFichaje) return { label: 'Cargando', tone: 'muted' };
    if (fichajeActivo && !fichajeActivo.horaSalida) {
      return { label: 'Trabajando', tone: 'success' };
    }
    return { label: 'Sin fichaje activo', tone: 'muted' };
  };

  const getTipoTutorLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      [TIPO_TUTORIA.EMPRESA_PRINCIPAL]: 'Tutor Principal (Empresa)',
      [TIPO_TUTORIA.EMPRESA_SECUNDARIO]: 'Tutor Secundario (Empresa)',
      [TIPO_TUTORIA.ACADEMICO]: 'Tutor Académico',
    };
    return labels[tipo] || tipo;
  };

  const getTutorHeaderLabel = (tipo: string): string =>
    tipo === TIPO_TUTORIA.ACADEMICO
      ? 'Tutor Académico Asignado'
      : 'Tutor de Empresa Asignado';

  const fullName =
    `${profile?.usuario.nombre ?? ''} ${profile?.usuario.apellidos ?? ''}`.trim();
  const initials = getInitials(
    profile?.usuario.nombre,
    profile?.usuario.apellidos
  );
  const fichajeStatus = getFichajeStatus();

  // ── Estados de carga / error ──────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <ErrorRecoveryActions
            hasRetried={hasRetried}
            onRetry={() => retry(loadProfile)}
            onResetSession={resetSession}
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>No se pudo cargar el perfil</p>
        </div>
      </div>
    );
  }

  // ── Renderizado ───────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <Header
        nombre={profile.usuario.nombre}
        apellidos={profile.usuario.apellidos}
        rolLabel="Becario"
        onLogout={logout}
      />

      <div className={styles.main}>
        {successMessage && (
          <div className={styles.successMessage}>
            <strong>{successMessage}</strong>
          </div>
        )}
        {error && (
          <div className={styles.errorMessage}>
            <strong>{error}</strong>
          </div>
        )}

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
                  <Icon name="mail" /> {profile.usuario.email}
                </span>
                <span>
                  <Icon name="building" /> {profile.corporativo.practica || '—'}
                  {profile.corporativo.cliente
                    ? ` - ${profile.corporativo.cliente}`
                    : ''}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.identityActions}>
            <div className={styles.actionRow}>
              <button
                className={styles.primaryAction}
                onClick={handleOpenFichajeModal}
                disabled={loadingFichaje}
              >
                <Icon name="clockCheck" />
                {loadingFichaje ? 'Cargando...' : 'Fichar'}
              </button>
              <button
                className={styles.secondaryAction}
                onClick={() => setShowHistorial(true)}
              >
                <Icon name="history" />
                Ver Historial
              </button>
            </div>
            <div className={styles.statusBox}>
              <span>Estado actual:</span>
              <strong className={styles[fichajeStatus.tone]}>
                <span className={styles.statusDot} />
                {fichajeStatus.label}
              </strong>
            </div>
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
              {loadingTareas ? (
                <div className={styles.inlineState}>Cargando tareas...</div>
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
                        {formatDate(
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
                                    void handleUpdateEstadoTarea(
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
                  No tienes tareas asignadas todavía
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
            </div>
            {loadingUltimos ? (
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
                            : formatShortDate(fichaje.fecha)}
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
            aria-label="Datos del perfil"
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
            {activeTab === 'personal' && !isEditing && (
              <button className={styles.editDataButton} onClick={handleEdit}>
                <Icon name="edit" />
                Editar
              </button>
            )}
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'corporativo' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="briefcase" /> Práctica
                  </span>
                  <strong>{profile.corporativo.practica || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="hand" /> Cliente
                  </span>
                  <strong>{profile.corporativo.cliente || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="clock" /> Horas de Contrato
                  </span>
                  <strong>{profile.practicas.horasContrato}h</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="money" /> Ayuda economica
                  </span>
                  <strong>{profile.practicas.ayudaEconomica ?? '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="briefcase" /> Equipo en uso
                  </span>
                  <strong>{profile.practicas.equipoEnUso || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="calendar" /> Fecha de Incorporación
                  </span>
                  <strong>
                    {formatShortDate(profile.practicas.fechaInicioPracticas)}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="calendar" /> Fecha de Fin
                  </span>
                  <strong>
                    {formatShortDate(profile.practicas.fechaFinPracticas)}
                  </strong>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className={styles.personalContent}>
                {isEditing ? (
                  <div className={styles.editGrid}>
                    <label className={styles.field}>
                      <span>Teléfono personal</span>
                      <input
                        value={formData.telefonoPersonal || ''}
                        onChange={event =>
                          handleInputChange(
                            'telefonoPersonal',
                            event.target.value
                          )
                        }
                        disabled={isSaving}
                        placeholder="+34 600 123 456"
                      />
                      {validationErrors.telefonoPersonal && (
                        <small>{validationErrors.telefonoPersonal}</small>
                      )}
                    </label>
                    <label className={styles.field}>
                      <span>Email personal</span>
                      <input
                        type="email"
                        value={formData.emailPersonal || ''}
                        onChange={event =>
                          handleInputChange('emailPersonal', event.target.value)
                        }
                        disabled={isSaving}
                        placeholder="nombre@email.com"
                      />
                      {validationErrors.emailPersonal && (
                        <small>{validationErrors.emailPersonal}</small>
                      )}
                    </label>
                    <label className={styles.field}>
                      <span>LinkedIn</span>
                      <input
                        type="url"
                        value={formData.linkedin || ''}
                        onChange={event =>
                          handleInputChange('linkedin', event.target.value)
                        }
                        disabled={isSaving}
                        placeholder="https://linkedin.com/in/perfil"
                      />
                      {validationErrors.linkedin && (
                        <small>{validationErrors.linkedin}</small>
                      )}
                    </label>
                    <div className={styles.formActions}>
                      <button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button onClick={handleCancel} disabled={isSaving}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span>
                        <Icon name="mail" /> Email empresa
                      </span>
                      <strong>{profile.usuario.email}</strong>
                    </div>
                    <div className={styles.infoItem}>
                      <span>
                        <Icon name="phone" /> Teléfono personal
                      </span>
                      <strong>
                        {profile.contacto.telefonoPersonal || '—'}
                      </strong>
                    </div>
                    <div className={styles.infoItem}>
                      <span>
                        <Icon name="mail" /> Email personal
                      </span>
                      <strong>{profile.contacto.emailPersonal || '—'}</strong>
                    </div>
                    <div className={styles.infoItem}>
                      <span>
                        <Icon name="link" /> LinkedIn
                      </span>
                      <strong>
                        {profile.contacto.linkedin ? (
                          <a
                            href={profile.contacto.linkedin}
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
              </div>
            )}

            {activeTab === 'academico' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="school" /> Tipo de formación
                  </span>
                  <strong>
                    {getTipoFormacionLabel(profile.academico.tipoFormacion)}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="tasks" /> Estudios
                  </span>
                  <strong>
                    {profile.academico.nombreGradoUniversitario ||
                      profile.academico.nombreFormacionProfesional ||
                      '—'}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="building" /> Centro de estudios
                  </span>
                  <strong>{profile.academico.centroEstudios || '—'}</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={styles.tutorsGrid}>
          {profile.tutores.length > 0 ? (
            profile.tutores.map(tutor => (
              <article className={styles.tutorCard} key={tutor.idTutor}>
                <div className={styles.tutorHeaderBar}>
                  <Icon name="group" />
                  <h2>{getTutorHeaderLabel(tutor.tipoTutor)}</h2>
                </div>
                <div className={styles.tutorBody}>
                  <div className={styles.tutorIdentity}>
                    <span className={styles.tutorAvatar}>
                      {getInitials(tutor.nombre, tutor.apellidos)}
                    </span>
                    <h3>
                      {tutor.nombre} {tutor.apellidos}
                    </h3>
                  </div>
                  <dl className={styles.tutorDetails}>
                    <div>
                      <dt>Tipo:</dt>
                      <dd>{getTipoTutorLabel(tutor.tipoTutor)}</dd>
                    </div>
                    <div>
                      <dt>Email:</dt>
                      <dd>
                        <a href={`mailto:${tutor.email}`}>{tutor.email}</a>
                      </dd>
                    </div>
                    <div>
                      <dt>Asignado desde:</dt>
                      <dd>{formatDate(tutor.fechaAsignacion)}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            ))
          ) : (
            <article className={styles.panel}>
              <div className={styles.inlineState}>
                No tienes tutores asignados
              </div>
            </article>
          )}
        </section>
      </div>

      {selectedTarea && (
        <TareaDetailModal
          tarea={selectedTarea}
          onClose={() => setSelectedTarea(null)}
        />
      )}

      <FichajeModal
        isOpen={showFichajeModal}
        onClose={() => setShowFichajeModal(false)}
        fichajeActivo={fichajeActivo}
        onFichajeCompleted={handleFichajeCompleted}
      />

      <FichajeHistorial
        isOpen={showHistorial}
        onClose={() => setShowHistorial(false)}
      />
    </div>
  );
};

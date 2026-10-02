import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import { ErrorRecoveryActions } from '../../../shared/components/ErrorRecoveryActions';
import { ROLES } from '../../../shared/constants/domain.constants';
import { useErrorRecovery } from '../../auth/hooks/useErrorRecovery';
import type { RolUsuario } from '../../../shared/constants/domain.constants';
import { getUsersStats } from '../services/adminService';
import usuariosService from '../services/usuariosService';
import type { UsersStats } from '../services/adminService';
import type { UsuarioAdmin } from '../services/usuariosService';
import styles from './AdminDashboard.module.css';

type ActiveFilters = {
  searchText: string;
  filterRol: string;
  filterEstado: string;
  filterPrimerAcceso: string;
};

type IconName =
  | 'users'
  | 'check'
  | 'cancel'
  | 'pending'
  | 'search'
  | 'filter'
  | 'add'
  | 'edit'
  | 'personOff'
  | 'personCheck'
  | 'trash'
  | 'chevronLeft'
  | 'chevronRight';

const PAGE_SIZE = 8;

const INITIAL_FILTERS: ActiveFilters = {
  searchText: '',
  filterRol: 'todos',
  filterEstado: 'todos',
  filterPrimerAcceso: 'todos',
};

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
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );
    case 'cancel':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      );
    case 'pending':
      return (
        <svg {...common}>
          <path d="M8 3h8v4a4 4 0 0 1-8 0V3Z" />
          <path d="M8 21h8v-4a4 4 0 0 0-8 0v4Z" />
          <path d="M6 3h12" />
          <path d="M6 21h12" />
          <path d="M15 13h4" />
          <path d="M17 11v4" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
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

const formatNumber = (value: number | null) =>
  value === null ? '...' : new Intl.NumberFormat('es-ES').format(value);

const getInitials = (usuario: UsuarioAdmin) =>
  `${usuario.nombre.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase();

const getRolLabel = (rol: RolUsuario) => {
  switch (rol) {
    case ROLES.BECARIO:
      return 'Becario';
    case ROLES.TUTOR_EMPRESA:
      return 'Tutor de empresa';
    case ROLES.TUTOR_ACADEMICO:
      return 'Tutor académico';
    case ROLES.ADMIN:
      return 'Administrador';
    default:
      return rol;
  }
};

const getEditPath = (usuario: UsuarioAdmin) => {
  switch (usuario.rol) {
    case ROLES.ADMIN:
      return `/admin/usuario/${usuario.idUsuario}/editar`;
    case ROLES.TUTOR_ACADEMICO:
      return `/admin/editar-tutor-academico/${usuario.idUsuario}`;
    case ROLES.TUTOR_EMPRESA:
      return `/admin/editar-tutor-empresa/${usuario.idUsuario}`;
    case ROLES.BECARIO:
      return `/admin/editar-becario/${usuario.idUsuario}`;
    default:
      return null;
  }
};

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { hasRetried, retry, markRecovered, resetSession } =
    useErrorRecovery(logout);
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActiveFilters>(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const data = await getUsersStats();
      setStats(data);
      setStatsError(false);
    } catch {
      setStatsError(true);
    }
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoadingUsuarios(true);
      setErrorUsuarios(null);
      const data = await usuariosService.getAllUsuarios();
      setUsuarios(data);
      markRecovered();
    } catch (error: unknown) {
      console.error('Error al cargar usuarios:', error);
      setErrorUsuarios(
        error instanceof Error
          ? error.message
          : 'Error al cargar la lista de usuarios'
      );
    } finally {
      setLoadingUsuarios(false);
    }
  }, [markRecovered]);

  useEffect(() => {
    void cargarUsuarios();
  }, [cargarUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const { searchText, filterRol, filterEstado, filterPrimerAcceso } = filters;
    let resultado = [...usuarios];

    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      resultado = resultado.filter(
        usuario =>
          usuario.nombre.toLowerCase().includes(searchLower) ||
          usuario.apellidos.toLowerCase().includes(searchLower) ||
          usuario.email.toLowerCase().includes(searchLower)
      );
    }

    if (filterRol !== 'todos') {
      resultado = resultado.filter(usuario => usuario.rol === filterRol);
    }

    if (filterEstado !== 'todos') {
      const estadoActivo = filterEstado === 'Activo';
      resultado = resultado.filter(usuario => usuario.activo === estadoActivo);
    }

    if (filterPrimerAcceso !== 'todos') {
      const esPendiente = filterPrimerAcceso === 'Pendiente';
      resultado = resultado.filter(
        usuario => usuario.primerAcceso === esPendiente
      );
    }

    return resultado;
  }, [usuarios, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / PAGE_SIZE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const usuariosPaginados = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return usuariosFiltrados.slice(startIndex, startIndex + PAGE_SIZE);
  }, [usuariosFiltrados, safeCurrentPage]);

  const hasActiveFilters =
    filters.searchText.trim() !== '' ||
    filters.filterRol !== 'todos' ||
    filters.filterEstado !== 'todos' ||
    filters.filterPrimerAcceso !== 'todos';

  const updateFilter = <K extends keyof ActiveFilters>(
    key: K,
    value: ActiveFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToEdit = (usuario: UsuarioAdmin) => {
    const editPath = getEditPath(usuario);
    if (editPath) {
      navigate(editPath);
    }
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    usuario: UsuarioAdmin
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToEdit(usuario);
    }
  };

  const handleToggleEstado = async (
    event: MouseEvent<HTMLButtonElement>,
    usuario: UsuarioAdmin
  ) => {
    event.stopPropagation();
    setActionError(null);
    setActionUserId(usuario.idUsuario);

    try {
      const updatedUsuario = await usuariosService.toggleEstadoUsuario(
        usuario.idUsuario
      );
      setUsuarios(prev =>
        prev.map(current =>
          current.idUsuario === usuario.idUsuario
            ? {
                ...current,
                activo: updatedUsuario.activo,
                primerAcceso: updatedUsuario.primerAcceso,
              }
            : current
        )
      );
      await refreshStats();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado del usuario'
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteUsuario = async (
    event: MouseEvent<HTMLButtonElement>,
    usuario: UsuarioAdmin
  ) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${usuario.nombre} ${usuario.apellidos}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setActionUserId(usuario.idUsuario);

    try {
      await usuariosService.deleteUsuario(usuario.idUsuario);
      setUsuarios(prev =>
        prev.filter(current => current.idUsuario !== usuario.idUsuario)
      );
      await refreshStats();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : 'No se pudo eliminar el usuario'
      );
    } finally {
      setActionUserId(null);
    }
  };

  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 3) },
    (_, i) => i + 1
  );

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Administrador"
        onLogout={logout}
      />

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <h1>Panel de Administrador</h1>
          <p>Resumen y gestión de usuarios del sistema</p>
        </section>

        <section className={styles.kpiGrid} aria-label="KPIs de usuarios">
          {statsError ? (
            <p className={styles.kpiError}>
              No se pudieron cargar las estadísticas.
            </p>
          ) : (
            <>
              <article className={styles.kpiCard}>
                <span className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}>
                  <Icon name="users" />
                </span>
                <span className={styles.kpiLabel}>Total de usuarios</span>
                <strong>{formatNumber(stats?.totalUsuarios ?? null)}</strong>
              </article>
              <article className={styles.kpiCard}>
                <span className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
                  <Icon name="check" />
                </span>
                <span className={styles.kpiLabel}>Activos</span>
                <strong>{formatNumber(stats?.usuariosActivos ?? null)}</strong>
              </article>
              <article className={styles.kpiCard}>
                <span className={`${styles.kpiIcon} ${styles.kpiIconRed}`}>
                  <Icon name="cancel" />
                </span>
                <span className={styles.kpiLabel}>Inactivos</span>
                <strong>
                  {formatNumber(stats?.usuariosInactivos ?? null)}
                </strong>
              </article>
              <article className={styles.kpiCard}>
                <span className={`${styles.kpiIcon} ${styles.kpiIconYellow}`}>
                  <Icon name="pending" />
                </span>
                <span className={styles.kpiLabel}>Pendientes</span>
                <strong>
                  {formatNumber(stats?.pendientesPrimerAcceso ?? null)}
                </strong>
              </article>
            </>
          )}
        </section>

        <section className={styles.tablePanel}>
          {errorUsuarios ? (
            <div className={styles.tableError}>
              <p>{errorUsuarios}</p>
              <ErrorRecoveryActions
                hasRetried={hasRetried}
                onRetry={() => retry(cargarUsuarios)}
                onResetSession={resetSession}
              />
            </div>
          ) : (
            <>
              <div className={styles.toolbar}>
                <label className={styles.searchBox}>
                  <Icon name="search" />
                  <input
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={filters.searchText}
                    onChange={event =>
                      updateFilter('searchText', event.target.value)
                    }
                    aria-label="Buscar usuarios por nombre, apellidos o email"
                  />
                </label>

                <div className={styles.toolbarActions}>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={clearFilters}
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.filterButton}
                    onClick={() => setShowFilters(prev => !prev)}
                  >
                    <Icon name="filter" />
                    Filtros
                  </button>
                  <button
                    type="button"
                    className={styles.createButton}
                    onClick={() => navigate('/admin/nuevo-usuario')}
                  >
                    <Icon name="add" />
                    Crear usuario
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className={styles.filtersPanel}>
                  <select
                    value={filters.filterRol}
                    onChange={event =>
                      updateFilter('filterRol', event.target.value)
                    }
                    aria-label="Filtrar por rol"
                  >
                    <option value="todos">Todos los roles</option>
                    <option value={ROLES.BECARIO}>Becario</option>
                    <option value={ROLES.TUTOR_EMPRESA}>
                      Tutor de empresa
                    </option>
                    <option value={ROLES.TUTOR_ACADEMICO}>
                      Tutor académico
                    </option>
                    <option value={ROLES.ADMIN}>Administrador</option>
                  </select>
                  <select
                    value={filters.filterEstado}
                    onChange={event =>
                      updateFilter('filterEstado', event.target.value)
                    }
                    aria-label="Filtrar por estado"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Deshabilitado</option>
                  </select>
                  <select
                    value={filters.filterPrimerAcceso}
                    onChange={event =>
                      updateFilter('filterPrimerAcceso', event.target.value)
                    }
                    aria-label="Filtrar por primer acceso"
                  >
                    <option value="todos">Primer acceso</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
              )}

              {actionError && (
                <div className={styles.actionError} role="alert">
                  {actionError}
                </div>
              )}

              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Primer acceso</th>
                      <th>Cliente</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsuarios ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : usuariosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                          No hay usuarios registrados
                        </td>
                      </tr>
                    ) : (
                      usuariosPaginados.map(usuario => {
                        const editPath = getEditPath(usuario);
                        const actionInProgress =
                          actionUserId === usuario.idUsuario;
                        return (
                          <tr
                            key={usuario.idUsuario}
                            className={
                              editPath ? styles.clickableRow : undefined
                            }
                            tabIndex={editPath ? 0 : undefined}
                            role={editPath ? 'link' : undefined}
                            aria-label={
                              editPath
                                ? `Editar ${usuario.nombre} ${usuario.apellidos}`
                                : undefined
                            }
                            onClick={() => navigateToEdit(usuario)}
                            onKeyDown={event =>
                              handleRowKeyDown(event, usuario)
                            }
                          >
                            <td>
                              <div className={styles.userCell}>
                                <span className={styles.avatar}>
                                  {getInitials(usuario)}
                                </span>
                                <span className={styles.userInfo}>
                                  <strong>
                                    {usuario.nombre} {usuario.apellidos}
                                  </strong>
                                  <span>{usuario.email}</span>
                                </span>
                              </div>
                            </td>
                            <td>{getRolLabel(usuario.rol)}</td>
                            <td>
                              <span
                                className={
                                  usuario.activo
                                    ? styles.statusActive
                                    : styles.statusInactive
                                }
                              >
                                {usuario.activo ? 'Activo' : 'Deshabilitado'}
                              </span>
                            </td>
                            <td>
                              <span
                                className={
                                  usuario.primerAcceso
                                    ? `${styles.accessBadge} ${styles.accessPending}`
                                    : `${styles.accessBadge} ${styles.accessDone}`
                                }
                              >
                                {usuario.primerAcceso
                                  ? 'Pendiente'
                                  : 'Completado'}
                              </span>
                            </td>
                            <td className={styles.clientCell}>
                              {usuario.cliente?.trim() || '—'}
                            </td>
                            <td>
                              <div className={styles.actionGroup}>
                                <button
                                  type="button"
                                  className={styles.iconButton}
                                  onClick={event => {
                                    event.stopPropagation();
                                    navigateToEdit(usuario);
                                  }}
                                  disabled={!editPath || actionInProgress}
                                  title="Editar usuario"
                                  aria-label={`Editar ${usuario.nombre} ${usuario.apellidos}`}
                                >
                                  <Icon name="edit" />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.iconButton} ${
                                    usuario.activo
                                      ? styles.disableAction
                                      : styles.enableAction
                                  }`}
                                  title={
                                    usuario.activo
                                      ? 'Deshabilitar usuario'
                                      : 'Habilitar usuario'
                                  }
                                  aria-label={`${
                                    usuario.activo ? 'Deshabilitar' : 'Habilitar'
                                  } usuario ${usuario.nombre} ${usuario.apellidos}`}
                                  onClick={event =>
                                    handleToggleEstado(event, usuario)
                                  }
                                  disabled={actionInProgress}
                                >
                                  <Icon
                                    name={
                                      usuario.activo
                                        ? 'personOff'
                                        : 'personCheck'
                                    }
                                  />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.iconButton} ${styles.deleteAction}`}
                                  title="Eliminar usuario"
                                  aria-label={`Eliminar usuario ${usuario.nombre} ${usuario.apellidos}`}
                                  onClick={event =>
                                    handleDeleteUsuario(event, usuario)
                                  }
                                  disabled={actionInProgress}
                                >
                                  <Icon name="trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!loadingUsuarios && (
                <footer className={styles.pagination}>
                  <span>
                    Mostrando{' '}
                    {usuariosFiltrados.length === 0
                      ? 0
                      : (safeCurrentPage - 1) * PAGE_SIZE + 1}{' '}
                    a{' '}
                    {Math.min(
                      safeCurrentPage * PAGE_SIZE,
                      usuariosFiltrados.length
                    )}{' '}
                    de {usuariosFiltrados.length} entradas
                  </span>
                  <div className={styles.pageControls}>
                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
                      aria-label="Página anterior"
                    >
                      <Icon name="chevronLeft" />
                    </button>
                    {pageNumbers.map(page => (
                      <button
                        type="button"
                        key={page}
                        className={
                          page === safeCurrentPage ? styles.pageActive : ''
                        }
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                    {totalPages > 3 && <span>...</span>}
                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages}
                      aria-label="Página siguiente"
                    >
                      <Icon name="chevronRight" />
                    </button>
                  </div>
                </footer>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

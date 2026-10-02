import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { BecarioSummary } from '../../../types/becario';
import { useAuth } from '../../auth/context/useAuth';
import { Header } from '../../../shared/components/Header';
import { ErrorRecoveryActions } from '../../../shared/components/ErrorRecoveryActions';
import { useErrorRecovery } from '../../auth/hooks/useErrorRecovery';
import { getMyBecariosAcademicos } from '../services/tutorService';
import styles from './TutorDashboard.module.css';

type IconName = 'search' | 'group' | 'chevronLeft' | 'chevronRight';

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

function getInitials(nombre: string, apellidos: string): string {
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
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

function formatHorasContrato(horas: number | null | undefined): string {
  if (horas == null) return '-';
  return `${new Intl.NumberFormat('es-ES').format(horas)} h`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';

  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-');

  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function TutorAcademicoDashboard() {
  const [becarios, setBecarios] = useState<BecarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { user, logout } = useAuth();
  const { hasRetried, retry, markRecovered, resetSession } =
    useErrorRecovery(logout);
  const navigate = useNavigate();

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
      const data = await getMyBecariosAcademicos();
      setBecarios(data);
      markRecovered();
    } catch (err) {
      console.error('Error al cargar becarios académicos:', err);
      setError(
        'Error al cargar los becarios asignados. Por favor, intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, [markRecovered]);

  useEffect(() => {
    void loadBecarios();
  }, [loadBecarios]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleBecarioClick = (idBecario: number) => {
    navigate(`/tutor-academico/becario/${idBecario}`);
  };

  const handleBecarioRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    idBecario: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBecarioClick(idBecario);
    }
  };

  const totalAsignados = becarios.length;

  if (loading) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor académico"
          onLogout={logout}
        />
        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando becarios...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor académico"
          onLogout={logout}
        />
        <main className={styles.main}>
          <div className={styles.error}>
            <h2>Error</h2>
            <p>{error}</p>
            <ErrorRecoveryActions
              hasRetried={hasRetried}
              onRetry={() => retry(loadBecarios)}
              onResetSession={resetSession}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header
        nombre={user?.nombre}
        apellidos={user?.apellidos}
        rolLabel="Tutor académico"
        onLogout={logout}
      />

      <main className={styles.main}>
        <div className={styles.titleSection}>
          <h1>Panel de Tutor Académico</h1>
          <p className={styles.subtitle}>Resumen de becarios asignados</p>
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
            </div>
          </div>

          {becariosFiltered.length === 0 ? (
            <div className={styles.emptyState}>
              {searchTerm ? (
                <p>
                  No se encontraron coincidencias para &ldquo;
                  <strong>{searchTerm}</strong>&rdquo;.
                </p>
              ) : (
                <p>No tienes becarios académicos asignados actualmente.</p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={`${styles.table} ${styles.academicTable}`}>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Horas contrato</th>
                      <th>Fecha inicio</th>
                      <th>Fecha fin</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {becariosPaginados.map(becario => (
                      <tr
                        key={becario.idBecario}
                        className={styles.tableRow}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleBecarioClick(becario.idBecario)}
                        onKeyDown={event =>
                          handleBecarioRowKeyDown(event, becario.idBecario)
                        }
                        aria-label={`${becario.nombre} ${becario.apellidos}`}
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
                        <td>{formatHorasContrato(becario.horasContrato)}</td>
                        <td>{formatDate(becario.fechaInicioPracticas)}</td>
                        <td>{formatDate(becario.fechaFinPracticas)}</td>
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
                      </tr>
                    ))}
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
}

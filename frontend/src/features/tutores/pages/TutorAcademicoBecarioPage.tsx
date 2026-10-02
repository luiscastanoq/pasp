import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BecarioSummary } from '../../../types/becario';
import { Header } from '../../../shared/components/Header';
import { useAuth } from '../../auth/context/useAuth';
import { getMyBecariosAcademicos } from '../services/tutorService';
import {
  TIPO_FORMACION,
  TIPO_TUTORIA,
  normalizeTipoFormacion,
} from '../../../shared/constants/domain.constants';
import styles from './TutorAcademicoBecarioPage.module.css';

type IconName =
  | 'school'
  | 'mail'
  | 'building'
  | 'review'
  | 'person'
  | 'briefcase'
  | 'hand'
  | 'clock'
  | 'money'
  | 'calendar'
  | 'phone'
  | 'link'
  | 'tasks'
  | 'group';

type ProfileTab = 'corporativo' | 'personal' | 'academico';

function Icon({ name }: { name: IconName }) {
  const common = {
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
        <svg {...common}>
          <path d="m22 10-10-5-10 5 10 5 10-5Z" />
          <path d="M6 12v5c3.5 2 8.5 2 12 0v-5" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common}>
          <rect width="18" height="14" x="3" y="5" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case 'building':
      return (
        <svg {...common}>
          <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
          <path d="M16 8h2a2 2 0 0 1 2 2v11" />
          <path d="M8 7h4M8 11h4M8 15h4M4 21h16" />
        </svg>
      );
    case 'review':
      return (
        <svg {...common}>
          <path d="M4 4h16v12H7l-3 3V4Z" />
          <path d="m9 11 2 2 4-5" />
        </svg>
      );
    case 'person':
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...common}>
          <rect width="20" height="14" x="2" y="7" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      );
    case 'hand':
      return (
        <svg {...common}>
          <path d="M18 11.5V6a2 2 0 0 0-4 0v5" />
          <path d="M14 10V4a2 2 0 0 0-4 0v7" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
          <path d="M6 14a2 2 0 0 0-4 0v1a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-3.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'money':
      return (
        <svg {...common}>
          <rect width="20" height="12" x="2" y="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.91.32 1.8.59 2.65a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6.28 6.28l1.24-1.24a2 2 0 0 1 2.11-.45c.85.27 1.74.47 2.65.59A2 2 0 0 1 22 16.92Z" />
        </svg>
      );
    case 'link':
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="m9 12 2 2 4-5" />
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
  }
}

function getInitials(nombre: string, apellidos: string): string {
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function getPracticaLabel(becario: BecarioSummary): string {
  const practica = becario.practica?.trim();
  const cliente = becario.cliente?.trim();

  if (practica && cliente) return `${practica} - ${cliente}`;
  if (practica) return practica;
  if (cliente) return cliente;
  return '-';
}

function formatFechaCorta(value: string | null | undefined): string {
  if (!value) return '—';
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);

  if (year && month && day) {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getTipoFormacionLabel(value: BecarioSummary['tipoFormacion']): string {
  const normalized = normalizeTipoFormacion(value);
  if (normalized === TIPO_FORMACION.UNIVERSITARIA) return 'Universitaria';
  if (normalized === TIPO_FORMACION.FORMACION_PROFESIONAL) {
    return 'Formación Profesional';
  }
  return '—';
}

function getTipoTutorLabel(tipo: string): string {
  const labels: Record<string, string> = {
    [TIPO_TUTORIA.EMPRESA_PRINCIPAL]: 'Tutor Principal (Empresa)',
    [TIPO_TUTORIA.EMPRESA_SECUNDARIO]: 'Tutor Secundario (Empresa)',
    [TIPO_TUTORIA.ACADEMICO]: 'Tutor Académico',
  };

  return labels[tipo] ?? tipo;
}

function getTutorHeaderLabel(tipo: string): string {
  return tipo === TIPO_TUTORIA.ACADEMICO
    ? 'Tutor Académico Asignado'
    : 'Tutor de Empresa Asignado';
}

export function TutorAcademicoBecarioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [becarios, setBecarios] = useState<BecarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('corporativo');

  const idBecario = id && !Number.isNaN(Number(id)) ? Number(id) : null;

  const becario = useMemo(
    () =>
      idBecario == null
        ? undefined
        : becarios.find(current => current.idBecario === idBecario),
    [becarios, idBecario]
  );

  const loadBecarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBecariosAcademicos();
      setBecarios(data);
    } catch (err) {
      console.error('Error al cargar el becario academico:', err);
      setError('Error al cargar la informacion del becario.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBecarios();
  }, [loadBecarios]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor académico"
          onLogout={logout}
        />
        <div className={styles.loading}>Cargando becario...</div>
      </div>
    );
  }

  if (error || !becario) {
    return (
      <div className={styles.container}>
        <Header
          nombre={user?.nombre}
          apellidos={user?.apellidos}
          rolLabel="Tutor académico"
          onLogout={logout}
        />
        <div className={styles.error}>
          <div className={styles.errorCard}>
            <h1>Becario no disponible</h1>
            <p>
              {error ??
                'No se ha encontrado este becario entre tus asignaciones academicas.'}
            </p>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate('/tutor-academico')}
            >
              Volver al panel
            </button>
          </div>
        </div>
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
        <section className={styles.identityCard}>
          <div className={styles.identityLeft}>
            <div className={styles.profileAvatar}>
              {getInitials(becario.nombre, becario.apellidos)}
            </div>
            <div className={styles.identityText}>
              <h1>
                {becario.nombre} {becario.apellidos}
              </h1>
              <div className={styles.identityMeta}>
                <span>
                  <Icon name="school" />
                  Becario
                </span>
                <span>
                  <Icon name="mail" />
                  {becario.email}
                </span>
                <span>
                  <Icon name="building" />
                  {getPracticaLabel(becario)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.identityActions}>
            <button
              type="button"
              className={styles.evaluacionesAction}
              onClick={() =>
                navigate(`/tutor-academico/becario/${becario.idBecario}/evaluaciones`)
              }
            >
              <Icon name="review" />
              Evaluaciones
            </button>
          </div>
        </section>

        <section className={styles.tabsPanel}>
          <div
            className={styles.tabsHeader}
            role="tablist"
            aria-label="Datos del becario"
          >
            <button
              type="button"
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
              type="button"
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
              type="button"
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
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'corporativo' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="briefcase" />
                    Práctica
                  </span>
                  <strong>{becario.practica || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="hand" />
                    Cliente
                  </span>
                  <strong>{becario.cliente || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="clock" />
                    Horas de Contrato
                  </span>
                  <strong>{becario.horasContrato}h</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="money" />
                    Ayuda economica
                  </span>
                  <strong>{becario.ayudaEconomica ?? '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="briefcase" />
                    Equipo en uso
                  </span>
                  <strong>{becario.equipoEnUso || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="calendar" />
                    Fecha de Incorporación
                  </span>
                  <strong>{formatFechaCorta(becario.fechaInicioPracticas)}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="calendar" />
                    Fecha de Fin
                  </span>
                  <strong>{formatFechaCorta(becario.fechaFinPracticas)}</strong>
                </div>
              </div>
            )}

            {activeTab === 'personal' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="mail" />
                    Email empresa
                  </span>
                  <strong>{becario.email}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="phone" />
                    Teléfono
                  </span>
                  <strong>{becario.telefonoPersonal || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="mail" />
                    Email personal
                  </span>
                  <strong>{becario.emailPersonal || '—'}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="link" />
                    LinkedIn
                  </span>
                  <strong>
                    {becario.linkedin ? (
                      <a href={becario.linkedin} target="_blank" rel="noreferrer">
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
                    <Icon name="school" />
                    Tipo
                  </span>
                  <strong>{getTipoFormacionLabel(becario.tipoFormacion)}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="tasks" />
                    Estudios
                  </span>
                  <strong>
                    {becario.nombreGradoUniversitario ||
                      becario.nombreFormacionProfesional ||
                      '—'}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>
                    <Icon name="building" />
                    Centro
                  </span>
                  <strong>{becario.centroEstudios || '—'}</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {becario.tutores && becario.tutores.length > 0 && (
          <section className={styles.tutorsGrid}>
            {becario.tutores.map((tutor, index) => {
              const tutorName =
                `${tutor.nombre ?? ''} ${tutor.apellidos ?? ''}`.trim() ||
                '—';

              return (
                <article
                  className={styles.tutorCard}
                  key={tutor.idTutor ?? `${tutor.email ?? 'tutor'}-${index}`}
                >
                  <div className={styles.tutorHeaderBar}>
                    <Icon name="group" />
                    <h2>{getTutorHeaderLabel(tutor.tipoTutor)}</h2>
                  </div>
                  <div className={styles.tutorBody}>
                    <div className={styles.tutorIdentity}>
                      <span className={styles.tutorAvatar}>
                        {getInitials(tutor.nombre ?? '', tutor.apellidos ?? '')}
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
                          {tutor.email ? (
                            <a href={`mailto:${tutor.email}`}>{tutor.email}</a>
                          ) : (
                            '—'
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Asignado desde:</dt>
                        <dd>{formatFechaCorta(tutor.fechaAsignacion)}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

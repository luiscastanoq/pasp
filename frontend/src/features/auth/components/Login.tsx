/**
 * Componente de Login con diseño sobrio y profesional
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/useAuth';
import { authService, type LoginCredentials } from '../services/authService';
import { ApiError } from '../../../shared/api/api';
import { PasswordInput } from '../../../shared/components/PasswordInput';
import styles from './Login.module.css';
import { LoginProgress } from './LoginProgress';
import {
  ROLES,
  type RolUsuario,
} from '../../../shared/constants/domain.constants';

const demoRoles = [
  {
    role: ROLES.BECARIO,
    label: 'Becario',
    description: 'Perfil personal, tareas y registro de jornada.',
  },
  {
    role: ROLES.TUTOR_EMPRESA,
    label: 'Tutor de empresa',
    description: 'Tareas, fichajes y evaluaciones de sus becarios.',
  },
  {
    role: ROLES.ADMIN,
    label: 'Administrador',
    description: 'Usuarios, perfiles y asignaciones del sistema.',
  },
  {
    role: ROLES.TUTOR_ACADEMICO,
    label: 'Tutor académico',
    description: 'Seguimiento académico de los becarios asignados.',
  },
];

const DATABASE_PREWARM_DELAY_MS = 1_000;

export function Login() {
  const { login, isLoading, loginStatus } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<{
    role: RolUsuario;
    message: string;
  } | null>(null);
  const [activeDemoRole, setActiveDemoRole] = useState<RolUsuario | null>(null);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const [isBackgroundWaking, setIsBackgroundWaking] = useState(false);

  useEffect(() => {
    let isActive = true;

    const prewarmTimeout = window.setTimeout(() => {
      void authService
        .warmUpDatabase({
          onDatabaseWaking: () => {
            if (isActive) {
              setIsBackgroundWaking(true);
            }
          },
        })
        .catch(() => undefined)
        .finally(() => {
          if (isActive) {
            setIsBackgroundWaking(false);
          }
        });
    }, DATABASE_PREWARM_DELAY_MS);

    return () => {
      isActive = false;
      window.clearTimeout(prewarmTimeout);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredentialsError(null);
    setDemoError(null);

    try {
      await login(credentials);
      // El AuthContext maneja el estado del usuario
      // App.tsx se encargará de renderizar el dashboard correspondiente
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : 'Error al iniciar sesión';
      setCredentialsError(errorMessage);
    }
  };

  const handleChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDemoLogin = async (role: RolUsuario) => {
    setCredentialsError(null);
    setDemoError(null);
    setActiveDemoRole(role);
    try {
      await login({ role });
    } catch (err) {
      setDemoError({
        role,
        message:
          err instanceof ApiError ? err.message : 'Error al acceder a la demo',
      });
    } finally {
      setActiveDemoRole(null);
    }
  };

  const switchAccess = () => {
    setCredentialsError(null);
    setDemoError(null);
    setShowDemoAccess(current => !current);
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.panelStack} ${showDemoAccess ? styles.demoPanelStack : ''}`}
      >
        {showDemoAccess ? (
          <section className={styles.card} aria-labelledby="demo-title">
            <h2 id="demo-title" className={styles.sectionTitle}>
              Explora la aplicación
            </h2>
            <p className={styles.demoIntro}>
              Elige un perfil para acceder a la demo con datos ficticios.
            </p>
            <div className={styles.rolesGrid}>
              {demoRoles.map(({ role, label, description }) => (
                <div key={role} className={styles.roleCard}>
                  <h3>{label}</h3>
                  <p>{description}</p>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleDemoLogin(role)}
                  >
                    {activeDemoRole === role
                      ? 'Preparando acceso...'
                      : `Entrar como ${label.toLowerCase()}`}{' '}
                    <span aria-hidden="true">→</span>
                  </button>
                  {demoError?.role === role && (
                    <div className={styles.errorMessage} role="alert">
                      {demoError.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className={styles.card}>
            <div className={styles.logoContainer}>
              <img
                src={`${import.meta.env.BASE_URL}pasp-logo.svg`}
                alt="PASP"
                className={styles.logo}
              />
            </div>
            <h1 className={styles.subtitle}>
              Plataforma de Administración y Seguimiento de Prácticas
            </h1>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="Ingresa tu email"
                  required
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Contraseña
                </label>
                <PasswordInput
                  id="password"
                  value={credentials.password}
                  onChange={e => handleChange('password', e.target.value)}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  required
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>

              {credentialsError && (
                <div className={styles.errorMessage} role="alert">
                  {credentialsError}
                </div>
              )}

              {activeDemoRole === null && loginStatus !== 'idle' ? (
                <LoginProgress />
              ) : activeDemoRole === null && isBackgroundWaking ? (
                <div
                  className={`${styles.preparingMessage} ${styles.backgroundPreparingMessage}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className={styles.spinner} aria-hidden="true" />
                  <span>
                    <strong>Preparando la conexión.</strong>
                    <br />
                    Puedes completar tus datos mientras iniciamos el sistema.
                  </span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className={styles.button}
              >
                {activeDemoRole !== null
                  ? 'Iniciar Sesión'
                  : isLoading
                    ? 'Preparando acceso...'
                    : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        )}
        {showDemoAccess &&
          activeDemoRole !== null &&
          loginStatus !== 'idle' && (
            <div className={styles.demoProgress}>
              <LoginProgress />
            </div>
          )}
        <button
          type="button"
          className={styles.switchLink}
          onClick={switchAccess}
          disabled={isLoading}
        >
          {showDemoAccess
            ? 'Acceso con credenciales →'
            : 'Explora la aplicación (demo) →'}
        </button>
      </div>
    </div>
  );
}

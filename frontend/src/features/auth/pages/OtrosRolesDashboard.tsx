import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import styles from './OtrosRolesDashboard.module.css';

export function OtrosRolesDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img
            src={`${import.meta.env.BASE_URL}pasp-logo.svg`}
            alt="PASP"
            className={styles.logo}
          />
        </div>
        <h1 className={styles.title}>Bienvenido a PASP</h1>
        <p className={styles.welcome}>Informacion del usuario</p>
        <p className={styles.userName}>{user?.email}</p>
        <div className={styles.userInfo}>
          <h3 className={styles.sectionTitle}>Datos de Usuario</h3>
          <p>
            <strong>ID Usuario:</strong> {user?.idUsuario}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Rol:</strong> <span className={styles.badge}>{user?.rol}</span>
          </p>
          <h3 className={styles.sectionTitle}>Estado de Cuenta</h3>
          <p>
            <strong>Activo:</strong>{' '}
            <span
              className={user?.activo ? styles.badgeSuccess : styles.badgeError}
            >
              {user?.activo ? 'Si' : 'No'}
            </span>
          </p>
          <p>
            <strong>Primer Acceso:</strong>{' '}
            <span
              className={
                user?.primerAcceso ? styles.badgeWarning : styles.badgeSuccess
              }
            >
              {user?.primerAcceso ? 'Si (debe cambiar contrasena)' : 'No'}
            </span>
          </p>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Cerrar Sesion
        </button>
      </div>
    </div>
  );
}

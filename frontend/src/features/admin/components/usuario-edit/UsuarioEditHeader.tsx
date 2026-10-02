import type { UsuarioDetalle } from '../../../../types/usuario.types';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from './UsuarioEditIcon';

interface UsuarioEditHeaderProps {
  usuario: UsuarioDetalle;
  roleLabel?: string;
  roleBadgeClassName?: string;
  submitting: boolean;
  onToggleEstado: () => void;
  onDelete: () => void;
}

export function UsuarioEditHeader({
  usuario,
  roleLabel,
  roleBadgeClassName,
  submitting,
  onToggleEstado,
  onDelete,
}: UsuarioEditHeaderProps) {
  const visibleRole = roleLabel ?? usuario.rol;

  return (
    <div className={styles.profileHeader}>
      <div className={styles.profileIdentity}>
        <div className={styles.profileAvatar}>
          {usuario.nombre.charAt(0).toUpperCase()}
          {usuario.apellidos.charAt(0).toUpperCase()}
        </div>
        <div className={styles.profileCopy}>
          <h1 className={styles.profileName}>
            {usuario.nombre} {usuario.apellidos}
          </h1>
          <div className={styles.profileMeta}>
            <span className={styles.profileEmail}>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              {usuario.email}
            </span>
            <span className={roleBadgeClassName ?? styles.badgeBlue}>
              {visibleRole}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.profileActions}>
        <button
          type="button"
          className={usuario.activo ? styles.disableButton : styles.enableButton}
          onClick={onToggleEstado}
          disabled={submitting}
        >
          <UsuarioEditIcon name="block" className={styles.buttonIcon} />
          {usuario.activo ? 'Deshabilitar' : 'Habilitar'}
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={onDelete}
          disabled={submitting}
        >
          <UsuarioEditIcon name="delete" className={styles.buttonIcon} />
          Eliminar
        </button>
      </div>
    </div>
  );
}

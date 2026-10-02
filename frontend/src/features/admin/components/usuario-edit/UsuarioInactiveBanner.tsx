import styles from '../../../../shared/components/ui/ui.module.css';

interface UsuarioInactiveBannerProps {
  activo: boolean;
}

export function UsuarioInactiveBanner({ activo }: UsuarioInactiveBannerProps) {
  if (activo) return null;

  return (
    <div className={styles.bannerError} role="alert">
      <span className={styles.bannerIcon}>🚫</span>
      <span className={styles.bannerText}>
        <strong>Usuario deshabilitado</strong> — Este usuario está actualmente
        inactivo y no puede acceder al sistema.
      </span>
    </div>
  );
}

import type { ReactNode } from 'react';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: number | null;
  colorClass?: 'blue' | 'green' | 'red' | 'orange';
}

export const KpiCard = ({
  icon,
  label,
  value,
  colorClass = 'blue',
}: KpiCardProps) => {
  return (
    <div className={`${styles.card} ${styles[colorClass]}`}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          {value === null ? (
            <span className={styles.skeleton} aria-label="Cargando..." />
          ) : (
            value
          )}
        </span>
      </div>
    </div>
  );
};

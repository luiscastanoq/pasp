import type { BecarioProfile } from '../../services/becarioService';
import styles from './CorporativaCard.module.css';

interface CorporativaCardProps {
  corporativo: BecarioProfile['corporativo'];
  practicas: BecarioProfile['practicas'];
  formatDate: (dateString: string | null) => string;
}

export const CorporativaCard = ({
  corporativo,
  practicas,
  formatDate,
}: CorporativaCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Información Corporativa</h3>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.infoGrid}>
          <div className={styles.infoSection}>
            <h4 className={styles.sectionTitle}>Práctica y Cliente</h4>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Práctica:</span>
              <span className={styles.infoValue}>
                {corporativo.practica || '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Cliente:</span>
              <span className={styles.infoValue}>
                {corporativo.cliente || '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Horas Contrato:</span>
              <span className={styles.infoValue}>
                {practicas.horasContrato} horas
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Ayuda economica:</span>
              <span className={styles.infoValue}>
                {practicas.ayudaEconomica ?? '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Equipo en uso:</span>
              <span className={styles.infoValue}>
                {practicas.equipoEnUso || '—'}
              </span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h4 className={styles.sectionTitle}>Fechas</h4>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha inicio:</span>
              <span className={styles.infoValue}>
                {formatDate(practicas.fechaInicioPracticas)}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha fin:</span>
              <span className={styles.infoValue}>
                {formatDate(practicas.fechaFinPracticas)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

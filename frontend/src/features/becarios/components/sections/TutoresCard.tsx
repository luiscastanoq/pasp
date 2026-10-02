import type { BecarioProfile } from '../../services/becarioService';
import styles from './TutoresCard.module.css';

type Tutor = BecarioProfile['tutores'][number];

interface TutoresCardProps {
  tutores: Tutor[];
  formatDate: (dateString: string | null) => string;
  getTipoTutorLabel: (tipo: string) => string;
}

export const TutoresCard = ({
  tutores,
  formatDate,
  getTipoTutorLabel,
}: TutoresCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Tutores Asignados</h3>
      </div>

      <div className={styles.cardContent}>
        {tutores.length > 0 ? (
          <div className={styles.tutorList}>
            {tutores.map(tutor => (
              <div key={tutor.idTutor} className={styles.tutorCard}>
                <div className={styles.tutorHeader}>
                  <h4 className={styles.tutorName}>
                    {tutor.nombre} {tutor.apellidos}
                  </h4>
                  <span
                    className={`${styles.badgeSmall} ${tutor.activo ? styles.badgeSuccess : styles.badgeError}`}
                  >
                    {tutor.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className={styles.tutorInfo}>
                  <p>
                    <strong>Tipo:</strong> {getTipoTutorLabel(tutor.tipoTutor)}
                  </p>
                  <p>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${tutor.email}`} className={styles.link}>
                      {tutor.email}
                    </a>
                  </p>
                  <p>
                    <strong>Asignado desde:</strong>{' '}
                    {formatDate(tutor.fechaAsignacion)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noData}>No tienes tutores asignados</p>
        )}
      </div>
    </div>
  );
};

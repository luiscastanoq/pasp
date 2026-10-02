import type {
  BecarioProfile,
  UpdateBecarioProfileData,
} from '../../services/becarioService';
import styles from './PersonalCard.module.css';

interface PersonalCardProps {
  profile: BecarioProfile;
  formData: UpdateBecarioProfileData;
  validationErrors: {
    telefonoPersonal?: string;
    emailPersonal?: string;
    linkedin?: string;
  };
  isEditing: boolean;
  isSaving: boolean;
  getTipoFormacionLabel: (tipo: string | null) => string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onInputChange: (field: keyof UpdateBecarioProfileData, value: string) => void;
}

export const PersonalCard = ({
  profile,
  formData,
  validationErrors,
  isEditing,
  isSaving,
  getTipoFormacionLabel,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
}: PersonalCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Personal</h3>
        {!isEditing && (
          <button onClick={onEdit} className={styles.editButton}>
            Editar
          </button>
        )}
      </div>

      <div className={styles.cardContent}>
        <div className={styles.infoGrid}>
          {/* Columna izquierda: Contacto */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionTitle}>Contacto</h4>

            {isEditing ? (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email empresa:</span>
                  <span className={styles.infoValue}>
                    {profile.usuario.email}
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label
                    htmlFor="telefonoPersonal"
                    className={styles.formLabel}
                  >
                    Teléfono personal:
                  </label>
                  <input
                    id="telefonoPersonal"
                    type="text"
                    value={formData.telefonoPersonal || ''}
                    onChange={e =>
                      onInputChange('telefonoPersonal', e.target.value)
                    }
                    placeholder="+34 600 123 456"
                    className={`${styles.input} ${validationErrors.telefonoPersonal ? styles.inputError : ''}`}
                    disabled={isSaving}
                  />
                  {validationErrors.telefonoPersonal && (
                    <span className={styles.fieldError}>
                      {validationErrors.telefonoPersonal}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="emailPersonal" className={styles.formLabel}>
                    Email personal:
                  </label>
                  <input
                    id="emailPersonal"
                    type="email"
                    value={formData.emailPersonal || ''}
                    onChange={e =>
                      onInputChange('emailPersonal', e.target.value)
                    }
                    placeholder="tu.email@gmail.com"
                    className={`${styles.input} ${validationErrors.emailPersonal ? styles.inputError : ''}`}
                    disabled={isSaving}
                  />
                  {validationErrors.emailPersonal && (
                    <span className={styles.fieldError}>
                      {validationErrors.emailPersonal}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="linkedin" className={styles.formLabel}>
                    LinkedIn:
                  </label>
                  <input
                    id="linkedin"
                    type="url"
                    value={formData.linkedin || ''}
                    onChange={e => onInputChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/tu-perfil"
                    className={`${styles.input} ${validationErrors.linkedin ? styles.inputError : ''}`}
                    disabled={isSaving}
                  />
                  {validationErrors.linkedin && (
                    <span className={styles.fieldError}>
                      {validationErrors.linkedin}
                    </span>
                  )}
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className={styles.saveButton}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={isSaving}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email empresa:</span>
                  <span className={styles.infoValue}>
                    {profile.usuario.email}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Teléfono personal:</span>
                  <span className={styles.infoValue}>
                    {profile.contacto.telefonoPersonal || '—'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email personal:</span>
                  <span className={styles.infoValue}>
                    {profile.contacto.emailPersonal || '—'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>LinkedIn:</span>
                  <span className={styles.infoValue}>
                    {profile.contacto.linkedin ? (
                      <a
                        href={profile.contacto.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        Ver perfil
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Columna derecha: Formación Académica */}
          <div className={styles.infoSection}>
            <h4 className={styles.sectionTitle}>Formación Académica</h4>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tipo de formación:</span>
              <span className={styles.infoValue}>
                {getTipoFormacionLabel(profile.academico.tipoFormacion)}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Estudios:</span>
              <span className={styles.infoValue}>
                {profile.academico.nombreGradoUniversitario ||
                  profile.academico.nombreFormacionProfesional ||
                  '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Centro de estudios:</span>
              <span className={styles.infoValue}>
                {profile.academico.centroEstudios || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

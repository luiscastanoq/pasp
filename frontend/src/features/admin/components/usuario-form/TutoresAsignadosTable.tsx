import {
  ROLES,
  TIPO_TUTORIA,
} from '../../../../shared/constants/domain.constants';
import type { TipoTutoriaBecario, TutorAsignadoBecario } from './types';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from '../usuario-edit/UsuarioEditIcon';

interface TutoresAsignadosTableProps {
  tutores: TutorAsignadoBecario[];
  duplicadosError: string | null;
  onAgregar: () => void;
  onTipoTutoriaChange: (tutorId: string, tipo: TipoTutoriaBecario) => void;
  onRemove: (tutorId: string) => void;
  nonRemovableTutorIds?: string[];
  lockedTutorTypeIds?: string[];
}

export function TutoresAsignadosTable({
  tutores,
  duplicadosError,
  onAgregar,
  onTipoTutoriaChange,
  onRemove,
  nonRemovableTutorIds = [],
  lockedTutorTypeIds = [],
}: TutoresAsignadosTableProps) {
  const nonRemovableTutorIdSet = new Set(nonRemovableTutorIds);
  const lockedTutorTypeIdSet = new Set(lockedTutorTypeIds);

  return (
    <div className={styles.card}>
      <div className={styles.becariosHeader}>
        <h2 className={styles.becariosTitle}>
          <UsuarioEditIcon name="group" className={styles.cardHeaderIcon} />
          Lista de tutores asignados
        </h2>
        <button
          type="button"
          onClick={onAgregar}
          className={styles.agregarButton}
        >
          <UsuarioEditIcon name="userPlus" className={styles.buttonIcon} />
          Agregar
        </button>
      </div>
      <div className={styles.becariosContent}>
        {duplicadosError && (
          <div className={styles.bannerErrorCard} role="alert">
            <span className={styles.bannerIcon}>! </span>
            <span className={styles.bannerText}>{duplicadosError}</span>
          </div>
        )}
        {tutores.length === 0 ? (
          <p className={styles.emptyMessage}>
            No hay tutores asignados. Haz clic en &quot;Agregar&quot; para
            comenzar.
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.becariosTable}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Tipo de tutoría</th>
                  <th className={styles.actionColumn}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {tutores.map(tutor => {
                  const isNonRemovable = nonRemovableTutorIdSet.has(tutor.id);
                  const isTutorTypeLocked = lockedTutorTypeIdSet.has(tutor.id);

                  return (
                    <tr key={tutor.id}>
                      <td className={styles.cellNombre}>{tutor.nombre}</td>
                      <td className={styles.cellNombre}>{tutor.apellidos}</td>
                      <td>{tutor.email}</td>
                      <td>{tutor.rol}</td>
                      <td>
                        {tutor.rol === ROLES.TUTOR_ACADEMICO ? (
                          <span className={styles.tipoTutoriaBadge}>
                            Académico
                          </span>
                        ) : (
                          <div className={styles.tipoTutoriaWrapper}>
                            <select
                              className={`${styles.tipoTutoriaSelect}${!tutor.tipoTutoria ? ` ${styles.tipoTutoriaSelectEmpty}` : ''}`}
                              value={tutor.tipoTutoria}
                              disabled={isTutorTypeLocked}
                              onChange={event =>
                                onTipoTutoriaChange(
                                  tutor.id,
                                  event.target.value as TipoTutoriaBecario
                                )
                              }
                              aria-label={`Tipo de tutoría de ${tutor.nombre} ${tutor.apellidos}`}
                            >
                              <option value="" disabled>
                                -- selecciona --
                              </option>
                              <option value={TIPO_TUTORIA.EMPRESA_PRINCIPAL}>
                                Empresa Principal
                              </option>
                              <option value={TIPO_TUTORIA.EMPRESA_SECUNDARIO}>
                                Empresa Secundario
                              </option>
                            </select>
                          </div>
                        )}
                      </td>
                      <td className={styles.actionColumn}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isNonRemovable) onRemove(tutor.id);
                          }}
                          className={
                            isNonRemovable
                              ? styles.ownTutorLabel
                              : styles.eliminarButton
                          }
                          title={
                            isNonRemovable
                              ? 'Tu propia tutoría no se puede desasignar desde aquí'
                              : `Desasignar a ${tutor.nombre} ${tutor.apellidos}`
                          }
                        >
                          {isNonRemovable ? 'yo' : 'Desasignar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

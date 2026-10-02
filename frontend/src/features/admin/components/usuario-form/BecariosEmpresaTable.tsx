import { TIPO_TUTORIA } from '../../../../shared/constants/domain.constants';
import type { BecarioAsignadoEmpresa, TipoTutoriaEmpresa } from './types';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from '../usuario-edit/UsuarioEditIcon';

interface BecariosEmpresaTableProps {
  becarios: BecarioAsignadoEmpresa[];
  onAgregar: () => void;
  onTipoTutoriaChange: (becarioId: string, tipo: TipoTutoriaEmpresa) => void;
  onRemove: (becarioId: string) => void;
}

export function BecariosEmpresaTable({
  becarios,
  onAgregar,
  onTipoTutoriaChange,
  onRemove,
}: BecariosEmpresaTableProps) {
  return (
    <div className={styles.card}>
      <div className={styles.becariosHeader}>
        <h2 className={styles.becariosTitle}>
          <UsuarioEditIcon name="group" className={styles.cardHeaderIcon} />
          Becarios asignados (Empresa)
        </h2>
        <button type="button" onClick={onAgregar} className={styles.agregarButton}>
          <UsuarioEditIcon name="userPlus" className={styles.buttonIcon} />
          Agregar
        </button>
      </div>
      <div className={styles.becariosContent}>
        {becarios.length === 0 ? (
          <p className={styles.emptyMessage}>
            No hay becarios asignados todavía. Haz clic en &quot;Agregar&quot;
            para comenzar.
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.becariosTable}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>Email personal</th>
                  <th>Tipo de formación</th>
                  <th>Tipo de tutoría</th>
                  <th className={styles.actionColumn}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {becarios.map(becario => (
                  <tr key={becario.id}>
                    <td className={styles.cellNombre}>{becario.nombre}</td>
                    <td className={styles.cellNombre}>{becario.apellidos}</td>
                    <td>{becario.emailPersonal}</td>
                    <td>{becario.tipoFormacion || '-'}</td>
                    <td>
                      <div className={styles.tipoTutoriaWrapper}>
                        <select
                          className={`${styles.tipoTutoriaSelect}${!becario.tipoTutoria ? ` ${styles.tipoTutoriaSelectEmpty}` : ''}`}
                          value={becario.tipoTutoria}
                          onChange={event =>
                            onTipoTutoriaChange(
                              becario.id,
                              event.target.value as TipoTutoriaEmpresa
                            )
                          }
                        >
                          <option value="" disabled>
                            -- selecciona --
                          </option>
                          <option value={TIPO_TUTORIA.EMPRESA_PRINCIPAL}>
                            Principal
                          </option>
                          <option value={TIPO_TUTORIA.EMPRESA_SECUNDARIO}>
                            Secundario
                          </option>
                        </select>
                      </div>
                    </td>
                    <td className={styles.actionColumn}>
                      <button
                        type="button"
                        onClick={() => onRemove(becario.id)}
                        className={styles.eliminarButton}
                        title={`Desasignar a ${becario.nombre} ${becario.apellidos}`}
                      >
                        Desasignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

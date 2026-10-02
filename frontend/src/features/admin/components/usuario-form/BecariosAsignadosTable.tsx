import type { Becario } from './types';
import styles from '../../../../shared/components/ui/ui.module.css';
import { UsuarioEditIcon } from '../usuario-edit/UsuarioEditIcon';

interface BecariosAsignadosTableProps {
  becarios: Becario[];
  onAgregar: () => void;
  onRemove: (becarioId: string) => void;
}

export function BecariosAsignadosTable({
  becarios,
  onAgregar,
  onRemove,
}: BecariosAsignadosTableProps) {
  return (
    <div className={styles.card}>
      <div className={styles.becariosHeader}>
        <h2 className={styles.becariosTitle}>
          <UsuarioEditIcon name="group" className={styles.cardHeaderIcon} />
          Lista de becarios asignados
        </h2>
        <button type="button" onClick={onAgregar} className={styles.agregarButton}>
          <UsuarioEditIcon name="userPlus" className={styles.buttonIcon} />
          Agregar
        </button>
      </div>
      <div className={styles.becariosContent}>
        {becarios.length === 0 ? (
          <p className={styles.emptyMessage}>
            No hay becarios asignados. Haz clic en &quot;Agregar&quot; para
            comenzar.
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.becariosTable}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>Email personal</th>
                  <th>Centro de estudios</th>
                  <th>Tipo de formación</th>
                  <th className={styles.actionColumn}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {becarios.map(becario => (
                  <tr key={becario.id}>
                    <td className={styles.cellNombre}>{becario.nombre}</td>
                    <td className={styles.cellNombre}>{becario.apellidos}</td>
                    <td>{becario.emailPersonal}</td>
                    <td>{becario.centroEstudios?.nombre || '-'}</td>
                    <td>{becario.tipoFormacion || '-'}</td>
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

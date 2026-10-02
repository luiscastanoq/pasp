import type { Tarea, EstadoTarea } from '../../../../types/tarea';
import { TaskCard } from '../../../../shared/components/TaskCard';
import styles from './TareasCard.module.css';

interface TareasCardProps {
  tareas: Tarea[];
  loadingTareas: boolean;
  updatingTareaId: number | null;
  onUpdateEstado: (idTarea: number, estado: EstadoTarea) => Promise<void>;
  onSelectTarea: (tarea: Tarea) => void;
}

export const TareasCard = ({
  tareas,
  loadingTareas,
  updatingTareaId,
  onUpdateEstado,
  onSelectTarea,
}: TareasCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>Tareas Asignadas</h3>
          <span className={styles.badge}>{tareas.length} tareas</span>
        </div>
      </div>

      <div className={styles.cardContent}>
        {loadingTareas ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando tareas...</p>
          </div>
        ) : tareas.length > 0 ? (
          <div className={styles.tareaGrid}>
            {tareas.map(tarea => (
              <TaskCard
                key={tarea.idTarea}
                tarea={tarea}
                onUpdateEstado={onUpdateEstado}
                onClick={() => onSelectTarea(tarea)}
                isUpdating={updatingTareaId === tarea.idTarea}
              />
            ))}
          </div>
        ) : (
          <p className={styles.noData}>No tienes tareas asignadas todavía</p>
        )}
      </div>
    </div>
  );
};

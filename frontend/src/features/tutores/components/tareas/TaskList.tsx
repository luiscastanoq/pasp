import { useState } from 'react';
import type { Tarea, EstadoTarea, UpdateTareaData } from '../../../../types/tarea';
import { TaskCard } from '../../../../shared/components/TaskCard';
import { TareaDetailModal } from '../../../../shared/components/TareaDetailModal';
import { ROLES } from '../../../../shared/constants/domain.constants';
import styles from './TaskList.module.css';

interface TaskListProps {
  tareas: Tarea[];
  onUpdateTarea: (idTarea: number, data: UpdateTareaData) => Promise<void>;
  onDeleteTarea: (idTarea: number) => Promise<void>;
  onRefresh: () => void;
}

export const TaskList = ({
  tareas,
  onUpdateTarea,
  onDeleteTarea,
  onRefresh,
}: TaskListProps) => {
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleChangeEstado = async (
    idTarea: number,
    nuevoEstado: EstadoTarea
  ) => {
    setUpdatingId(idTarea);
    try {
      await onUpdateTarea(idTarea, { estado: nuevoEstado });
      onRefresh();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateTarea = async (idTarea: number, data: UpdateTareaData) => {
    await onUpdateTarea(idTarea, data);
    onRefresh();
  };

  const handleDeleteTarea = async (idTarea: number) => {
    await onDeleteTarea(idTarea);
    onRefresh();
  };

  if (tareas.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No hay tareas asignadas todavia</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.taskGrid}>
        {tareas.map(tarea => (
          <TaskCard
            key={tarea.idTarea}
            tarea={tarea}
            onUpdateEstado={handleChangeEstado}
            onClick={() => setSelectedTarea(tarea)}
            isUpdating={updatingId === tarea.idTarea}
          />
        ))}
      </div>

      {selectedTarea && (
        <TareaDetailModal
          tarea={selectedTarea}
          userRole={ROLES.TUTOR_EMPRESA}
          onClose={() => setSelectedTarea(null)}
          onUpdate={handleUpdateTarea}
          onDelete={handleDeleteTarea}
        />
      )}
    </>
  );
};

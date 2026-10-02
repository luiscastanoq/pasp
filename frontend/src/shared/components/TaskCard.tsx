import { useState } from 'react';
import type { Tarea, EstadoTarea } from '../../types/tarea';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  tarea: Tarea;
  onUpdateEstado: (idTarea: number, estado: EstadoTarea) => Promise<void>;
  onClick: () => void;
  isUpdating?: boolean;
}

export const TaskCard = ({
  tarea,
  onUpdateEstado,
  onClick,
  isUpdating = false,
}: TaskCardProps) => {
  const [isChangingEstado, setIsChangingEstado] = useState(false);

  const handleChangeEstado = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    const nuevoEstado = e.target.value as EstadoTarea;
    setIsChangingEstado(true);
    try {
      await onUpdateEstado(tarea.idTarea, nuevoEstado);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setIsChangingEstado(false);
    }
  };

  const getEstadoBadgeClass = (estado: EstadoTarea) => {
    switch (estado) {
      case 'Completada':
        return styles.badgeCompletada;
      case 'En_Progreso':
        return styles.badgeEnProgreso;
      case 'Pendiente':
      default:
        return styles.badgePendiente;
    }
  };

  const getEstadoLabel = (estado: EstadoTarea) => {
    switch (estado) {
      case 'En_Progreso':
        return 'En Progreso';
      case 'Completada':
        return 'Completada';
      case 'Pendiente':
      default:
        return 'Pendiente';
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div
      className={[
        styles.taskCard,
        isUpdating || isChangingEstado ? styles.taskCardDisabled : '',
      ].join(' ')}
      onClick={onClick}
    >
      <div className={styles.taskHeader}>
        <h4 className={styles.taskTitle}>{tarea.nombreTarea}</h4>
        <span
          className={[styles.badge, getEstadoBadgeClass(tarea.estado)].join(
            ' '
          )}
        >
          {getEstadoLabel(tarea.estado)}
        </span>
      </div>
      {tarea.descripcion && (
        <p className={styles.taskDescription}>{tarea.descripcion}</p>
      )}
      <div className={styles.taskDates}>
        <div className={styles.dateItem}>
          <span className={styles.dateLabel}>Inicio:</span>
          <span className={styles.dateValue}>
            {formatFecha(tarea.fechaInicio)}
          </span>
        </div>
        {tarea.fechaFinEstimada && (
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Fin estimado:</span>
            <span className={styles.dateValue}>
              {formatFecha(tarea.fechaFinEstimada)}
            </span>
          </div>
        )}
        {tarea.estado === 'Completada' && tarea.fechaCompletada && (
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Completada:</span>
            <span className={styles.dateValue}>
              {formatFecha(tarea.fechaCompletada)}
            </span>
          </div>
        )}
      </div>
      <div className={styles.taskTutor}>
        <span className={styles.tutorLabel}>Asignado por:</span>
        <span className={styles.tutorName}>
          {tarea.tutorAsignador.nombre} {tarea.tutorAsignador.apellidos}
        </span>
      </div>
      <div className={styles.taskActions}>
        <select
          value={tarea.estado}
          onChange={handleChangeEstado}
          className={styles.estadoSelect}
          disabled={isUpdating || isChangingEstado}
          onClick={e => e.stopPropagation()}
        >
          <option value="Pendiente">Pendiente</option>
          <option value="En_Progreso">En Progreso</option>
          <option value="Completada">Completada</option>
        </select>
      </div>
      {(isUpdating || isChangingEstado) && (
        <div className={styles.updating}>
          {isChangingEstado ? 'Actualizando estado...' : 'Actualizando...'}
        </div>
      )}
    </div>
  );
};

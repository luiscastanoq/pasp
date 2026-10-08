import { ESTADO_TAREA } from '../shared/constants/domain.constants';
import type { DemoInternData } from './azureDemoSeed.data';

export class DemoSeedError extends Error {}

export const MARCOS_TUTOR_KEY = 'aeronova-primary';

export function isMarcosIntern(intern: DemoInternData): boolean {
  return (
    intern.tutorPrincipalKey === MARCOS_TUTOR_KEY ||
    intern.tutorSecundarioKey === MARCOS_TUTOR_KEY
  );
}

interface HistoryTask {
  estado: string;
  fechaInicio: Date;
  fechaFinEstimada: Date | null;
  fechaCompletada: Date | null;
  idTutorAsignador: number;
}

/** Datos ficticios: el último cambio conserva el estado real de la tarea. */
export function createDemoTaskHistory(
  task: HistoryTask,
  internUserId: number,
  now = new Date()
) {
  if (!Object.values(ESTADO_TAREA).some(status => status === task.estado)) {
    throw new DemoSeedError(
      'No se puede simular el historial de un estado desconocido.'
    );
  }
  const start = task.fechaInicio.getTime();
  const completed = task.estado === ESTADO_TAREA.COMPLETADA;
  if (completed && !task.fechaCompletada) {
    throw new DemoSeedError(
      'Una tarea completada necesita una fecha de finalización.'
    );
  }
  // Los campos de tarea son DATE; la jornada simulada termina a las 16:00 UTC.
  const finalDate = completed
    ? task.fechaCompletada!
    : (task.fechaFinEstimada ?? now);
  const finalInstant = completed
    ? Date.UTC(
        finalDate.getUTCFullYear(),
        finalDate.getUTCMonth(),
        finalDate.getUTCDate(),
        16
      )
    : finalDate.getTime();
  const end = Math.min(finalInstant, now.getTime());
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > now.getTime() ||
    end < start
  ) {
    throw new DemoSeedError(
      'Las fechas de la tarea no permiten un historial cronológico.'
    );
  }
  const states: string[] = [ESTADO_TAREA.PENDIENTE];
  if (task.estado !== ESTADO_TAREA.PENDIENTE) {
    states.push(
      ESTADO_TAREA.EN_PROGRESO,
      ESTADO_TAREA.PENDIENTE,
      ESTADO_TAREA.EN_PROGRESO
    );
  }
  if (completed) states.push(ESTADO_TAREA.COMPLETADA);
  return states.map((state, index) => ({
    estadoAnterior: index === 0 ? null : states[index - 1],
    estadoNuevo: state,
    idUsuarioModificador:
      index === 0 || (index === states.length - 1 && completed)
        ? task.idTutorAsignador
        : internUserId,
    fechaCambio: new Date(
      start + ((end - start) * index) / Math.max(1, states.length - 1)
    ),
  }));
}

/**
 * Interfaces TypeScript para gestión de Tareas (HU-11)
 */

export type EstadoTarea = 'Pendiente' | 'En_Progreso' | 'Completada';

export interface Tarea {
  idTarea: number;
  nombreTarea: string;
  descripcion: string | null;
  estado: EstadoTarea;
  fechaInicio: string; // YYYY-MM-DD
  fechaFinEstimada: string | null; // YYYY-MM-DD
  fechaCompletada: string | null; // YYYY-MM-DD
  tutorAsignador: {
    idUsuario: number;
    nombre: string;
    apellidos: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTareaData {
  nombreTarea: string;
  descripcion?: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFinEstimada?: string; // YYYY-MM-DD
}

export interface UpdateTareaData {
  nombreTarea?: string;
  descripcion?: string;
  estado?: EstadoTarea;
  fechaFinEstimada?: string; // YYYY-MM-DD
}

export interface GetTareasResponse {
  success: boolean;
  data: {
    tareas: Tarea[];
    count: number;
  };
}

export interface CreateTareaResponse {
  success: boolean;
  message: string;
  data: Tarea;
}

export interface UpdateTareaResponse {
  success: boolean;
  message: string;
  data: Tarea;
}

// ============================================
// HISTORIAL DE TAREAS (HU-11g/h)
// ============================================

export interface TareaHistorialEntry {
  idHistorial: number;
  estadoAnterior: EstadoTarea | null;
  estadoNuevo: EstadoTarea;
  fechaCambio: string; // ISO date string
  modificadoPor: {
    idUsuario: number;
    nombre: string;
    apellidos: string;
    rol: string;
  };
}

export interface TareaHistorialResponse {
  success: boolean;
  data: TareaHistorialEntry[];
}

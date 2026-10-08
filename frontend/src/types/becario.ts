/**
 * Interfaces TypeScript para datos de Becarios
 * ACTUALIZADO PARA SCHEMA V2.0
 * - departamento → cliente + practica
 * - proyecto, estadoProyecto → eliminados (tabla Proyectos eliminada)
 * - Añadidos campos de información académica
 */
import type {
  TipoFormacion,
  TipoFormacionLegacy,
} from '../shared/constants/domain.constants';

export interface BecarioSummary {
  idBecario: number;
  idUsuario: number;
  nombre: string;
  apellidos: string;
  email: string;
  activo: boolean;
  // Información corporativa (v2.0)
  practica: string | null;
  cliente: string | null;
  // Información de la tutoría
  tipoTutor: string;
  fechaInicioPracticas: string;
  fechaFinPracticas: string | null;
  horasContrato: number; // CAMBIADO: Horas pactadas en el contrato de prácticas
  ayudaEconomica: number | null;
  equipoEnUso: string | null;
  tareasAsignadas?: number; // Número de tareas asignadas actualmente
  tareasPendientes?: number;
  tareasEnProgreso?: number;
  tareasCompletadas?: number;
  ultimoFichaje?: string | null; // Fecha del último fichaje (formato ISO)
  // Información académica (v2.0)
  tipoFormacion: TipoFormacion | TipoFormacionLegacy | null;
  nombreGradoUniversitario: string | null;
  nombreFormacionProfesional: string | null;
  centroEstudios: string | null;
  // Información de contacto adicional
  telefonoPersonal: string | null;
  emailPersonal: string | null;
  linkedin: string | null;
  tutores?: TutorSummary[];
}

export interface TutorSummary {
  idTutor?: number;
  nombre?: string;
  apellidos?: string;
  email?: string;
  rol?: string;
  tipoTutor: string;
  fechaAsignacion?: string | null;
}

export interface GetBecariosResponse {
  success: boolean;
  data: {
    becarios: BecarioSummary[];
    count: number;
  };
}

/**
 * Datos para actualizar información corporativa y académica de un becario
 */
export interface UpdateBecarioData {
  // Información corporativa
  practica?: string;
  cliente?: string;
  horasContrato?: number;
  ayudaEconomica?: number | null;
  equipoEnUso?: string | null;
  fechaInicioPracticas?: string;
  fechaFinPracticas?: string | null;
  // Información académica
  tipoFormacion?: TipoFormacion | null;
  nombreGradoUniversitario?: string | null;
  nombreFormacionProfesional?: string | null;
  centroEstudios?: string | null;
}

/**
 * Respuesta al actualizar un becario
 */
export interface UpdateBecarioResponse {
  success: boolean;
  message: string;
  data: BecarioSummary;
}

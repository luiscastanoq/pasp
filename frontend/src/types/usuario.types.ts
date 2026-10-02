import type { RolUsuario, TipoFormacion } from './index';
import type {
  TipoTutoriaBecario,
  TipoTutoriaEmpresa,
} from '../shared/constants/domain.constants';

export type {
  TipoTutoriaBecario,
  TipoTutoriaEmpresa,
} from '../shared/constants/domain.constants';

export interface CrearUsuarioDTO {
  nombre: string;
  apellidos: string;
  emailPersonal: string;
  emailCorporativo?: string;
  telefono?: string;
  rol: RolUsuario;
  centroEstudiosId?: string;
  centroTrabajoId?: string;
  departamentoId?: string;
  tipoFormacion?: TipoFormacion;
  practica?: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface Usuario extends CrearUsuarioDTO {
  id: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipo para becarios en la tabla de asignación
export interface Becario {
  id: string;
  nombre: string;
  apellidos: string;
  emailPersonal: string;
  centroEstudios: {
    nombre: string;
  } | null;
  tipoFormacion: string | null;
}

// ── HU-5.16: Detalle de usuario ────────────────────────────────────────────

export interface UsuarioDetalle {
  idUsuario: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  primerAcceso: boolean;
  esSuperAdmin: boolean;
  practica: string | null;
  cliente: string | null;
}

export interface UpdateUsuarioData {
  nombre?: string;
  apellidos?: string;
  email?: string;
  contrasena?: string;
  practica?: string;
  cliente?: string;
}

// ── HU-5.12: Tutor de empresa ────────────────────────────────────────

/**
 * Becario en la tabla de asignados del Tutor de empresa.
 * Extiende Becario añadiendo el tipo de tutoría seleccionado.
 */
export interface BecarioAsignadoEmpresa extends Becario {
  tipoTutoria: TipoTutoriaEmpresa;
}

// ── HU-5.X: Edición de Becario ──────────────────────────────────────────────

/** Datos del perfil de un Becario (tabla Becarios) */
export interface BecarioDetalle {
  idBecario: number;
  horasContrato: number;
  ayudaEconomica: number | null;
  equipoEnUso: string;
  fechaInicioPracticas: string; // 'YYYY-MM-DD'
  fechaFinPracticas: string;   // 'YYYY-MM-DD'
  tipoFormacion: TipoFormacion | string;
  nombreFormacion: string;
  centroEstudios: string;
  telefonoPersonal: string;
  emailPersonal: string;
  linkedin: string;
}

/** Payload para actualizar el perfil de un Becario */
export interface UpdateBecarioDetalleData {
  horasContrato?: number;
  ayudaEconomica?: number | null;
  equipoEnUso?: string | null;
  fechaInicioPracticas?: string;
  fechaFinPracticas?: string;
  tipoFormacion?: TipoFormacion;
  nombreFormacion?: string;
  centroEstudios?: string;
  telefonoPersonal?: string | null;
  emailPersonal?: string | null;
  linkedin?: string | null;
}

/** Tutor asignado a un Becario */
export interface TutorDelBecario {
  id: string;         // idUsuario del tutor (como string)
  nombre: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
  tipoTutoria: TipoTutoriaBecario;
}

/** Tutor asignado con su tipo de tutoría (para guardar) */
export interface TutorAsignadoBecarioEdicion {
  tutorId: number;
  tipoTutoria: TipoTutoriaBecario;
}

import { ROLES } from '../../../shared/constants/domain.constants';
import type {
  RolUsuario,
  TipoFormacion,
  TipoTutoriaBecario,
  TipoTutoriaEmpresa,
} from '../../../shared/constants/domain.constants';
import type {
  Becario,
  BecarioDetalle,
  TutorAsignadoBecarioEdicion,
  TutorDelBecario,
  UpdateBecarioDetalleData,
  UpdateUsuarioData,
  Usuario,
  UsuarioDetalle,
} from '../../../types/usuario.types';

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export interface UsuarioAdmin {
  idUsuario: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  primerAcceso: boolean;
  cliente: string | null;
}

export interface CrearAdministradorPayload {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  rol: typeof ROLES.ADMIN;
}

export interface CrearTutorAcademicoPayload {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  rol: typeof ROLES.TUTOR_ACADEMICO;
  becarioIds: number[];
}

export interface BecarioEmpresaPayload {
  becarioId: number;
  tipoTutoria: TipoTutoriaEmpresa;
}

export interface CrearTutorEmpresaPayload {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  rol: typeof ROLES.TUTOR_EMPRESA;
  practica: string;
  cliente: string;
  becarios: BecarioEmpresaPayload[];
}

export interface TutorBecarioPayload {
  tutorId: number;
  tipoTutoria: TipoTutoriaBecario;
}

export interface CrearBecarioPayload {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  rol: typeof ROLES.BECARIO;
  practica: string;
  cliente: string;
  horasContrato: number;
  ayudaEconomica?: number | null;
  equipoEnUso?: string | null;
  fechaInicioPracticas: string;
  fechaFinPracticas: string;
  tipoFormacion: TipoFormacion;
  nombreFormacion: string;
  centroEstudios: string;
  telefonoPersonal?: string | null;
  emailPersonal?: string | null;
  linkedin?: string | null;
  tutoresAsignados: TutorBecarioPayload[];
}

export interface BecarioAsignadoTutorAcademico {
  id: string;
  nombre: string;
  apellidos: string;
  emailPersonal: string;
  centroEstudios: { nombre: string } | null;
  tipoFormacion: string | null;
  porcentajeAsignacion: number;
}

export interface BecarioDisponible {
  id: string;
  nombre: string;
  apellidos: string;
  emailPersonal: string;
  centroEstudios: { nombre: string } | null;
  tipoFormacion: string | null;
}

export interface CrearUsuarioResponse {
  success: boolean;
  message: string;
  usuario?: UsuarioAdmin & { createdAt: string };
}

export interface UsuarioResponse {
  success: boolean;
  usuario: UsuarioDetalle;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export type {
  Becario,
  BecarioDetalle,
  TipoTutoriaEmpresa,
  TutorAsignadoBecarioEdicion,
  TutorDelBecario,
  UpdateBecarioDetalleData,
  UpdateUsuarioData,
  Usuario,
  UsuarioDetalle,
};

import {
  ROLES,
  TIPO_TUTORIA,
} from '../../../../shared/constants/domain.constants';
import type { TipoTutoriaBecario as DomainTipoTutoriaBecario } from '../../../../shared/constants/domain.constants';
import type {
  TipoTutoriaEmpresa,
  BecarioAsignadoEmpresa,
} from '../../../../types/usuario.types';

export interface Becario {
  id: string;
  nombre: string;
  apellidos: string;
  emailPersonal: string;
  centroEstudios: { nombre: string } | null;
  tipoFormacion: string | null;
}

export interface DatosBecario {
  horasContrato: string;
  ayudaEconomica: string;
  equipoEnUso: string;
  fechaInicioPracticas: string;
  fechaFinPracticas: string;
  tipoFormacion: string;
  nombreFormacion: string;
  centroEstudios: string;
  telefonoPersonal: string;
  emailPersonal: string;
  linkedin: string;
}

export const DATOS_BECARIO_EMPTY: DatosBecario = {
  horasContrato: '',
  ayudaEconomica: '',
  equipoEnUso: '',
  fechaInicioPracticas: '',
  fechaFinPracticas: '',
  tipoFormacion: '',
  nombreFormacion: '',
  centroEstudios: '',
  telefonoPersonal: '',
  emailPersonal: '',
  linkedin: '',
};

export type TipoTutoriaBecario = DomainTipoTutoriaBecario | '';

export interface TutorAsignadoBecario {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  tipoTutoria: TipoTutoriaBecario;
}

export interface NuevoUsuarioFormData {
  nombre: string;
  apellidos: string;
  emailInterno: string;
  contrasena: string;
  practica: string;
  cliente: string;
}

export type ValidableField = Exclude<keyof NuevoUsuarioFormData, 'contrasena'>;

export interface FormErrors {
  nombre?: string;
  apellidos?: string;
  emailInterno?: string;
  practica?: string;
  cliente?: string;
}

export type FeedbackState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

export const ROL_OPTIONS = [
  { value: ROLES.BECARIO, label: 'Becario' },
  { value: ROLES.TUTOR_EMPRESA, label: 'Tutor de empresa' },
  { value: ROLES.TUTOR_ACADEMICO, label: 'Tutor académico' },
  { value: ROLES.ADMIN, label: 'Administrador' },
];

export const ROLES_SIN_PRACTICA_CLIENTE: readonly string[] = [
  ROLES.ADMIN,
  ROLES.TUTOR_ACADEMICO,
];

export const TIPO_TUTORIA_LABELS: Record<string, string> = {
  [TIPO_TUTORIA.EMPRESA_PRINCIPAL]: 'Empresa Principal',
  [TIPO_TUTORIA.EMPRESA_SECUNDARIO]: 'Empresa Secundario',
  [TIPO_TUTORIA.ACADEMICO]: 'Académico',
};

export type { TipoTutoriaEmpresa, BecarioAsignadoEmpresa };

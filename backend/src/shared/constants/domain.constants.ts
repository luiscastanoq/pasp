export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  TUTOR_EMPRESA: 'Tutor_Empresa',
  TUTOR_ACADEMICO: 'Tutor_Academico',
  BECARIO: 'Becario',
} as const;

export type RolUsuario = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_USUARIO = [
  ROLES.ADMINISTRADOR,
  ROLES.TUTOR_EMPRESA,
  ROLES.TUTOR_ACADEMICO,
  ROLES.BECARIO,
] as const;

export const TUTOR_EMPRESA_ROLES = [ROLES.TUTOR_EMPRESA] as const;

export const TUTOR_ACADEMICO_ROLES = [ROLES.TUTOR_ACADEMICO] as const;

export const TUTOR_ROLES = [
  ...TUTOR_EMPRESA_ROLES,
  ...TUTOR_ACADEMICO_ROLES,
] as const;

export function normalizeRolUsuario(rol: string): RolUsuario {
  return rol as RolUsuario;
}

export function isTutorEmpresaRol(rol: string): boolean {
  return TUTOR_EMPRESA_ROLES.includes(rol as (typeof TUTOR_EMPRESA_ROLES)[number]);
}

export function isTutorAcademicoRol(rol: string): boolean {
  return TUTOR_ACADEMICO_ROLES.includes(rol as (typeof TUTOR_ACADEMICO_ROLES)[number]);
}

export function isTutorRol(rol: string): boolean {
  return TUTOR_ROLES.includes(rol as (typeof TUTOR_ROLES)[number]);
}

export const TIPO_TUTORIA = {
  EMPRESA_PRINCIPAL: 'Empresa_Principal',
  EMPRESA_SECUNDARIO: 'Empresa_Secundario',
  ACADEMICO: 'Academico',
} as const;

export type TipoTutoria = (typeof TIPO_TUTORIA)[keyof typeof TIPO_TUTORIA];
export type TipoTutoriaEmpresa =
  | typeof TIPO_TUTORIA.EMPRESA_PRINCIPAL
  | typeof TIPO_TUTORIA.EMPRESA_SECUNDARIO;

export const TIPOS_TUTORIA_ACADEMICA = [TIPO_TUTORIA.ACADEMICO] as const;

export const TIPOS_TUTORIA_EMPRESA = [
  TIPO_TUTORIA.EMPRESA_PRINCIPAL,
  TIPO_TUTORIA.EMPRESA_SECUNDARIO,
] as const;

export const TIPOS_TUTORIA = [
  ...TIPOS_TUTORIA_EMPRESA,
  TIPO_TUTORIA.ACADEMICO,
] as const;

export const TIPO_FORMACION = {
  UNIVERSITARIA: 'Universitaria',
  FORMACION_PROFESIONAL: 'Formacion_Profesional',
} as const;

export type TipoFormacion = (typeof TIPO_FORMACION)[keyof typeof TIPO_FORMACION];

export const LEGACY_TIPO_FORMACION = {
  GRADO: 'GRADO',
  FP: 'FP',
} as const;

export const TIPOS_FORMACION_COMPATIBLES = [
  TIPO_FORMACION.UNIVERSITARIA,
  TIPO_FORMACION.FORMACION_PROFESIONAL,
  LEGACY_TIPO_FORMACION.GRADO,
  LEGACY_TIPO_FORMACION.FP,
] as const;

export const ESTADO_TAREA = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En_Progreso',
  COMPLETADA: 'Completada',
} as const;

export type EstadoTarea = (typeof ESTADO_TAREA)[keyof typeof ESTADO_TAREA];

export const ESTADOS_TAREA = [
  ESTADO_TAREA.PENDIENTE,
  ESTADO_TAREA.EN_PROGRESO,
  ESTADO_TAREA.COMPLETADA,
] as const;

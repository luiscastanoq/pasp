export const ROLES = {
  ADMIN: 'Administrador',
  TUTOR_EMPRESA: 'Tutor_Empresa',
  TUTOR_ACADEMICO: 'Tutor_Academico',
  BECARIO: 'Becario',
} as const;

export type RolUsuario = (typeof ROLES)[keyof typeof ROLES];

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

export const TIPO_FORMACION = {
  UNIVERSITARIA: 'Universitaria',
  FORMACION_PROFESIONAL: 'Formacion_Profesional',
} as const;

export type TipoFormacion =
  (typeof TIPO_FORMACION)[keyof typeof TIPO_FORMACION];

export const TIPO_FORMACION_LEGACY = {
  GRADO: 'GRADO',
  FP: 'FP',
  UNIVERSIDAD: 'Universidad',
} as const;

export type TipoFormacionLegacy =
  (typeof TIPO_FORMACION_LEGACY)[keyof typeof TIPO_FORMACION_LEGACY];

export const TIPO_TUTORIA = {
  EMPRESA_PRINCIPAL: 'Empresa_Principal',
  EMPRESA_SECUNDARIO: 'Empresa_Secundario',
  ACADEMICO: 'Academico',
} as const;

export type TipoTutoria = (typeof TIPO_TUTORIA)[keyof typeof TIPO_TUTORIA];

export type TipoTutoriaEmpresa =
  | (typeof TIPO_TUTORIA)['EMPRESA_PRINCIPAL']
  | (typeof TIPO_TUTORIA)['EMPRESA_SECUNDARIO'];

export type TipoTutoriaBecario = TipoTutoria;

export function normalizeTipoFormacion(
  tipoFormacion: TipoFormacion | TipoFormacionLegacy | string | null,
): TipoFormacion | null {
  if (!tipoFormacion) return null;

  if (
    tipoFormacion === TIPO_FORMACION.UNIVERSITARIA ||
    tipoFormacion === TIPO_FORMACION.FORMACION_PROFESIONAL
  ) {
    return tipoFormacion;
  }

  if (
    tipoFormacion === TIPO_FORMACION_LEGACY.GRADO ||
    tipoFormacion === TIPO_FORMACION_LEGACY.UNIVERSIDAD
  ) {
    return TIPO_FORMACION.UNIVERSITARIA;
  }

  if (tipoFormacion === TIPO_FORMACION_LEGACY.FP) {
    return TIPO_FORMACION.FORMACION_PROFESIONAL;
  }

  return null;
}

// Tipos generales del sistema

export type {
  RolUsuario,
  TipoFormacion,
  TipoFormacionLegacy,
  TipoTutoria,
  TipoTutoriaBecario,
  TipoTutoriaEmpresa,
} from '../shared/constants/domain.constants';

export interface CentroEstudios {
  id: string;
  nombre: string;
  ciudad?: string;
  pais?: string;
}

export interface CentroTrabajo {
  id: string;
  nombre: string;
  ciudad?: string;
  pais?: string;
}

export interface Departamento {
  id: string;
  nombre: string;
  descripcion?: string;
}


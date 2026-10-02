import { ROLES } from '../../../shared/constants/domain.constants';
import type {
  TipoFormacion,
  TipoTutoriaBecario as DomainTipoTutoriaBecario,
} from '../../../shared/constants/domain.constants';
import type {
  Becario,
  BecarioAsignadoEmpresa,
  DatosBecario,
  NuevoUsuarioFormData,
  TipoTutoriaEmpresa,
  TutorAsignadoBecario,
} from '../components/usuario-form/types';

export function mapBecariosEmpresaPayload(
  becariosEmpresa: BecarioAsignadoEmpresa[]
) {
  return becariosEmpresa.map(becario => ({
    becarioId: Number(becario.id),
    tipoTutoria: becario.tipoTutoria as TipoTutoriaEmpresa,
  }));
}

export function mapTutoresAsignadosPayload(
  tutoresAsignados: TutorAsignadoBecario[]
) {
  return tutoresAsignados.map(tutor => ({
    tutorId: Number(tutor.id),
    tipoTutoria: tutor.tipoTutoria as DomainTipoTutoriaBecario,
  }));
}

export function mapBecarioIdsPayload(becariosAsignados: Becario[]) {
  return becariosAsignados.map(becario => Number(becario.id));
}

export function mapNuevoBecarioPayload(
  formData: NuevoUsuarioFormData,
  datosBecario: DatosBecario,
  tutoresAsignados: TutorAsignadoBecario[]
) {
  return {
    nombre: formData.nombre,
    apellidos: formData.apellidos,
    email: formData.emailInterno,
    contrasena: formData.contrasena,
    rol: ROLES.BECARIO,
    practica: formData.practica,
    cliente: formData.cliente,
    horasContrato: Number(datosBecario.horasContrato),
    ayudaEconomica:
      datosBecario.ayudaEconomica.trim() !== ''
        ? Number(datosBecario.ayudaEconomica)
        : undefined,
    equipoEnUso: datosBecario.equipoEnUso.trim() || null,
    fechaInicioPracticas: datosBecario.fechaInicioPracticas,
    fechaFinPracticas: datosBecario.fechaFinPracticas,
    tipoFormacion: datosBecario.tipoFormacion as TipoFormacion,
    nombreFormacion: datosBecario.nombreFormacion,
    centroEstudios: datosBecario.centroEstudios,
    telefonoPersonal: datosBecario.telefonoPersonal.trim() || null,
    emailPersonal: datosBecario.emailPersonal.trim() || null,
    linkedin: datosBecario.linkedin.trim() || null,
    tutoresAsignados: mapTutoresAsignadosPayload(tutoresAsignados),
  };
}

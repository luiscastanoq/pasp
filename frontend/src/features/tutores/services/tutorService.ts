import { fetchWithAuth } from '../../../shared/api/api';
import type {
  GetBecariosResponse,
  BecarioSummary,
  UpdateBecarioData,
  UpdateBecarioResponse,
} from '../../../types/becario';
import type { CrearBecarioPayload } from '../../admin/services/usuariosService';
import type { TutorDisponible } from '../../admin/components/SeleccionarTutoresModal';
import type {
  GetTareasResponse,
  CreateTareaData,
  CreateTareaResponse,
  UpdateTareaData,
  UpdateTareaResponse,
  TareaHistorialEntry,
} from '../../../types/tarea';
import type { FichajeHistorialEntry, PaginationInfo } from '../../../types/fichaje';
import type {
  CreateEvaluacionData,
  CreateEvaluacionResponse,
  Evaluacion,
  GetEvaluacionesResponse,
} from '../../../types/evaluacion';
import type {
  BecarioDetalle,
  TutorAsignadoBecarioEdicion,
  TutorDelBecario,
  UpdateUsuarioData,
  UsuarioDetalle,
} from '../../../types/usuario.types';

/**
 * Obtiene la lista de becarios asignados al tutor logueado
 */
export const getMyBecarios = async (): Promise<BecarioSummary[]> => {
  const response = await fetchWithAuth<GetBecariosResponse>('/tutor/becarios');
  return Array.isArray(response.data) ? response.data : response.data.becarios;
};

export const getMyBecariosAcademicos = async (): Promise<BecarioSummary[]> => {
  const response = await fetchWithAuth<GetBecariosResponse>(
    '/tutor-academico/becarios'
  );
  return Array.isArray(response.data) ? response.data : response.data.becarios;
};

export const getBecarioEditable = async (
  idBecario: number
): Promise<{
  usuario: UsuarioDetalle;
  becario: BecarioDetalle;
  tutorActualId: number;
}> => {
  const response = await fetchWithAuth<{
    success: boolean;
    data: {
      usuario: UsuarioDetalle;
      becario: BecarioDetalle;
      tutorActualId: number;
    };
  }>(`/tutor/becarios/${idBecario}`);
  return response.data;
};

export const getTutoresDisponibles = async (): Promise<TutorDisponible[]> => {
  const response = await fetchWithAuth<{
    success: boolean;
    data: { tutores: Array<Omit<TutorDisponible, 'id'> & { idUsuario: number }> };
  }>('/tutor/tutores-disponibles');

  return response.data.tutores.map(tutor => ({
    id: String(tutor.idUsuario),
    nombre: tutor.nombre,
    apellidos: tutor.apellidos,
    email: tutor.email,
    rol: tutor.rol,
  }));
};

export const getTutoresDelBecario = async (
  idBecario: number
): Promise<{ tutores: TutorDelBecario[]; tutorActualId: number }> => {
  const response = await fetchWithAuth<{
    success: boolean;
    data: { tutores: TutorDelBecario[]; tutorActualId: number };
  }>(`/tutor/becarios/${idBecario}/tutores`);
  return response.data;
};

export const updateBecarioUsuario = async (
  idBecario: number,
  data: UpdateUsuarioData
): Promise<UsuarioDetalle> => {
  const response = await fetchWithAuth<{
    success: boolean;
    data: { usuario: UsuarioDetalle };
  }>(`/tutor/becarios/${idBecario}/usuario`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data.usuario;
};

export const updateTutoresDelBecario = async (
  idBecario: number,
  tutores: TutorAsignadoBecarioEdicion[]
): Promise<void> => {
  await fetchWithAuth(`/tutor/becarios/${idBecario}/tutores`, {
    method: 'PUT',
    body: JSON.stringify({ tutores }),
  });
};

/**
 * Actualiza la información corporativa y académica de un becario
 */
export const updateBecario = async (
  idBecario: number,
  data: UpdateBecarioData & {
    telefonoPersonal?: string | null;
    emailPersonal?: string | null;
    linkedin?: string | null;
  }
): Promise<BecarioSummary> => {
  const response = await fetchWithAuth<UpdateBecarioResponse>(
    `/tutor/becarios/${idBecario}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return response.data;
};

export const toggleEstadoBecario = async (
  idBecario: number
): Promise<{ activo: boolean }> => {
  const response = await fetchWithAuth<{
    success: boolean;
    data: { usuario: { activo: boolean } };
  }>(`/tutor/becarios/${idBecario}/estado`, {
    method: 'PATCH',
  });
  return { activo: response.data.usuario.activo };
};

export const createBecarioAsignado = async (
  data: CrearBecarioPayload
): Promise<void> => {
  await fetchWithAuth('/tutor/becarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteBecario = async (idBecario: number): Promise<void> => {
  await fetchWithAuth(`/tutor/becarios/${idBecario}`, {
    method: 'DELETE',
  });
};

// ============================================
// GESTIÓN DE TAREAS - HU-11
// ============================================

/**
 * Obtiene todas las tareas asignadas a un becario específico
 */
export const getTareasByBecario = async (idBecario: number) => {
  const response = await fetchWithAuth<GetTareasResponse>(
    `/tutor/becarios/${idBecario}/tareas`
  );
  return Array.isArray(response.data) ? response.data : response.data.tareas;
};

/**
 * Crea una nueva tarea para un becario
 */
export const createTarea = async (idBecario: number, data: CreateTareaData) => {
  const response = await fetchWithAuth<CreateTareaResponse>(
    `/tutor/becarios/${idBecario}/tareas`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  return response.data;
};

/**
 * Actualiza una tarea existente
 */
export const updateTarea = async (idTarea: number, data: UpdateTareaData) => {
  const response = await fetchWithAuth<UpdateTareaResponse>(
    `/tutor/tareas/${idTarea}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return response.data;
};

/**
 * Elimina una tarea existente
 */
export const deleteTarea = async (idTarea: number): Promise<void> => {
  await fetchWithAuth(`/tutor/tareas/${idTarea}`, {
    method: 'DELETE',
  });
};

/**
 * Obtiene el historial de cambios de una tarea
 */
export const getTareaHistorial = async (idTarea: number) => {
  const response = await fetchWithAuth<{
    success: boolean;
    data: TareaHistorialEntry[];
  }>(`/tutor/tareas/${idTarea}/historial`);
  return response;
};

// ============================================
// EVALUACIONES - HU-13 / HU-14
// ============================================

/**
 * Obtiene todas las evaluaciones de un becario ordenadas de más reciente a más antigua
 */
export const getEvaluacionesByBecario = async (
  idBecario: number
): Promise<GetEvaluacionesResponse> => {
  const response = await fetchWithAuth<
    GetEvaluacionesResponse | BackendGetEvaluacionesResponse
  >(
    `/tutor/becarios/${idBecario}/evaluaciones`
  );
  if (Array.isArray(response.data)) return response as GetEvaluacionesResponse;

  const backendResponse = response as BackendGetEvaluacionesResponse;
  return {
    success: backendResponse.success,
    data: backendResponse.data.evaluaciones,
    count: backendResponse.data.count,
  };
};

export const getEvaluacionesAcademicasByBecario = async (
  idBecario: number
): Promise<GetEvaluacionesResponse> => {
  const response = await fetchWithAuth<
    GetEvaluacionesResponse | BackendGetEvaluacionesResponse
  >(`/tutor-academico/becarios/${idBecario}/evaluaciones`);
  if (Array.isArray(response.data)) return response as GetEvaluacionesResponse;

  const backendResponse = response as BackendGetEvaluacionesResponse;
  return {
    success: backendResponse.success,
    data: backendResponse.data.evaluaciones,
    count: backendResponse.data.count,
  };
};

/**
 * Elimina una evaluación de un becario
 */
export const deleteEvaluacion = async (
  idBecario: number,
  idEvaluacion: number
): Promise<void> => {
  await fetchWithAuth(
    `/tutor/becarios/${idBecario}/evaluaciones/${idEvaluacion}`,
    { method: 'DELETE' }
  );
};

/**
 * Crea una nueva evaluacion para un becario
 */
export const createEvaluacion = async (
  idBecario: number,
  data: CreateEvaluacionData
): Promise<CreateEvaluacionResponse> => {
  return fetchWithAuth<CreateEvaluacionResponse>(
    `/tutor/becarios/${idBecario}/evaluaciones`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

// ============================================
// FICHAJES DE BECARIOS - HU-12
// ============================================

export interface GetBecarioFichajesParams {
  page?: number;
  limit?: number;
  fechaInicio?: string; // YYYY-MM-DD
  fechaFin?: string;    // YYYY-MM-DD
}

export interface GetBecarioFichajesResponse {
  success: boolean;
  data: FichajeHistorialEntry[];
  pagination: PaginationInfo;
}

type BackendGetEvaluacionesResponse = {
  success: boolean;
  data: {
    evaluaciones: Evaluacion[];
    count: number;
  };
};

type BackendGetBecarioFichajesResponse = {
  success: boolean;
  data: {
    fichajes: FichajeHistorialEntry[];
    pagination: PaginationInfo;
  };
};

/**
 * Obtiene el historial paginado de fichajes de un becario específico.
 * Solo accesible por tutores.
 */
export const getFichajesByBecario = async (
  idBecario: number,
  params: GetBecarioFichajesParams = {}
): Promise<GetBecarioFichajesResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.fechaInicio) query.set('fechaInicio', params.fechaInicio);
  if (params.fechaFin) query.set('fechaFin', params.fechaFin);

  const qs = query.toString();
  const url = `/tutor/becarios/${idBecario}/fichajes${qs ? `?${qs}` : ''}`;

  const response = await fetchWithAuth<
    GetBecarioFichajesResponse | BackendGetBecarioFichajesResponse
  >(url);
  if (Array.isArray(response.data)) {
    const frontendResponse = response as GetBecarioFichajesResponse;
    return {
      ...frontendResponse,
      pagination:
        frontendResponse.pagination ?? {
          total: frontendResponse.data.length,
          page: params.page ?? 1,
          limit: params.limit ?? frontendResponse.data.length,
          totalPages: 1,
        },
    };
  }

  const backendResponse = response as BackendGetBecarioFichajesResponse;
  return {
    success: backendResponse.success,
    data: backendResponse.data.fichajes,
    pagination: backendResponse.data.pagination,
  };
};

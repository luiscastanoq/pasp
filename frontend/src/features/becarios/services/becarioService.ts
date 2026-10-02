/**
 * Servicio para gestión de perfil de becario
 * Endpoints: GET/PUT /api/becario/profile
 */

import { fetchWithAuth } from '../../../shared/api/api';
import type {
  TipoFormacion,
  TipoFormacionLegacy,
} from '../../../shared/constants/domain.constants';
import type { Tarea, TareaHistorialResponse } from '../../../types/tarea';

/**
 * Interface completa del perfil del becario
 * Basada en la respuesta del backend (becarioService.ts)
 */
export interface BecarioProfile {
  idBecario: number;
  idUsuario: number;
  
  // Datos de usuario
  usuario: {
    idUsuario: number;
    email: string;
    nombre: string;
    apellidos: string;
    rol: string;
    activo: boolean;
    createdAt: string;
  };
  
  // Datos corporativos (práctica y cliente)
  corporativo: {
    practica: string | null;
    cliente: string | null;
  };
  
  // Datos académicos
  academico: {
    tipoFormacion: TipoFormacion | TipoFormacionLegacy | null;
    nombreGradoUniversitario: string | null;
    nombreFormacionProfesional: string | null;
    centroEstudios: string | null;
  };
  
  // Datos de contacto
  contacto: {
    telefonoPersonal: string | null;
    emailPersonal: string | null;
    linkedin: string | null;
  };
  
  // Información de prácticas (fechas y horas)
  practicas: {
    fechaInicioPracticas: string | null;
    fechaFinPracticas: string | null;
    horasContrato: number; // CAMBIADO: Horas pactadas en el contrato de prácticas
    ayudaEconomica: number | null;
    equipoEnUso: string | null;
  };
  
  // Tutores asignados
  tutores: Array<{
    idTutor: number;
    nombre: string;
    apellidos: string;
    email: string;
    tipoTutor: string;
    fechaAsignacion: string;
    activo: boolean;
  }>;
}

/**
 * Datos editables del perfil (solo campos personales)
 */
export interface UpdateBecarioProfileData {
  telefonoPersonal?: string | null;
  emailPersonal?: string | null;
  linkedin?: string | null;
}

/**
 * Respuesta del backend para operaciones de perfil
 */
export interface BecarioProfileResponse {
  success: boolean;
  message?: string;
  data: BecarioProfile;
}

export interface UpdateBecarioProfileResponse {
  success: boolean;
  message: string;
  data: BecarioProfile;
}

/**
 * Respuesta para las tareas del becario
 */
export interface BecarioTareasResponse {
  success: boolean;
  data: Tarea[];
}

/**
 * Respuesta para actualizar estado de tarea
 */
export interface UpdateTareaEstadoResponse {
  success: boolean;
  message: string;
  data: Tarea;
}

/**
 * Servicio de gestión de perfil de becario
 */
export const becarioService = {
  /**
   * Obtener el perfil completo del becario autenticado
   * GET /api/becario/profile
   */
  async getMyProfile(): Promise<BecarioProfileResponse> {
    const response = await fetchWithAuth<BecarioProfileResponse>(
      '/becario/profile',
      {
        method: 'GET',
      }
    );

    return response;
  },

  /**
   * Actualizar datos editables del perfil
   * PUT /api/becario/profile
   * Solo permite editar: telefonoPersonal, emailPersonal, linkedin
   */
  async updateMyProfile(
    data: UpdateBecarioProfileData
  ): Promise<UpdateBecarioProfileResponse> {
    const response = await fetchWithAuth<UpdateBecarioProfileResponse>(
      '/becario/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    return response;
  },

  /**
   * Obtener las tareas asignadas al becario autenticado
   * GET /api/becario/tareas
   */
  async getMyTareas(): Promise<BecarioTareasResponse> {
    const response = await fetchWithAuth<BecarioTareasResponse>(
      '/becario/tareas',
      {
        method: 'GET',
      }
    );
    return response;
  },

  /**
   * Actualizar el estado de una tarea del becario autenticado
   * PATCH /api/becario/tareas/:idTarea/estado
   */
  async updateTareaEstado(
    idTarea: number,
    estado: string
  ): Promise<UpdateTareaEstadoResponse> {
    const response = await fetchWithAuth<UpdateTareaEstadoResponse>(
      `/becario/tareas/${idTarea}/estado`,
      {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      }
    );
    return response;
  },

  /**
   * Obtener el historial de cambios de estado de una tarea
   * GET /api/becario/tareas/:idTarea/historial
   */
  async getTareaHistorial(idTarea: number): Promise<TareaHistorialResponse> {
    const response = await fetchWithAuth<TareaHistorialResponse>(
      `/becario/tareas/${idTarea}/historial`,
      { method: 'GET' }
    );
    return response;
  },
};

import { fetchWithAuth } from '../../../shared/api/api';
import type {
  Becario,
  BecarioAsignadoTutorAcademico,
  BecarioDetalle,
  BecarioDisponible,
  CrearAdministradorPayload,
  CrearBecarioPayload,
  CrearTutorEmpresaPayload,
  CrearTutorAcademicoPayload,
  CrearUsuarioResponse,
  SuccessResponse,
  TipoTutoriaEmpresa,
  TutorAsignadoBecarioEdicion,
  TutorDelBecario,
  UpdateBecarioDetalleData,
  UpdateUsuarioData,
  Usuario,
  UsuarioAdmin,
  UsuarioDetalle,
  UsuarioResponse,
} from './usuarios.types';
import type { CrearUsuarioDTO } from '../../../types/usuario.types';

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type UsuarioDataResponse = ApiSuccess<{ usuario: UsuarioDetalle }>;
type CrearUsuarioApiResponse = ApiSuccess<{
  usuario: UsuarioAdmin & { createdAt: string };
}>;

class UsuariosService {
  private readonly baseUrl = '/usuarios';

  async getAllUsuarios(): Promise<UsuarioAdmin[]> {
    const response = await fetchWithAuth<
      UsuarioAdmin[] | ApiSuccess<{ usuarios: UsuarioAdmin[] }>
    >(this.baseUrl);
    return Array.isArray(response) ? response : response.data.usuarios;
  }

  async crearUsuario(data: CrearUsuarioDTO): Promise<Usuario> {
    const response = await fetchWithAuth<Usuario | CrearUsuarioApiResponse>(
      this.baseUrl,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return ('data' in response ? response.data.usuario : response) as Usuario;
  }

  private normalizeCrearUsuarioResponse(
    response: CrearUsuarioResponse | CrearUsuarioApiResponse,
  ): CrearUsuarioResponse {
    if ('data' in response) {
      return {
        success: response.success,
        message: response.message ?? '',
        usuario: response.data.usuario,
      };
    }

    return response;
  }

  private normalizeUsuarioResponse(
    response: UsuarioResponse | UsuarioDataResponse,
  ): UsuarioDetalle {
    return 'data' in response ? response.data.usuario : response.usuario;
  }

  async crearAdministrador(
    payload: CrearAdministradorPayload,
  ): Promise<CrearUsuarioResponse> {
    const response = await fetchWithAuth<
      CrearUsuarioResponse | CrearUsuarioApiResponse
    >(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.normalizeCrearUsuarioResponse(response);
  }

  async crearTutorAcademico(
    payload: CrearTutorAcademicoPayload,
  ): Promise<CrearUsuarioResponse> {
    const response = await fetchWithAuth<
      CrearUsuarioResponse | CrearUsuarioApiResponse
    >(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.normalizeCrearUsuarioResponse(response);
  }

  async crearTutorEmpresa(
    payload: CrearTutorEmpresaPayload,
  ): Promise<CrearUsuarioResponse> {
    const response = await fetchWithAuth<
      CrearUsuarioResponse | CrearUsuarioApiResponse
    >(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.normalizeCrearUsuarioResponse(response);
  }

  async crearBecario(
    payload: CrearBecarioPayload,
  ): Promise<CrearUsuarioResponse> {
    const response = await fetchWithAuth<
      CrearUsuarioResponse | CrearUsuarioApiResponse
    >(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.normalizeCrearUsuarioResponse(response);
  }

  async obtenerBecarios(): Promise<BecarioDisponible[]> {
    const response = await fetchWithAuth<
      BecarioDisponible[] | ApiSuccess<{ becarios: BecarioDisponible[] }>
    >(`${this.baseUrl}/becarios`);
    return Array.isArray(response) ? response : response.data.becarios;
  }

  async getUsuarioById(id: number): Promise<UsuarioDetalle> {
    const response = await fetchWithAuth<UsuarioResponse | UsuarioDataResponse>(
      `${this.baseUrl}/${id}`,
    );
    return this.normalizeUsuarioResponse(response);
  }

  async updateAdministrador(
    id: number,
    data: UpdateUsuarioData,
  ): Promise<UsuarioDetalle> {
    const response = await fetchWithAuth<UsuarioResponse | UsuarioDataResponse>(
      `${this.baseUrl}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );
    return this.normalizeUsuarioResponse(response);
  }

  async toggleEstadoUsuario(id: number): Promise<UsuarioDetalle> {
    const response = await fetchWithAuth<UsuarioResponse | UsuarioDataResponse>(
      `${this.baseUrl}/${id}/estado`,
      {
        method: 'PATCH',
      },
    );
    return this.normalizeUsuarioResponse(response);
  }

  async deleteUsuario(id: number): Promise<void> {
    await fetchWithAuth<SuccessResponse>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  async getBecariosDeTutorAcademico(
    tutorId: number,
  ): Promise<BecarioAsignadoTutorAcademico[]> {
    const response = await fetchWithAuth<
      | BecarioAsignadoTutorAcademico[]
      | ApiSuccess<{ becarios: BecarioAsignadoTutorAcademico[] }>
    >(
      `${this.baseUrl}/${tutorId}/becarios-tutor-academico`,
    );
    return Array.isArray(response) ? response : response.data.becarios;
  }

  async actualizarBecariosDeTutorAcademico(
    tutorId: number,
    becarioIds: number[],
  ): Promise<{ success: boolean; message?: string; cantidadBecarios: number }> {
    const response = await fetchWithAuth<
      | { success: boolean; message?: string; cantidadBecarios: number }
      | ApiSuccess<{ cantidadBecarios: number }>
    >(`${this.baseUrl}/${tutorId}/becarios-tutor-academico`, {
      method: 'PUT',
      body: JSON.stringify({ becarioIds }),
    });
    if ('cantidadBecarios' in response) return response;
    return {
      success: response.success,
      message: response.message,
      cantidadBecarios: response.data.cantidadBecarios,
    };
  }

  async getBecariosDeTutorEmpresa(
    tutorId: number,
  ): Promise<Array<Becario & { tipoTutoria: TipoTutoriaEmpresa }>> {
    const response = await fetchWithAuth<
      | Array<Becario & { tipoTutoria: TipoTutoriaEmpresa }>
      | ApiSuccess<{
          becarios: Array<Becario & { tipoTutoria: TipoTutoriaEmpresa }>;
        }>
    >(
      `${this.baseUrl}/${tutorId}/becarios-tutor-empresa`,
    );
    return Array.isArray(response) ? response : response.data.becarios;
  }

  async actualizarBecariosDeTutorEmpresa(
    tutorId: number,
    becarios: Array<{ becarioId: number; tipoTutoria: TipoTutoriaEmpresa }>,
  ): Promise<{ success: boolean; cantidadBecarios: number }> {
    const response = await fetchWithAuth<
      | { success: boolean; cantidadBecarios: number }
      | ApiSuccess<{ cantidadBecarios: number }>
    >(
      `${this.baseUrl}/${tutorId}/becarios-tutor-empresa`,
      {
        method: 'PUT',
        body: JSON.stringify({ becarios }),
      },
    );
    if ('cantidadBecarios' in response) return response;
    return {
      success: response.success,
      cantidadBecarios: response.data.cantidadBecarios,
    };
  }

  async getBecarioDetalle(idUsuario: number): Promise<BecarioDetalle> {
    const response = await fetchWithAuth<
      BecarioDetalle | ApiSuccess<{ becario: BecarioDetalle }>
    >(
      `${this.baseUrl}/${idUsuario}/becario-detalle`,
    );
    return 'data' in response ? response.data.becario : response;
  }

  async updateBecarioDetalle(
    idUsuario: number,
    data: UpdateBecarioDetalleData,
  ): Promise<{ success: boolean; message: string; becario: BecarioDetalle }> {
    const response = await fetchWithAuth<
      | { success: boolean; message: string; becario: BecarioDetalle }
      | ApiSuccess<{ becario: BecarioDetalle }>
    >(`${this.baseUrl}/${idUsuario}/becario-detalle`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if ('becario' in response) return response;
    return {
      success: response.success,
      message: response.message ?? '',
      becario: response.data.becario,
    };
  }

  async getTutoresDelBecario(idUsuario: number): Promise<TutorDelBecario[]> {
    const response = await fetchWithAuth<
      TutorDelBecario[] | ApiSuccess<{ tutores: TutorDelBecario[] }>
    >(
      `${this.baseUrl}/${idUsuario}/tutores`,
    );
    return Array.isArray(response) ? response : response.data.tutores;
  }

  async actualizarTutoresDelBecario(
    idUsuario: number,
    tutores: TutorAsignadoBecarioEdicion[],
  ): Promise<{ success: boolean; message: string; cantidadTutores: number }> {
    const response = await fetchWithAuth<
      | { success: boolean; message: string; cantidadTutores: number }
      | ApiSuccess<{ cantidadTutores: number }>
    >(`${this.baseUrl}/${idUsuario}/tutores`, {
      method: 'PUT',
      body: JSON.stringify({ tutores }),
    });
    if ('cantidadTutores' in response) return response;
    return {
      success: response.success,
      message: response.message ?? '',
      cantidadTutores: response.data.cantidadTutores,
    };
  }
}

export const usuariosService = new UsuariosService();

export type {
  BecarioAsignadoTutorAcademico,
  BecarioDisponible,
  CrearAdministradorPayload,
  CrearBecarioPayload,
  CrearTutorEmpresaPayload,
  CrearTutorAcademicoPayload,
  CrearUsuarioResponse,
  UsuarioAdmin,
};

export default usuariosService;

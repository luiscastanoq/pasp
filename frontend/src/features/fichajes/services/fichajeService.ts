/**
 * Servicio de Fichaje - PASP (Simplificado v2.1)
 * Sistema simplificado de registro de entrada/salida
 * Endpoints: POST /api/fichaje/entrada, PUT /api/fichaje/:id/salida, GET /api/fichaje/activo
 */

import { fetchWithAuth } from '../../../shared/api/api';
import type {
  FicharEntradaResponse,
  FicharSalidaResponse,
  FichajeActivoResponse,
  FicharSalidaData,
  FichajeHistorialResponse,
} from '../../../types/fichaje';

/**
 * Servicio de gestión de fichajes
 */
export const fichajeService = {
  /**
   * Registrar entrada (fichaje de entrada)
   * POST /api/fichaje/entrada
   */
  async ficharEntrada(): Promise<FicharEntradaResponse> {
    const response = await fetchWithAuth<FicharEntradaResponse>(
      '/fichaje/entrada',
      {
        method: 'POST',
      }
    );

    return response;
  },

  /**
   * Registrar salida (fichaje de salida) con horas imputadas
   * PUT /api/fichaje/:idFichaje/salida
   */
  async ficharSalida(
    idFichaje: number,
    data: FicharSalidaData
  ): Promise<FicharSalidaResponse> {
    const response = await fetchWithAuth<FicharSalidaResponse>(
      `/fichaje/${idFichaje}/salida`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    return response;
  },

  /**
   * Obtener fichaje activo (sin salida registrada) del becario autenticado
   * GET /api/fichaje/activo
   */
  async getFichajeActivo(): Promise<FichajeActivoResponse> {
    const response = await fetchWithAuth<FichajeActivoResponse>(
      '/fichaje/activo',
      {
        method: 'GET',
      }
    );

    return response;
  },

  /**
   * Obtener historial paginado de fichajes del becario autenticado
   * GET /api/fichaje/historial?page=1&limit=10&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
   */
  async getHistorialFichajes(params?: {
    page?: number;
    limit?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<FichajeHistorialResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.fechaInicio) queryParams.set('fechaInicio', params.fechaInicio);
    if (params?.fechaFin) queryParams.set('fechaFin', params.fechaFin);

    const query = queryParams.toString();
    const endpoint = query ? `/fichaje/historial?${query}` : '/fichaje/historial';

    const response = await fetchWithAuth<FichajeHistorialResponse>(endpoint, {
      method: 'GET',
    });

    return response;
  },
};

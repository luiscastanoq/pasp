import { fetchWithAuth } from "../../../shared/api/api";

export interface UsersStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  pendientesPrimerAcceso: number;
}

type UsersStatsResponse =
  | UsersStats
  | { stats: UsersStats }
  | { success: boolean; data: UsersStats | { stats: UsersStats } };

/**
 * Obtiene las estadisticas globales de usuarios para los KPIs del dashboard
 */
export const getUsersStats = async (): Promise<UsersStats> => {
  const response = await fetchWithAuth<UsersStatsResponse>('/admin/stats');

  if ('totalUsuarios' in response) return response;
  if ('stats' in response) return response.stats;
  if ('stats' in response.data) return response.data.stats;
  return response.data;
};

import { prisma } from '../database/prisma';

export interface UsersStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  pendientesPrimerAcceso: number;
}

/**
 * Obtiene las estadisticas globales de usuarios del sistema
 * para las tarjetas KPI del dashboard del administrador
 */
export const getUsersStats = async (
  hideSuperAdmin = false,
): Promise<UsersStats> => {
  const visibleUsers = hideSuperAdmin ? { esSuperAdmin: false } : undefined;
  const [totalUsuarios, usuariosActivos, usuariosInactivos, pendientesPrimerAcceso] =
    await Promise.all([
      prisma.usuario.count({ where: visibleUsers }),
      prisma.usuario.count({ where: { ...visibleUsers, activo: true } }),
      prisma.usuario.count({ where: { ...visibleUsers, activo: false } }),
      prisma.usuario.count({ where: { ...visibleUsers, primerAcceso: true } }),
    ]);

  return {
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos,
    pendientesPrimerAcceso,
  };
};

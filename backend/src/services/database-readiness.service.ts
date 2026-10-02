import { prisma } from '../database/prisma';

/**
 * Ejecuta una consulta mínima y de solo lectura.
 *
 * Si la promesa se resuelve, Prisma ha podido abrir una conexión y Azure SQL
 * está preparada. El error se conserva intacto para que el controlador decida
 * si se trata de un arranque transitorio o de un fallo inesperado.
 */
export async function checkDatabaseReadiness(): Promise<void> {
  await prisma.$queryRaw`SELECT 1 AS ready`;
}

import { Response } from 'express';

import { ApiErrorResponse } from './responses';

export const DATABASE_RETRY_AFTER_SECONDS = 5;

/**
 * Mantiene un único contrato HTTP para todos los puntos que pueden despertar
 * Azure SQL. No incluye el error original ni detalles de la conexión.
 */
export function sendDatabaseWakingUp(
  res: Response
): Response<ApiErrorResponse> {
  res.setHeader('Retry-After', String(DATABASE_RETRY_AFTER_SECONDS));

  return res.status(503).json({
    success: false,
    code: 'DATABASE_WAKING_UP',
    message: 'La base de datos se está iniciando',
  });
}

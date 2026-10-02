import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { isAppError, NotFoundError } from '../shared/errors';
import { ApiErrorResponse } from '../shared/http';

type LegacyHttpError = Error & {
  statusCode?: number;
  code?: string;
  errors?: unknown[];
};

function toErrorResponse(error: unknown): {
  statusCode: number;
  body: ApiErrorResponse;
} {
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
        ...(env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
      },
    };
  }

  if (error instanceof Error) {
    const legacyError = error as LegacyHttpError;
    const statusCode = legacyError.statusCode ?? 500;

    return {
      statusCode,
      body: {
        success: false,
        code: legacyError.code ?? (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
        message: statusCode >= 500 ? 'Error interno del servidor' : legacyError.message,
        ...(legacyError.errors ? { details: legacyError.errors } : {}),
        ...(env.NODE_ENV === 'development' ? { stack: legacyError.stack } : {}),
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
    },
  };
}

/**
 * Middleware de manejo centralizado de errores
 * Captura todos los errores que ocurran en la aplicación
 * y retorna una respuesta consistente al cliente
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next;

  const { statusCode, body } = toErrorResponse(err);

  logger.error('Error capturado', {
    statusCode,
    code: body.code,
    message: err instanceof Error ? err.message : 'Error no tipado',
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  res.status(statusCode).json(body);
};

/**
 * Middleware para capturar rutas no encontradas (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  void res;
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.path}`));
};

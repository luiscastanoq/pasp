import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.util';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';
import { normalizeRolUsuario } from '../shared/constants/domain.constants';
import { demoWriteError, isReadMethod } from './demo.middleware';
import { env } from '../config/env';

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

/**
 * Middleware de autenticación JWT
 * Verifica que la petición incluya un token válido en el header Authorization
 * Si es válido, adjunta los datos del usuario a req.user
 * Si no es válido, retorna error 401 Unauthorized
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  void res;

  try {
    // Obtener el header de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Si no hay token, retornar error
    if (!token) {
      next(new UnauthorizedError('Token de autenticación no proporcionado'));
      return;
    }

    // Verificar el token
    const decoded = verifyToken(token);

    // Adjuntar datos del usuario al request
    req.user = decoded;

    const isSuperAdmin =
      decoded.esSuperAdmin === true && decoded.role === 'Administrador';
    if (
      (decoded.demo || (env.DEMO_MODE && !isSuperAdmin)) &&
      !isReadMethod(req.method)
    ) {
      next(demoWriteError());
      return;
    }

    // Continuar con el siguiente middleware/controlador
    next();
  } catch (error) {
    next(
      new UnauthorizedError(
        error instanceof Error ? error.message : 'Token inválido'
      )
    );
  }
};

/**
 * Middleware para verificar roles específicos
 * Debe usarse después del middleware authenticateToken
 * @param roles - Array de roles permitidos
 */
export const authorizeRoles = (...roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    void res;

    // Verificar que el usuario esté autenticado
    if (!req.user) {
      next(new UnauthorizedError('Usuario no autenticado'));
      return;
    }

    // Verificar que el rol del usuario esté en la lista de roles permitidos
    const userRole = normalizeRolUsuario(req.user.role);
    const allowedRoles = roles.map(normalizeRolUsuario);
    if (!allowedRoles.includes(userRole)) {
      next(
        new ForbiddenError('No tienes permisos para acceder a este recurso')
      );
      return;
    }

    // Usuario autorizado, continuar
    next();
  };
};

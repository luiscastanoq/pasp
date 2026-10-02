import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt.util';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';
import { normalizeRolUsuario, ROLES } from '../shared/constants/domain.constants';

// Extender el tipo Request para incluir la propiedad user
interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 * @param allowedRoles - Array de roles que tienen permiso para acceder
 * @returns Middleware function
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    void res;

    // Verificar que el usuario está autenticado (debe pasar primero por auth.middleware.ts)
    if (!req.user) {
      next(new UnauthorizedError('Usuario no autenticado'));
      return;
    }

    // Verificar que el usuario tiene un rol asignado
    const userRole = normalizeRolUsuario(req.user.role);
    if (!userRole) {
      next(new ForbiddenError('El usuario no tiene un rol asignado'));
      return;
    }

    // Verificar que el rol del usuario está en la lista de roles permitidos
    const normalizedAllowedRoles = allowedRoles.map(normalizeRolUsuario);
    if (!normalizedAllowedRoles.includes(userRole)) {
      next(
        new ForbiddenError(
          `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
        ),
      );
      return;
    }

    // Si todo es correcto, continuar con la siguiente función
    next();
  };
};

/**
 * Middleware específico para rutas que solo pueden acceder tutores
 */
export const requireTutor = requireRole([ROLES.TUTOR_EMPRESA, ROLES.ADMINISTRADOR]);

/**
 * Middleware específico para rutas de lectura del tutor académico
 */
export const requireTutorAcademico = requireRole([
  ROLES.TUTOR_ACADEMICO,
  ROLES.ADMINISTRADOR,
]);

/**
 * Middleware específico para rutas que solo pueden acceder administradores
 */
export const requireAdmin = requireRole([ROLES.ADMINISTRADOR]);

/**
 * Middleware específico para rutas que solo pueden acceder becarios
 */
export const requireBecario = requireRole([ROLES.BECARIO, ROLES.ADMINISTRADOR]);

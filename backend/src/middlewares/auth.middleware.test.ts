import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticateToken, authorizeRoles } from './auth.middleware';
import { verifyToken } from '../utils/jwt.util';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';

vi.mock('../utils/jwt.util', () => ({
  verifyToken: vi.fn(),
}));

describe('middlewares de autenticacion y permisos', () => {
  const response = {} as Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('acepta un token valido y coloca el usuario en la peticion', () => {
    // El resto de la API depende de req.user para saber quien esta realizando la accion.
    const request = { headers: { authorization: 'Bearer token-valido' } } as Request;
    vi.mocked(verifyToken).mockReturnValue({
      userId: 4,
      email: 'tutor@test.com',
      role: 'Tutor_Empresa',
      esSuperAdmin: false,
    });

    authenticateToken(request, response, next);

    expect(request.user?.userId).toBe(4);
    expect(next).toHaveBeenCalledWith();
  });

  it('rechaza peticiones sin token o con token invalido', () => {
    // Una ruta protegida nunca debe continuar si falta la sesion o no se puede verificar.
    authenticateToken({ headers: {} } as Request, response, next);
    expect(next).toHaveBeenLastCalledWith(expect.any(UnauthorizedError));

    vi.mocked(verifyToken).mockImplementation(() => { throw new Error('Token inválido'); });
    authenticateToken(
      { headers: { authorization: 'Bearer roto' } } as Request,
      response,
      next,
    );
    expect(next).toHaveBeenLastCalledWith(expect.any(UnauthorizedError));
  });

  it('permite un rol de tutor académico autorizado', () => {
    const request = {
      user: { userId: 3, email: 'tutor@test.com', role: 'Tutor_Academico' },
    } as Request;

    authorizeRoles('Tutor_Academico')(request, response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rechaza un rol no permitido', () => {
    // Cambiar el rol del token no debe abrir una ruta reservada para administradores.
    const request = {
      user: { userId: 8, email: 'becario@test.com', role: 'Becario' },
    } as Request;

    authorizeRoles('Administrador')(request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

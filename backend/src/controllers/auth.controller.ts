import { Request, Response } from 'express';
import {
  loginUser,
  LoginCredentials,
  changePassword,
  ChangePasswordData,
} from '../services/auth.service';
import {
  logAuthSuccess,
  logAuthFailure,
  logError,
  logger,
} from '../config/logger';
import { BadRequestError, UnauthorizedError } from '../shared/errors';
import {
  asyncHandler,
  sendDatabaseWakingUp,
  sendSuccess,
} from '../shared/http';
import { isTransientDatabaseError } from '../shared/database/database-retry';

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Controlador para el endpoint de login
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const clientIp = getClientIp(req);
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email y contraseña son requeridos');
  }

  if (typeof email !== 'string' || !isValidEmail(email)) {
    throw new BadRequestError('Formato de email inválido');
  }

  const credentials: LoginCredentials = {
    email: email.toLowerCase().trim(),
    password,
  };

  try {
    const result = await loginUser(credentials);

    logAuthSuccess(credentials.email, result.user.rol, clientIp);

    sendSuccess(res, result, 200, 'Login exitoso');
  } catch (error) {
    if (isTransientDatabaseError(error)) {
      logger.warn('Login aplazado mientras Azure SQL se inicia', {
        code: 'DATABASE_WAKING_UP',
        clientIp,
        requestId: req.requestId,
      });
      sendDatabaseWakingUp(res);
      return;
    }

    if (error instanceof Error) {
      if (
        error.message === 'Credenciales inválidas' ||
        error.message === 'Cuenta inactiva'
      ) {
        logAuthFailure(credentials.email, clientIp, error.message);
        throw new UnauthorizedError(error.message);
      }
    }

    logError(error as Error, 'Error en login');
    throw error;
  }
});

/**
 * Controlador para el endpoint de cambio de contraseña
 * PATCH /api/auth/change-password
 */
export const changePasswordController = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Contraseña actual y nueva contraseña son requeridas');
  }

  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('No autorizado');
  }

  const changePasswordData: ChangePasswordData = {
    userId,
    currentPassword,
    newPassword,
  };

  try {
    const result = await changePassword(changePasswordData);

    sendSuccess(res, null, 200, result.message);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'La contraseña actual es incorrecta' ||
        error.message.includes('debe tener al menos 8 caracteres') ||
        error.message === 'Usuario no encontrado'
      ) {
        throw new BadRequestError(error.message);
      }
    }

    logError(error as Error, 'Error en cambio de contraseña');
    throw error;
  }
});

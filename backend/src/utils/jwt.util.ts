import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Interfaz para el payload del JWT
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  esSuperAdmin: boolean;
  demo?: boolean;
}

function createTokenError(message: string, cause: unknown): Error {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
}

/**
 * Genera un token JWT
 * @param payload - Datos del usuario a incluir en el token
 * @returns Token JWT firmado
 */
export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: (payload.demo
      ? env.DEMO_JWT_EXPIRES_IN
      : env.JWT_EXPIRES_IN) as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Verifica y decodifica un token JWT
 * @param token - Token JWT a verificar
 * @returns Payload decodificado si el token es válido
 * @throws Error si el token es inválido o ha expirado
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createTokenError('El token ha expirado', error);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createTokenError('Token inválido', error);
    }
    throw error;
  }
};

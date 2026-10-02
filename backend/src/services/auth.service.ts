import { prisma } from '../database/prisma';
import type { Usuario } from '@prisma/client';
import { env } from '../config/env';
import { comparePassword, hashPassword } from '../utils/password.util';
import { generateToken, JwtPayload } from '../utils/jwt.util';
import { normalizeRolUsuario } from '../shared/constants/domain.constants';
import { retryTransientDatabaseOperation } from '../shared/database/database-retry';

/**
 * Interfaz para las credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interfaz para la respuesta de login exitoso
 * ACTUALIZADO PARA SCHEMA V2.0: Incluye nombre, apellidos, practica, cliente
 */
export interface LoginResponse {
  token: string;
  user: {
    idUsuario: number;
    email: string;
    rol: string;
    nombre: string;
    apellidos: string;
    practica: string | null;
    cliente: string | null;
    primerAcceso: boolean;
    esSuperAdmin: boolean;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Servicio de autenticación de usuarios
 * @param credentials - Email y contraseña del usuario
 * @returns Token JWT y datos del usuario si las credenciales son válidas
 * @throws Error si las credenciales son inválidas o el usuario no existe
 */
export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const { email, password } = credentials;

  // Buscar usuario por email
  const user = await retryTransientDatabaseOperation(() =>
    prisma.usuario.findUnique({
      where: { email },
    })
  );

  // Si el usuario no existe, lanzar error genérico
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  if (env.DEMO_MODE && user.email.endsWith('@pasp-demo.test')) {
    throw new Error('Credenciales inválidas');
  }

  // Verificar si el usuario está activo
  if (!user.activo) {
    throw new Error('Cuenta inactiva');
  }

  // Comparar contraseña
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  return createLoginResponse(user, env.DEMO_MODE && !user.esSuperAdmin);
};

export function createLoginResponse(
  user: Usuario,
  demo = false
): LoginResponse {
  // Generar payload del JWT
  const rolNormalizado = normalizeRolUsuario(user.rol);

  const payload: JwtPayload = {
    userId: user.idUsuario,
    email: user.email,
    role: rolNormalizado,
    esSuperAdmin: user.esSuperAdmin,
    ...(demo ? { demo: true } : {}),
  };

  // Generar token JWT
  const token = generateToken(payload);

  // Retornar token y datos del usuario (sin contraseña)
  // INCLUYE NUEVOS CAMPOS DE SCHEMA V2.0
  return {
    token,
    user: {
      idUsuario: user.idUsuario,
      email: user.email,
      rol: rolNormalizado,
      nombre: user.nombre,
      apellidos: user.apellidos,
      practica: user.practica,
      cliente: user.cliente,
      primerAcceso: demo ? false : user.primerAcceso,
      esSuperAdmin: user.esSuperAdmin,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

/**
 * Interfaz para el cambio de contraseña
 */
export interface ChangePasswordData {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

/**
 * Valida que la contraseña cumpla con los requisitos de seguridad
 * - Mínimo 8 caracteres
 * - Al menos una letra
 * - Al menos un número
 */
const validatePasswordStrength = (password: string): boolean => {
  if (password.length < 8) {
    return false;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasLetter && hasNumber;
};

/**
 * Servicio para cambiar la contraseña de un usuario
 * @param data - Datos para el cambio de contraseña (userId, currentPassword, newPassword)
 * @returns Usuario actualizado
 * @throws Error si la contraseña actual es incorrecta o la nueva no cumple requisitos
 */
export const changePassword = async (
  data: ChangePasswordData
): Promise<{ success: boolean; message: string }> => {
  const { userId, currentPassword, newPassword } = data;

  // Buscar usuario por ID
  const user = await prisma.usuario.findUnique({
    where: { idUsuario: userId },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isCurrentPasswordValid = await comparePassword(
    currentPassword,
    user.passwordHash
  );

  if (!isCurrentPasswordValid) {
    throw new Error('La contraseña actual es incorrecta');
  }

  // Validar fortaleza de la nueva contraseña
  if (!validatePasswordStrength(newPassword)) {
    throw new Error(
      'La nueva contraseña debe tener al menos 8 caracteres, incluyendo letras y números'
    );
  }

  // Hashear nueva contraseña
  const newPasswordHash = await hashPassword(newPassword);

  // Actualizar contraseña y marcar primerAcceso como false
  await prisma.usuario.update({
    where: { idUsuario: userId },
    data: {
      passwordHash: newPasswordHash,
      primerAcceso: false,
      updatedAt: new Date(),
    },
  });

  return {
    success: true,
    message: 'Contraseña actualizada exitosamente',
  };
};

/**
 * Cierra la conexión con Prisma
 * Útil para testing y cierre limpio de la aplicación
 */
export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};

import bcrypt from 'bcrypt';
import { createErrorWithCause } from '../shared/errors';

/**
 * Número de rondas para el algoritmo de hashing de bcrypt
 * Cuanto mayor sea el número, más seguro pero más lento
 */
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Contraseña hasheada
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw createErrorWithCause('Error al hashear la contraseña', error);
  }
};

/**
 * Compara una contraseña en texto plano con un hash
 * @param password - Contraseña en texto plano a verificar
 * @param hashedPassword - Hash de contraseña almacenado en la base de datos
 * @returns true si la contraseña coincide, false en caso contrario
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw createErrorWithCause('Error al comparar contraseñas', error);
  }
};

/**
 * Configuración de Winston Logger para el sistema PASP
 * 
 * Este logger gestiona:
 * - Logs de autenticación (login exitoso/fallido)
 * - Logs de errores del sistema
 * - Rotación automática diaria de archivos
 * - Retención de logs por 30 días
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from './env';

// Directorio donde se almacenarán los logs
const logsDir = path.join(__dirname, '../../logs');

// Formato personalizado para los logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = ` | ${JSON.stringify(meta)}`;
    }
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaString}`;
  })
);

// Configuración para logs de autenticación (auth.log)
const authTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: 'auth-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d', // Retención de 30 días
  maxSize: '20m', // Máximo 20MB por archivo
  level: 'info',
  format: logFormat,
  auditFile: path.join(logsDir, 'auth-audit.json'),
});

// Configuración para logs de errores (error.log)
const errorTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  level: 'error',
  format: logFormat,
  auditFile: path.join(logsDir, 'error-audit.json'),
});

// Configuración para logs combinados (combined.log)
const combinedTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  format: logFormat,
  auditFile: path.join(logsDir, 'combined-audit.json'),
});

// Logger principal del sistema
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports:
    env.NODE_ENV === 'production'
      ? [new winston.transports.Console({ format: logFormat })]
      : [combinedTransport, errorTransport],
  // No salir en caso de error
  exitOnError: false,
});

// Logger específico para autenticación
export const authLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports:
    env.NODE_ENV === 'production'
      ? [new winston.transports.Console({ format: logFormat })]
      : [authTransport, combinedTransport],
  exitOnError: false,
});

// En desarrollo, también mostrar logs en consola
if (env.NODE_ENV !== 'production') {
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let metaString = '';
      if (Object.keys(meta).length > 0) {
        metaString = ` ${JSON.stringify(meta)}`;
      }
      return `[${timestamp}] ${level}: ${message}${metaString}`;
    })
  );

  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );

  authLogger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Funciones auxiliares para logging de autenticación
export const logAuthSuccess = (email: string, role: string, ip?: string) => {
  authLogger.info('Login exitoso', {
    email,
    role,
    ip: ip || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

export const logAuthFailure = (email: string, ip?: string, reason?: string) => {
  authLogger.warn('Login fallido', {
    email,
    ip: ip || 'unknown',
    reason: reason || 'Credenciales inválidas',
    timestamp: new Date().toISOString(),
  });
};

// Función auxiliar para logging de errores
export const logError = (error: Error, context?: string) => {
  logger.error(context || 'Error en el sistema', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

export default logger;

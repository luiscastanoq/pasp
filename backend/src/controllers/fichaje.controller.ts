/**
 * Controlador de Fichaje - PASP (Simplificado v2.1)
 * Endpoints REST para gestion de entrada/salida
 */

import { Request, Response } from 'express';
import * as fichajeService from '../services/fichaje.service';
import { prisma } from '../database/prisma';
import logger from '../config/logger';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../shared/errors';
import { asyncHandler, sendCreated, sendSuccess } from '../shared/http';

function getAuthenticatedUserId(req: Request): number {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('No autenticado');
  }

  return userId;
}

function parseIdParam(value: unknown, message: string): number {
  if (typeof value !== 'string') {
    throw new BadRequestError(message);
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError(message);
  }

  return id;
}

async function getBecarioByAuthenticatedUser(userId: number) {
  const becario = await prisma.becario.findUnique({
    where: { idUsuario: userId },
  });

  if (!becario) {
    throw new NotFoundError('Perfil de becario no encontrado');
  }

  return becario;
}

function mapServiceError(error: unknown, fallbackMessage: string): never {
  if (error instanceof Error) {
    if (
      error.message.includes('no encontrado') ||
      error.message.includes('no encontrada')
    ) {
      throw new NotFoundError(error.message);
    }

    throw new BadRequestError(error.message || fallbackMessage);
  }

  throw new BadRequestError(fallbackMessage);
}

/**
 * POST /api/fichaje/entrada
 * Registra la entrada de jornada
 */
export const ficharEntrada = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const becario = await getBecarioByAuthenticatedUser(userId);

  try {
    const fichaje = await fichajeService.ficharEntrada({
      idBecario: becario.idBecario,
    });

    sendCreated(res, {
      idFichaje: fichaje.idFichaje,
      fecha: fichaje.fecha,
      horaEntrada: fichaje.horaEntrada,
    }, 'Entrada registrada correctamente');
  } catch (error) {
    logger.error('Error al fichar entrada', { error });
    mapServiceError(error, 'Error al registrar entrada');
  }
});

/**
 * PUT /api/fichaje/:id/salida
 * Registra la salida de jornada con horas imputadas
 */
export const ficharSalida = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const idFichaje = parseIdParam(req.params.id, 'ID de fichaje invalido');
  const { horasImputadas } = req.body;

  if (typeof horasImputadas !== 'number') {
    throw new BadRequestError('Las horas imputadas son obligatorias y deben ser un numero');
  }

  const becario = await getBecarioByAuthenticatedUser(userId);

  const fichaje = await prisma.fichaje.findUnique({
    where: { idFichaje },
  });

  if (!fichaje || fichaje.idBecario !== becario.idBecario) {
    throw new ForbiddenError('No tienes permiso para modificar este fichaje');
  }

  try {
    const fichajeActualizado = await fichajeService.ficharSalida(idFichaje, {
      horasImputadas,
    });

    sendSuccess(res, {
      idFichaje: fichajeActualizado.idFichaje,
      fecha: fichajeActualizado.fecha,
      horaEntrada: fichajeActualizado.horaEntrada,
      horaSalida: fichajeActualizado.horaSalida,
      horasTrabajadas: fichajeActualizado.horasTrabajadas,
      horasImputadas: fichajeActualizado.horas_imputadas,
    }, 200, 'Salida registrada correctamente');
  } catch (error) {
    logger.error('Error al fichar salida', { error });
    mapServiceError(error, 'Error al registrar salida');
  }
});

/**
 * GET /api/fichaje/historial
 * Obtiene el historial paginado de fichajes del becario autenticado
 */
export const getHistorial = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const becario = await getBecarioByAuthenticatedUser(userId);

  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10) || 10));
  const fechaInicio = typeof req.query.fechaInicio === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.fechaInicio)
    ? req.query.fechaInicio
    : undefined;
  const fechaFin = typeof req.query.fechaFin === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.fechaFin)
    ? req.query.fechaFin
    : undefined;

  const resultado = await fichajeService.getHistorialFichajes({
    idBecario: becario.idBecario,
    page,
    limit,
    fechaInicio,
    fechaFin,
  });

  sendSuccess(res, {
    fichajes: resultado.fichajes.map((f) => ({
      idFichaje: f.idFichaje,
      fecha: f.fecha,
      horaEntrada: f.horaEntrada,
      horaSalida: f.horaSalida,
      horasTrabajadas: f.horasTrabajadas,
      horasImputadas: f.horasImputadas,
    })),
    pagination: {
      total: resultado.total,
      page: resultado.page,
      limit,
      totalPages: resultado.totalPages,
    },
  });
});

/**
 * GET /api/fichaje/activo
 * Obtiene el fichaje activo del becario (si existe)
 */
export const getFichajeActivo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const becario = await getBecarioByAuthenticatedUser(userId);

  const fichajeActivo = await fichajeService.getFichajeActivo(becario.idBecario);

  if (!fichajeActivo) {
    sendSuccess(res, null, 200, 'No hay fichaje activo');
    return;
  }

  sendSuccess(res, {
    idFichaje: fichajeActivo.idFichaje,
    fecha: fichajeActivo.fecha,
    horaEntrada: fichajeActivo.horaEntrada,
    horaSalida: fichajeActivo.horaSalida,
  });
});

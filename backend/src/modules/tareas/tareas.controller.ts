import { Request, Response } from 'express';
import logger from '../../config/logger';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors';
import { asyncHandler, sendCreated, sendSuccess } from '../../shared/http';
import * as tareasService from './tareas.service';

function getAuthenticatedUserId(req: Request): number {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('Usuario no autenticado');
  }

  return userId;
}

function parseIdParam(value: unknown, message: string): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestError(message);
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError(message);
  }

  return id;
}

function mapTareaError(error: unknown, fallbackMessage: string): never {
  if (error instanceof Error) {
    if (
      error.message.includes('no encontrado') ||
      error.message.includes('no encontrada')
    ) {
      throw new NotFoundError(error.message);
    }

    if (error.message.includes('permisos')) {
      throw new ForbiddenError(error.message);
    }

    if (
      error.message.includes('obligatorio') ||
      error.message.includes('obligatoria') ||
      error.message.includes('inválido') ||
      error.message.includes('invalid') ||
      error.message.includes('fecha') ||
      error.message.includes('nombre de la tarea')
    ) {
      throw new BadRequestError(error.message);
    }
  }

  logger.error(fallbackMessage, { error });
  throw error;
}

export const getTareasByBecario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');

  try {
    const tareas = await tareasService.getTareasByBecarioId(idBecario, tutorId);

    sendSuccess(res, {
      tareas,
      count: tareas.length,
    });
  } catch (error) {
    mapTareaError(error, 'Error al obtener las tareas del becario');
  }
});

export const createTarea = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');
  const { nombreTarea, descripcion, fechaInicio, fechaFinEstimada } = req.body;

  const tareaData: tareasService.CreateTareaData = {
    idBecario,
    idTutorAsignador: tutorId,
    nombreTarea,
    descripcion: descripcion || undefined,
    fechaInicio: new Date(fechaInicio),
    fechaFinEstimada: fechaFinEstimada ? new Date(fechaFinEstimada) : undefined,
  };

  try {
    const nuevaTarea = await tareasService.createTarea(tareaData);

    sendCreated(res, nuevaTarea, 'Tarea creada exitosamente');
  } catch (error) {
    mapTareaError(error, 'Error al crear la tarea');
  }
});

export const updateTarea = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const idTarea = parseIdParam(req.params.id, 'ID de tarea inválido');
  const { nombreTarea, descripcion, estado, fechaFinEstimada } = req.body;

  const updateData: tareasService.UpdateTareaData = {
    idUsuarioModificador: userId,
  };
  if (nombreTarea) updateData.nombreTarea = nombreTarea;
  if (descripcion !== undefined) updateData.descripcion = descripcion;
  if (estado) updateData.estado = estado;
  if (fechaFinEstimada !== undefined) {
    updateData.fechaFinEstimada = fechaFinEstimada ? new Date(fechaFinEstimada) : undefined;
  }

  try {
    const tareaActualizada = await tareasService.updateTarea(
      idTarea,
      updateData,
      userId,
    );

    sendSuccess(res, tareaActualizada, 200, 'Tarea actualizada exitosamente');
  } catch (error) {
    mapTareaError(error, 'Error al actualizar la tarea');
  }
});

export const deleteTarea = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idTarea = parseIdParam(req.params.id, 'ID de tarea inválido');

  try {
    await tareasService.deleteTarea(idTarea, tutorId);

    sendSuccess(res, null, 200, 'Tarea eliminada exitosamente');
  } catch (error) {
    mapTareaError(error, 'Error al eliminar la tarea');
  }
});

export const getTareaHistorial = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idTarea = parseIdParam(req.params.id, 'ID de tarea inválido');

  try {
    const historial = await tareasService.getTareaHistorial(idTarea, tutorId);

    sendSuccess(res, historial);
  } catch (error) {
    mapTareaError(error, 'Error al obtener el historial de la tarea');
  }
});

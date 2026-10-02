/**
 * Controlador de becarios
 * Maneja las peticiones HTTP relacionadas con perfiles de becarios
 */

import { Request, Response } from 'express';
import * as becarioService from '../services/becario.service';
import * as tareasService from '../modules/tareas';
import logger from '../config/logger';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../shared/errors';
import { asyncHandler, sendSuccess } from '../shared/http';
import { ROLES } from '../shared/constants/domain.constants';

function getAuthenticatedUserId(req: Request): number {
  const idUsuario = req.user?.userId;

  if (!idUsuario) {
    throw new UnauthorizedError('Usuario no autenticado');
  }

  return idUsuario;
}

function parseIdParam(value: unknown, message: string): number {
  // Zod transforma los parámetros numéricos antes de llegar al controlador.
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestError(message);
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError(message);
  }

  return id;
}

/**
 * GET /api/becario/profile
 * Obtiene el perfil completo del becario logueado
 * 
 * @route GET /api/becario/profile
 * @access Private - Solo becarios autenticados
 */
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const idUsuario = getAuthenticatedUserId(req);

  logger.info(`Becario ${idUsuario} solicitando su perfil`);

  const perfil = await becarioService.getBecarioProfileByUserId(idUsuario);

  if (!perfil) {
    throw new NotFoundError('Perfil de becario no encontrado');
  }

  sendSuccess(res, perfil);
});

/**
 * PUT /api/becario/profile
 * Actualiza los datos personales editables del perfil del becario
 * Solo permite actualizar: telefono_personal, email_personal, linkedin
 * 
 * @route PUT /api/becario/profile
 * @access Private - Solo becarios autenticados
 */
export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const idUsuario = getAuthenticatedUserId(req);

  // Obtener el becario para verificar que existe y obtener su idBecario
  const perfilActual = await becarioService.getBecarioProfileByUserId(idUsuario);

  if (!perfilActual) {
    throw new NotFoundError('Perfil de becario no encontrado');
  }

  // Extraer solo los campos permitidos del body
  const { telefono_personal, email_personal, linkedin } = req.body;

  const updateData: becarioService.UpdateBecarioProfileData = {};

  if (telefono_personal !== undefined) {
    updateData.telefono_personal = telefono_personal;
  }
  if (email_personal !== undefined) {
    updateData.email_personal = email_personal;
  }
  if (linkedin !== undefined) {
    updateData.linkedin = linkedin;
  }

  logger.info(`Becario ${idUsuario} actualizando perfil`, {
    campos: Object.keys(updateData),
  });

  try {
    const becarioActualizado = await becarioService.updateBecarioProfile(
      perfilActual.idBecario,
      updateData
    );

    sendSuccess(res, becarioActualizado, 200, 'Perfil actualizado exitosamente');
  } catch (error) {
    if (error instanceof Error && error.message === 'No hay campos validos para actualizar') {
      throw new BadRequestError(error.message);
    }

    throw error;
  }
});

/**
 * GET /api/becario/tareas
 * Obtiene todas las tareas asignadas al becario logueado
 */
export const getMyTareas = asyncHandler(async (req: Request, res: Response) => {
  const idUsuario = getAuthenticatedUserId(req);
  const perfil = await becarioService.getBecarioProfileByUserId(idUsuario);

  if (!perfil) {
    throw new NotFoundError('Perfil de becario no encontrado');
  }

  const tareas = await tareasService.getTareasByBecarioId(perfil.idBecario);
  sendSuccess(res, tareas);
});

/**
 * GET /api/becario/tareas/:idTarea/historial
 * Obtiene el historial de cambios de estado de una tarea
 *
 * @route GET /api/becario/tareas/:idTarea/historial
 * @access Private - Solo becarios autenticados
 */
export const getTareaHistorial = asyncHandler(async (req: Request, res: Response) => {
  const idUsuario = getAuthenticatedUserId(req);
  const idTarea = parseIdParam(req.params.idTarea, 'ID de tarea inválido');

  try {
    const rol = req.user?.role ?? ROLES.BECARIO;
    const historial = await becarioService.getTareaHistorial(idTarea, idUsuario, rol);

    sendSuccess(res, historial);
  } catch (error) {
    logger.error('Error en getTareaHistorial:', error);

    if (error instanceof Error && error.message === 'Tarea no encontrada') {
      throw new NotFoundError(error.message);
    }
    if (
      error instanceof Error &&
      error.message === 'No tienes permisos para ver el historial de esta tarea'
    ) {
      throw new ForbiddenError(error.message);
    }

    throw error;
  }
});

/**
 * PATCH /api/becario/tareas/:idTarea/estado
 * Actualiza el estado de una tarea asignada al becario logueado
 *
 * @route PATCH /api/becario/tareas/:idTarea/estado
 * @access Private - Solo becarios autenticados
 */
export const updateTareaEstado = asyncHandler(async (req: Request, res: Response) => {
  const idUsuario = getAuthenticatedUserId(req);
  const idTarea = parseIdParam(req.params.idTarea, 'ID de tarea inválido');

  const { estado } = req.body;

  try {
    const tareaActualizada = await becarioService.updateTareaEstado(
      idTarea,
      idUsuario,
      estado
    );

    logger.info(`Becario ${idUsuario} actualizó estado de tarea ${idTarea} a '${estado}'`);

    sendSuccess(res, tareaActualizada, 200, 'Estado de tarea actualizado correctamente');
  } catch (error) {
    logger.error('Error en updateTareaEstado:', error);

    if (error instanceof Error && error.message === 'Tarea no encontrada') {
      throw new NotFoundError(error.message);
    }
    if (
      error instanceof Error &&
      error.message === 'No tienes permisos para modificar esta tarea'
    ) {
      throw new ForbiddenError(error.message);
    }

    throw error;
  }
});

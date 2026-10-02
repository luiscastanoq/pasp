import { Request, Response } from 'express';
import * as tutorService from '../services/tutor.service';
import * as fichajeService from '../services/fichaje.service';
import * as evaluacionService from '../services/evaluacion.service';
import logger from '../config/logger';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../shared/errors';
import { asyncHandler, sendCreated, sendSuccess } from '../shared/http';
import {
  ROLES,
  TIPOS_TUTORIA,
  type TipoTutoria,
} from '../shared/constants/domain.constants';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTipoTutoria(value: unknown): value is TipoTutoria {
  return typeof value === 'string' && TIPOS_TUTORIA.includes(value as TipoTutoria);
}

function parseTutoresAsignados(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is { tutorId: number; tipoTutoria: TipoTutoria } => (
      isRecord(item) &&
      typeof item.tutorId === 'number' &&
      isTipoTutoria(item.tipoTutoria)
    ))
    .map((item) => ({
      tutorId: item.tutorId,
      tipo: item.tipoTutoria,
    }));
}

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

function mapServiceError(error: unknown, fallbackMessage: string): never {
  if (error instanceof Error) {
    if (error.message === 'EMAIL_DUPLICADO') {
      throw new ConflictError('Ya existe un usuario con ese email en el sistema');
    }

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
      error.message.includes('puntuaciones') ||
      error.message.includes('horas de contrato') ||
      error.message.includes('ayuda economica') ||
      error.message.includes('fecha') ||
      error.message.includes('formación') ||
      error.message.includes('campo para actualizar') ||
      error.message.includes('nombre de la tarea')
    ) {
      throw new BadRequestError(error.message);
    }
  }

  logger.error(fallbackMessage, { error });
  throw error;
}

/**
 * Obtener todos los becarios asignados al tutor logueado
 * GET /api/tutor/becarios
 */
export const getMyBecarios = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const becarios = await tutorService.getBecariosByTutorId(tutorId);

  sendSuccess(res, {
    becarios,
    count: becarios.length,
  });
});

export const getMyBecariosAcademicos = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const becarios = await tutorService.getBecariosAcademicosByTutorId(tutorId);

  sendSuccess(res, {
    becarios,
    count: becarios.length,
  });
});

export const getBecarioEditable = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');

  try {
    const data = await tutorService.getBecarioEditableByTutor(idBecario, tutorId);
    sendSuccess(res, data);
  } catch (error) {
    mapServiceError(error, 'Error al obtener el becario');
  }
});

export const getTutoresDisponibles = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  getAuthenticatedUserId(req);

  try {
    const tutores = await tutorService.getTutoresDisponibles();
    sendSuccess(res, { tutores });
  } catch (error) {
    mapServiceError(error, 'Error al obtener los tutores disponibles');
  }
});

export const getTutoresDelBecario = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');

  try {
    const tutores = await tutorService.getTutoresDelBecarioByTutor(idBecario, tutorId);
    sendSuccess(res, { tutores, tutorActualId: tutorId });
  } catch (error) {
    mapServiceError(error, 'Error al obtener los tutores del becario');
  }
});

export const createBecario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const {
    nombre,
    apellidos,
    email,
    contrasena,
    practica,
    cliente,
    horasContrato,
    ayudaEconomica,
    equipoEnUso,
    fechaInicioPracticas,
    fechaFinPracticas,
    tipoFormacion,
    nombreFormacion,
    centroEstudios,
    telefonoPersonal,
    emailPersonal,
    linkedin,
    tutoresAsignados,
  } = req.body;

  try {
    const nuevoBecario = await tutorService.createBecarioAsignadoATutor(
      tutorId,
      {
        nombre,
        apellidos,
        email,
        contrasena,
        practica,
        cliente,
        horasContrato: Number(horasContrato),
        ayudaEconomica:
          ayudaEconomica !== undefined ? Number(ayudaEconomica) : undefined,
        equipoEnUso,
        fechaInicioPracticas,
        fechaFinPracticas,
        tipoFormacion,
        nombreFormacion,
        centroEstudios,
        telefonoPersonal,
        emailPersonal,
        linkedin,
        tutoresAsignados: parseTutoresAsignados(tutoresAsignados),
      },
    );

    sendCreated(res, { usuario: nuevoBecario }, 'Becario creado y asignado correctamente');
  } catch (error) {
    mapServiceError(error, 'Error al crear el becario');
  }
});

export const updateBecarioUsuario = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');
  const { nombre, apellidos, email, contrasena, practica, cliente } = req.body;

  try {
    const usuarioActualizado = await tutorService.updateBecarioUsuarioByTutor(
      idBecario,
      tutorId,
      { nombre, apellidos, email, contrasena, practica, cliente },
    );

    sendSuccess(res, { usuario: usuarioActualizado }, 200, 'Usuario actualizado correctamente');
  } catch (error) {
    mapServiceError(error, 'Error al actualizar el usuario del becario');
  }
});

export const updateTutoresDelBecario = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');
  const tutores = Array.isArray(req.body.tutores) ? req.body.tutores : [];

  try {
    const resultado = await tutorService.actualizarTutoresDelBecarioByTutor(
      idBecario,
      tutorId,
      tutores,
    );
    sendSuccess(res, resultado, 200, 'Tutores actualizados correctamente');
  } catch (error) {
    mapServiceError(error, 'Error al actualizar los tutores del becario');
  }
});

/**
 * Actualizar informacion corporativa y academica de un becario
 * PUT /api/tutor/becarios/:id
 */
export const updateBecarioCorporativoAcademico = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');
  const {
    practica,
    cliente,
    horasContrato,
    ayudaEconomica,
    equipoEnUso,
    fechaInicioPracticas,
    fechaFinPracticas,
    tipoFormacion,
    nombreGradoUniversitario,
    nombreFormacionProfesional,
    centroEstudios,
    telefonoPersonal,
    emailPersonal,
    linkedin,
  } = req.body;

  const updateData: tutorService.UpdateBecarioCorporativoAcademicoData = {};
  if (practica !== undefined) updateData.practica = practica;
  if (cliente !== undefined) updateData.cliente = cliente;
  if (horasContrato !== undefined) updateData.horasContrato = Number(horasContrato);
  if (ayudaEconomica !== undefined) {
    updateData.ayudaEconomica = ayudaEconomica === null ? null : Number(ayudaEconomica);
  }
  if (equipoEnUso !== undefined) updateData.equipoEnUso = equipoEnUso || null;
  if (fechaInicioPracticas !== undefined) updateData.fechaInicioPracticas = new Date(fechaInicioPracticas);
  if (fechaFinPracticas !== undefined) {
    updateData.fechaFinPracticas = fechaFinPracticas ? new Date(fechaFinPracticas) : null;
  }
  if (tipoFormacion !== undefined) updateData.tipoFormacion = tipoFormacion;
  if (nombreGradoUniversitario !== undefined) updateData.nombreGradoUniversitario = nombreGradoUniversitario;
  if (nombreFormacionProfesional !== undefined) {
    updateData.nombreFormacionProfesional = nombreFormacionProfesional;
  }
  if (centroEstudios !== undefined) updateData.centroEstudios = centroEstudios;
  if (telefonoPersonal !== undefined) updateData.telefonoPersonal = telefonoPersonal;
  if (emailPersonal !== undefined) updateData.emailPersonal = emailPersonal;
  if (linkedin !== undefined) updateData.linkedin = linkedin;

  try {
    const becarioActualizado = await tutorService.updateBecarioCorporativoAcademico(
      idBecario,
      tutorId,
      updateData,
    );

    sendSuccess(res, becarioActualizado, 200, 'Información del becario actualizada exitosamente');
  } catch (error) {
    mapServiceError(error, 'Error al actualizar la información del becario');
  }
});

/**
 * Alternar estado activo/inactivo de un becario asignado
 * PATCH /api/tutor/becarios/:id/estado
 */
export const toggleEstadoBecario = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');

  try {
    const usuarioActualizado = await tutorService.toggleEstadoBecarioAsignado(
      idBecario,
      tutorId,
    );

    sendSuccess(
      res,
      { usuario: usuarioActualizado },
      200,
      `Becario ${usuarioActualizado.activo ? 'habilitado' : 'deshabilitado'} correctamente`,
    );
  } catch (error) {
    mapServiceError(error, 'Error al cambiar el estado del becario');
  }
});

/**
 * Eliminar un becario asignado
 * DELETE /api/tutor/becarios/:id
 */
export const deleteBecario = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');

  try {
    await tutorService.deleteBecarioAsignado(idBecario, tutorId);
    sendSuccess(res, null, 200, 'Becario eliminado correctamente');
  } catch (error) {
    mapServiceError(error, 'Error al eliminar el becario');
  }
});

/**
 * Obtener todas las evaluaciones de un becario
 * GET /api/tutor/becarios/:id/evaluaciones
 */
export const getEvaluaciones = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');

  try {
    const evaluaciones = await evaluacionService.getEvaluacionesByBecario(
      idBecario,
      tutorId,
    );

    sendSuccess(res, {
      evaluaciones,
      count: evaluaciones.length,
    });
  } catch (error) {
    mapServiceError(error, 'Error al obtener las evaluaciones');
  }
});

/**
 * Obtener todas las evaluaciones de un becario asignado al tutor académico.
 * GET /api/tutor-academico/becarios/:id/evaluaciones
 */
export const getEvaluacionesAcademicas = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario invalido');

  try {
    const becariosAsignados = await tutorService.getBecariosAcademicosByTutorId(tutorId);
    const tieneAcceso = becariosAsignados.some(
      becario => becario.idBecario === idBecario,
    );

    if (!tieneAcceso) {
      throw new ForbiddenError('No tienes permiso para consultar las evaluaciones de este becario');
    }

    const evaluaciones = await evaluacionService.getEvaluacionesByBecario(idBecario);

    sendSuccess(res, {
      evaluaciones,
      count: evaluaciones.length,
    });
  } catch (error) {
    mapServiceError(error, 'Error al obtener las evaluaciones');
  }
});

/**
 * Eliminar una evaluacion
 * DELETE /api/tutor/becarios/:idBecario/evaluaciones/:idEvaluacion
 */
export const deleteEvaluacion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.idBecario, 'ID de becario inválido');
  const idEvaluacion = parseIdParam(req.params.idEvaluacion, 'ID de evaluación inválido');

  try {
    await evaluacionService.deleteEvaluacion(idEvaluacion, idBecario, tutorId);

    sendSuccess(res, null, 200, 'Evaluación eliminada exitosamente');
  } catch (error) {
    mapServiceError(error, 'Error al eliminar la evaluación');
  }
});

/**
 * Crear una nueva evaluacion para un becario
 * POST /api/tutor/becarios/:id/evaluaciones
 */
export const createEvaluacion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');
  const {
    titulo,
    descripcion,
    puntuacionPuntualidad,
    puntuacionCalidad,
    puntuacionActitud,
    puntuacionAutonomia,
    puntuacionComunicacion,
  } = req.body;

  try {
    const nuevaEvaluacion = await evaluacionService.createEvaluacion({
      idBecario,
      idTutorEvaluador: tutorId,
      titulo,
      descripcion,
      puntuacionPuntualidad: Number(puntuacionPuntualidad),
      puntuacionCalidad: Number(puntuacionCalidad),
      puntuacionActitud: Number(puntuacionActitud),
      puntuacionAutonomia: Number(puntuacionAutonomia),
      puntuacionComunicacion: Number(puntuacionComunicacion),
    });

    sendCreated(res, nuevaEvaluacion, 'Evaluación creada exitosamente');
  } catch (error) {
    mapServiceError(error, 'Error al crear la evaluación');
  }
});

/**
 * Obtener el historial paginado de fichajes de un becario
 * GET /api/tutor/becarios/:id/fichajes
 */
export const getBecarioFichajes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const idTutor = getAuthenticatedUserId(req);
  const idBecario = parseIdParam(req.params.id, 'ID de becario inválido');
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const fechaInicio = typeof req.query.fechaInicio === 'string' ? req.query.fechaInicio : undefined;
  const fechaFin = typeof req.query.fechaFin === 'string' ? req.query.fechaFin : undefined;

  try {
    if (req.user?.role !== ROLES.ADMINISTRADOR) {
      const estaAsignado = await tutorService.verificarAsignacionTutorBecario(
        idBecario,
        idTutor,
      );
      if (!estaAsignado) {
        throw new ForbiddenError(
          'No tienes permisos para consultar los fichajes de este becario',
        );
      }
    }

    const result = await fichajeService.getHistorialFichajes({
      idBecario,
      page,
      limit,
      fechaInicio,
      fechaFin,
    });

    sendSuccess(res, {
      fichajes: result.fichajes,
      pagination: {
        total: result.total,
        page: result.page,
        limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    mapServiceError(error, 'Error al obtener los fichajes del becario');
  }
});

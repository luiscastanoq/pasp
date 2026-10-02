import { Request, Response } from 'express';
import { usuariosService } from '../services/usuarios.service';
import * as becariosAdminService from '../modules/becarios';
import * as tutoresAsignacionesService from '../modules/tutores';
import * as usuariosCreacionService from '../modules/usuarios';
import logger from '../config/logger';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../shared/errors';
import { asyncHandler, sendSuccess } from '../shared/http';
import { UpdateAdministradorData } from '../services/usuarios.service';
import { BecarioEmpresaAsignacion } from '../modules/tutores';
import {
  TutorBecarioAsignacion,
  UpdateBecarioDetalleData,
} from '../modules/becarios';
import {
  ROLES,
  TIPOS_TUTORIA,
  TIPOS_TUTORIA_EMPRESA,
  TipoTutoria,
  TipoTutoriaEmpresa,
  isTutorAcademicoRol,
  isTutorEmpresaRol,
  normalizeRolUsuario,
} from '../shared/constants/domain.constants';

type LegacyHttpError = Error & { statusCode?: number };

function parseIdParam(value: unknown, message = 'El ID debe ser un número válido'): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestError(message);
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError(message);
  }

  return id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTipoTutoria(value: unknown): value is TipoTutoria {
  return typeof value === 'string' && TIPOS_TUTORIA.includes(value as TipoTutoria);
}

function isTipoTutoriaEmpresa(value: unknown): value is TipoTutoriaEmpresa {
  return typeof value === 'string' && TIPOS_TUTORIA_EMPRESA.includes(value as TipoTutoriaEmpresa);
}

function toOptionalTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function mapUsuarioError(error: unknown): never {
  if (error instanceof Error) {
    const legacyError = error as LegacyHttpError;

    if (error.message === 'EMAIL_DUPLICADO' || legacyError.statusCode === 409) {
      throw new ConflictError('Ya existe un usuario con ese email en el sistema');
    }

    if (
      error.message === 'USUARIO_NO_ENCONTRADO' ||
      error.message === 'Usuario no encontrado' ||
      error.message === 'PERFIL_BECARIO_NO_ENCONTRADO' ||
      legacyError.statusCode === 404
    ) {
      throw new NotFoundError(
        error.message === 'PERFIL_BECARIO_NO_ENCONTRADO' ? 'Becario no encontrado' : 'Usuario no encontrado',
      );
    }

    if (error.message === 'NO_PUEDE_ELIMINAR_SUPERADMIN') {
      throw new ForbiddenError('No se puede eliminar a un SuperAdministrador');
    }

    if (error.message === 'NO_PUEDE_ELIMINARSE_A_SI_MISMO') {
      throw new ForbiddenError('No puedes eliminar tu propio usuario');
    }

    if (legacyError.statusCode === 403) {
      throw new ForbiddenError(error.message);
    }

    if (error.message === 'NO_ES_BECARIO') {
      throw new BadRequestError('El usuario no tiene rol Becario');
    }

    if (
      error.message === 'El usuario no es un Tutor académico' ||
      error.message === 'El usuario no es un Tutor de empresa'
    ) {
      throw new BadRequestError(error.message);
    }

    if (error.message.startsWith('TUTOR_NO_ENCONTRADO:')) {
      const idsInvalidos = error.message.replace('TUTOR_NO_ENCONTRADO:', '');
      throw new BadRequestError(`Los siguientes tutores no existen en el sistema: ${idsInvalidos}`);
    }

    if (error.message.startsWith('BECARIO_NO_ENCONTRADO:')) {
      const idInvalido = error.message.replace('BECARIO_NO_ENCONTRADO:', '');
      throw new BadRequestError(`El becario con ID ${idInvalido} no existe en el sistema`);
    }

    if (legacyError.statusCode === 400) {
      throw new BadRequestError(error.message);
    }
  }

  throw error;
}

function getAdminUserId(req: Request): number {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ForbiddenError('Usuario no autenticado');
  }

  return userId;
}

function parseBecarioIds(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];
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

function parseTutoresDelBecario(value: unknown): TutorBecarioAsignacion[] {
  if (!Array.isArray(value)) {
    throw new BadRequestError('El campo tutores debe ser un array');
  }

  return value
    .filter((item): item is { tutorId: number | string; tipoTutoria: TipoTutoria } => (
      isRecord(item) &&
      (typeof item.tutorId === 'number' || typeof item.tutorId === 'string') &&
      Number.isInteger(Number(item.tutorId)) &&
      isTipoTutoria(item.tipoTutoria)
    ))
    .map((item) => ({
      tutorId: Number(item.tutorId),
      tipoTutoria: item.tipoTutoria,
    }));
}

function parseBecariosEmpresa(value: unknown): BecarioEmpresaAsignacion[] {
  if (!Array.isArray(value)) {
    throw new BadRequestError('El campo becarios debe ser un array');
  }

  return value
    .filter((item): item is { becarioId: number; tipoTutoria: TipoTutoriaEmpresa } => (
      isRecord(item) &&
      typeof item.becarioId === 'number' &&
      Number.isInteger(item.becarioId) &&
      isTipoTutoriaEmpresa(item.tipoTutoria)
    ))
    .map((item) => ({
      becarioId: item.becarioId,
      tipoTutoria: item.tipoTutoria,
    }));
}

/**
 * Obtiene todos los usuarios del sistema
 * Solo accesible para Administradores
 * GET /api/usuarios
 */
export const getAllUsuarios = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const usuarios = await usuariosService.getAll(req.user?.demo === true);

  logger.info('Usuarios consultados', {
    cantidad: usuarios.length,
    usuarioId: req.user?.userId,
  });

  sendSuccess(res, { usuarios });
});

/**
 * Obtiene todos los usuarios con rol Becario del sistema.
 * GET /api/usuarios/becarios
 */
export const getBecarios = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const becarios = await usuariosService.getBecarios();

  logger.info('Becarios consultados para asignación', {
    cantidad: becarios.length,
    usuarioId: req.user?.userId,
  });

  sendSuccess(res, { becarios });
});

/**
 * Crea un nuevo usuario.
 * POST /api/usuarios
 */
export const createUsuario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { nombre, apellidos, email, contrasena } = req.body;
  const rol = normalizeRolUsuario(req.body.rol);

  try {
    if (rol === ROLES.ADMINISTRADOR) {
      const nuevoUsuario = await usuariosCreacionService.createAdministrador({
        nombre,
        apellidos,
        email,
        contrasena,
      });

      logger.info('Nuevo administrador creado', {
        nuevoUsuarioId: nuevoUsuario.idUsuario,
        email: nuevoUsuario.email,
        creadoPor: req.user?.userId,
      });

      sendSuccess(res, { usuario: nuevoUsuario }, 201, 'Usuario administrador creado correctamente');
      return;
    }

    if (isTutorAcademicoRol(rol)) {
      const becarioIds = parseBecarioIds(req.body.becarioIds);
      const nuevoUsuario = await usuariosCreacionService.createTutorAcademico({
        nombre,
        apellidos,
        email,
        contrasena,
        becarioIds,
      });

      logger.info('Nuevo Tutor académico creado', {
        nuevoUsuarioId: nuevoUsuario.idUsuario,
        email: nuevoUsuario.email,
        becariosAsignados: becarioIds.length,
        creadoPor: req.user?.userId,
      });

      sendSuccess(res, { usuario: nuevoUsuario }, 201, 'Usuario Tutor académico creado correctamente');
      return;
    }

    if (isTutorEmpresaRol(rol)) {
      const { practica, cliente } = req.body;

      const becarios = parseBecariosEmpresa(req.body.becarios ?? []);
      const nuevoUsuario = await usuariosCreacionService.createTutorEmpresa({
        nombre,
        apellidos,
        email,
        contrasena,
        practica,
        cliente,
        becarios,
      });

      logger.info('Nuevo Tutor de empresa creado', {
        nuevoUsuarioId: nuevoUsuario.idUsuario,
        email: nuevoUsuario.email,
        becariosAsignados: becarios.length,
        creadoPor: req.user?.userId,
      });

      sendSuccess(res, { usuario: nuevoUsuario }, 201, 'Usuario Tutor de empresa creado correctamente');
      return;
    }

    if (rol === ROLES.BECARIO) {
      const {
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
      } = req.body;

      const tutoresAsignados = parseTutoresAsignados(req.body.tutoresAsignados);
      const nuevoUsuario = await usuariosCreacionService.createBecario({
        nombre,
        apellidos,
        email,
        contrasena,
        practica,
        cliente,
        horasContrato: Number(horasContrato),
        ayudaEconomica:
          ayudaEconomica !== undefined ? Number(ayudaEconomica) : undefined,
        equipoEnUso: toOptionalTrimmedString(equipoEnUso),
        fechaInicioPracticas,
        fechaFinPracticas,
        tipoFormacion,
        nombreFormacion,
        centroEstudios,
        telefonoPersonal: toOptionalTrimmedString(telefonoPersonal),
        emailPersonal: toOptionalTrimmedString(emailPersonal),
        linkedin: toOptionalTrimmedString(linkedin),
        tutoresAsignados,
      });

      logger.info('Nuevo becario creado', {
        timestamp: new Date().toISOString(),
        creadoPor: req.user?.userId,
        emailBecario: nuevoUsuario.email,
        nuevoUsuarioId: nuevoUsuario.idUsuario,
        tutoresVinculados: tutoresAsignados.length,
      });

      sendSuccess(res, { usuario: nuevoUsuario }, 201, 'Usuario becario creado correctamente');
      return;
    }

    throw new ValidationError(`La creación de usuarios con rol "${rol}" no está disponible en esta versión`);
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Obtiene el detalle de un usuario por su ID.
 * GET /api/usuarios/:id
 */
export const getUsuario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseIdParam(req.params.id);

  try {
    const usuario = await usuariosService.getUsuarioById(
      id,
      req.user?.demo === true,
    );
    sendSuccess(res, { usuario });
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Actualiza nombre, apellidos, email y opcionalmente contraseña de un usuario.
 * PUT /api/usuarios/:id
 */
export const updateUsuario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseIdParam(req.params.id);
  const { nombre, apellidos, email, contrasena, practica, cliente } = req.body;

  const data: UpdateAdministradorData = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (apellidos !== undefined) data.apellidos = apellidos;
  if (email !== undefined) data.email = email;
  if (contrasena !== undefined) data.contrasena = contrasena;
  if (practica !== undefined) data.practica = practica;
  if (cliente !== undefined) data.cliente = cliente;

  try {
    const usuarioActualizado = await usuariosService.updateAdministrador(id, data);

    logger.info('Usuario actualizado via API', {
      usuarioId: id,
      actualizadoPor: req.user?.userId,
    });

    sendSuccess(res, { usuario: usuarioActualizado }, 200, 'Usuario actualizado correctamente');
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Alterna el estado activo/inactivo de un usuario.
 * PATCH /api/usuarios/:id/estado
 */
export const toggleEstadoUsuario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseIdParam(req.params.id);

  try {
    const usuarioActualizado = await usuariosService.toggleActivoUsuario(id);

    logger.info('Estado de usuario alternado via API', {
      usuarioId: id,
      nuevoEstado: usuarioActualizado.activo,
      gestionadoPor: req.user?.userId,
    });

    sendSuccess(
      res,
      { usuario: usuarioActualizado },
      200,
      `Usuario ${usuarioActualizado.activo ? 'habilitado' : 'deshabilitado'} correctamente`,
    );
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Elimina un usuario del sistema.
 * DELETE /api/usuarios/:id
 */
export const deleteUsuario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseIdParam(req.params.id);
  const idAdminLogueado = getAdminUserId(req);

  try {
    await usuariosService.deleteUsuario(id, idAdminLogueado);

    logger.info('Usuario eliminado via API', {
      usuarioEliminadoId: id,
      eliminadoPor: idAdminLogueado,
    });

    sendSuccess(res, null, 200, 'Usuario eliminado correctamente');
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Obtiene los becarios asignados a un Tutor académico.
 * GET /api/usuarios/:id/becarios
 */
export const getBecariosDeTutorAcademico = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tutorId = parseIdParam(req.params.id, 'ID de tutor inválido');

  try {
    const becarios = await tutoresAsignacionesService.getBecariosDeTutorAcademico(tutorId);
    sendSuccess(res, { becarios });
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Actualiza los becarios asignados a un Tutor académico.
 * PUT /api/usuarios/:id/becarios
 */
export const actualizarBecariosDeTutorAcademico = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = parseIdParam(req.params.id, 'ID de tutor inválido');
  const { becarioIds } = req.body;

  const idsValidos = parseBecarioIds(becarioIds);

  try {
    const resultado = await tutoresAsignacionesService.actualizarBecariosDeTutorAcademico(tutorId, idsValidos);

    logger.info('Becarios actualizados via API', {
      tutorId,
      cantidadBecarios: idsValidos.length,
      actualizadoPor: req.user?.userId,
    });

    sendSuccess(res, resultado, 200, 'Becarios actualizados correctamente');
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Actualiza los datos del perfil de un Becario.
 * PUT /api/usuarios/:id/becario-detalle
 */
export const updateBecarioDetalle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseIdParam(req.params.id);
  const {
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
  } = req.body;

  const data: UpdateBecarioDetalleData = {};
  if (horasContrato !== undefined) data.horasContrato = Number(horasContrato);
  if (ayudaEconomica !== undefined) {
    data.ayudaEconomica = ayudaEconomica === null ? null : Number(ayudaEconomica);
  }
  if (equipoEnUso !== undefined) data.equipoEnUso = equipoEnUso || null;
  if (fechaInicioPracticas !== undefined) data.fechaInicioPracticas = fechaInicioPracticas;
  if (fechaFinPracticas !== undefined) data.fechaFinPracticas = fechaFinPracticas;
  if (tipoFormacion !== undefined) data.tipoFormacion = tipoFormacion;
  if (nombreFormacion !== undefined) data.nombreFormacion = nombreFormacion;
  if (centroEstudios !== undefined) data.centroEstudios = centroEstudios;
  if (telefonoPersonal !== undefined) data.telefonoPersonal = telefonoPersonal || null;
  if (emailPersonal !== undefined) data.emailPersonal = emailPersonal || null;
  if (linkedin !== undefined) data.linkedin = linkedin || null;

  try {
    const resultado = await becariosAdminService.updateBecarioDetalle(id, data);

    logger.info('Perfil de becario actualizado via API', {
      usuarioId: id,
      actualizadoPor: req.user?.userId,
    });

    sendSuccess(res, { becario: resultado }, 200, 'Perfil del becario actualizado correctamente');
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Actualiza los tutores asignados a un Becario.
 * PUT /api/usuarios/:id/tutores
 */
export const actualizarTutoresDelBecario = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseIdParam(req.params.id);
  const tutoresValidos = parseTutoresDelBecario(req.body.tutores);

  try {
    const resultado = await becariosAdminService.actualizarTutoresDelBecario(id, tutoresValidos);

    logger.info('Tutores de becario actualizados via API', {
      usuarioId: id,
      cantidadTutores: tutoresValidos.length,
      actualizadoPor: req.user?.userId,
    });

    sendSuccess(res, { cantidadTutores: resultado.cantidadTutores }, 200, 'Tutores actualizados correctamente');
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Obtiene los becarios asignados a un Tutor de empresa.
 * GET /api/usuarios/:id/becarios-tutor-empresa
 */
export const getBecariosDeTutorEmpresa = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = parseIdParam(req.params.id, 'ID de tutor inválido');

  try {
    const becarios = await tutoresAsignacionesService.getBecariosDeTutorEmpresa(tutorId);
    sendSuccess(res, { becarios });
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Obtiene el perfil detallado de un Becario.
 * GET /api/usuarios/:id/becario-detalle
 */
export const getBecarioDetalle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseIdParam(req.params.id);

  try {
    const detalle = await becariosAdminService.getBecarioDetalle(id);
    sendSuccess(res, { becario: detalle });
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Obtiene los tutores asignados a un Becario.
 * GET /api/usuarios/:id/tutores
 */
export const getTutoresDelBecario = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseIdParam(req.params.id);

  try {
    const tutores = await becariosAdminService.getTutoresDelBecario(id);
    sendSuccess(res, { tutores });
  } catch (error) {
    mapUsuarioError(error);
  }
});

/**
 * Actualiza los becarios asignados a un Tutor de empresa.
 * PUT /api/usuarios/:id/becarios-tutor-empresa
 */
export const actualizarBecariosDeTutorEmpresa = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tutorId = parseIdParam(req.params.id, 'ID de tutor inválido');
  const becariosValidos = parseBecariosEmpresa(req.body.becarios);

  try {
    const resultado = await tutoresAsignacionesService.actualizarBecariosDeTutorEmpresa(
      tutorId,
      becariosValidos,
    );

    logger.info('Becarios de empresa actualizados via API', {
      tutorId,
      cantidadBecarios: becariosValidos.length,
      actualizadoPor: req.user?.userId,
    });

    sendSuccess(res, resultado, 200, 'Becarios actualizados correctamente');
  } catch (error) {
    mapUsuarioError(error);
  }
});

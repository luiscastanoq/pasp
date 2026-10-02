import { Router } from 'express';
import * as usuariosController from '../controllers/usuarios.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import {
  becariosTutorEmpresaSchema,
  becariosTutorAcademicoSchema,
  createUsuarioSchema,
  idParamSchema,
  tutoresBecarioSchema,
  updateBecarioDetalleSchema,
  updateUsuarioSchema,
  validateBody,
  validateParams,
} from '../shared/validation';

const router = Router();

/**
 * GET /api/usuarios
 * Obtiene todos los usuarios del sistema.
 * Requiere autenticación y rol de Administrador.
 */
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  usuariosController.getAllUsuarios,
);

/**
 * POST /api/usuarios
 * Crea un nuevo usuario del sistema.
 * Requiere autenticación y rol de Administrador.
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateBody(createUsuarioSchema),
  usuariosController.createUsuario,
);

/**
 * GET /api/usuarios/becarios
 * Obtiene todos los becarios activos del sistema.
 * Usado por el modal de selección de becarios (HU-5.10).
 * Requiere autenticación y rol de Administrador.
 */
router.get(
  '/becarios',
  authenticateToken,
  requireAdmin,
  usuariosController.getBecarios,
);

/**
 * GET /api/usuarios/:id/becario-detalle
 * Obtiene el perfil detallado (tabla Becarios) de un usuario con rol Becario.
 * Requiere autenticación y rol de Administrador.
 */
router.get(
  '/:id/becario-detalle',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  usuariosController.getBecarioDetalle,
);

/**
 * PUT /api/usuarios/:id/becario-detalle
 * Actualiza los datos del perfil de un Becario (tabla Becarios).
 * Requiere autenticación y rol de Administrador.
 */
router.put(
  '/:id/becario-detalle',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  validateBody(updateBecarioDetalleSchema),
  usuariosController.updateBecarioDetalle,
);

/**
 * GET /api/usuarios/:id/tutores
 * Obtiene los tutores asignados a un Becario.
 * Requiere autenticación y rol de Administrador.
 */
router.get(
  '/:id/tutores',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  usuariosController.getTutoresDelBecario,
);

/**
 * PUT /api/usuarios/:id/tutores
 * Actualiza los tutores asignados a un Becario.
 * Requiere autenticación y rol de Administrador.
 */
router.put(
  '/:id/tutores',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  validateBody(tutoresBecarioSchema),
  usuariosController.actualizarTutoresDelBecario,
);

/**
 * GET /api/usuarios/:id/becarios-tutor-empresa
 * Obtiene los becarios asignados a un Tutor de empresa.
 * Requiere autenticación y rol de Administrador.
 */
router.get(
  '/:id/becarios-tutor-empresa',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  usuariosController.getBecariosDeTutorEmpresa,
);

/**
 * GET /api/usuarios/:id/becarios-tutor-academico
 * Obtiene los becarios asignados a un Tutor académico.
 * Requiere autenticación y rol de Administrador.
 */
router.get(
  '/:id/becarios-tutor-academico',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  usuariosController.getBecariosDeTutorAcademico,
);

/**
 * GET /api/usuarios/:id
 * Obtiene el detalle de un usuario por su ID.
 * Requiere autenticación y rol de Administrador.
 */
router.get(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  usuariosController.getUsuario,
);

/**
 * PUT /api/usuarios/:id/becarios-tutor-empresa
 * Actualiza los becarios asignados a un Tutor de empresa.
 * Requiere autenticación y rol de Administrador.
 */
router.put(
  '/:id/becarios-tutor-empresa',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  validateBody(becariosTutorEmpresaSchema),
  usuariosController.actualizarBecariosDeTutorEmpresa,
);

/**
 * PUT /api/usuarios/:id/becarios-tutor-academico
 * Actualiza los becarios asignados a un Tutor académico.
 * Requiere autenticación y rol de Administrador.
 */
router.put(
  '/:id/becarios-tutor-academico',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  validateBody(becariosTutorAcademicoSchema),
  usuariosController.actualizarBecariosDeTutorAcademico,
);

/**
 * PUT /api/usuarios/:id
 * Actualiza nombre, apellidos, email y/o contraseña de un usuario.
 * Requiere autenticación y rol de Administrador.
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  validateBody(updateUsuarioSchema),
  usuariosController.updateUsuario,
);

/**
 * PATCH /api/usuarios/:id/estado
 * Alterna el estado activo/inactivo de un usuario.
 * Requiere autenticación y rol de Administrador.
 */
router.patch(
  '/:id/estado',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  usuariosController.toggleEstadoUsuario,
);

/**
 * DELETE /api/usuarios/:id
 * Elimina un usuario del sistema.
 * Requiere autenticación y rol de Administrador.
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateParams(idParamSchema),
  usuariosController.deleteUsuario,
);

export default router;

/**
 * Rutas de becarios
 * Define los endpoints HTTP para gestión de perfiles de becarios
 */

import { Router } from 'express';
import * as becarioController from '../controllers/becario.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireBecario } from '../middlewares/role.middleware';
import {
  idTareaParamSchema,
  updateBecarioProfileSchema,
  updateEstadoTareaSchema,
  validateBody,
  validateParams,
} from '../shared/validation';

const router = Router();

/**
 * @route   GET /api/becario/profile
 * @desc    Obtiene el perfil completo del becario logueado
 * @access  Private - Solo becarios y administradores
 */
router.get(
  '/profile',
  authenticateToken,
  requireBecario,
  becarioController.getMyProfile
);

/**
 * @route   PUT /api/becario/profile
 * @desc    Actualiza los datos personales editables del perfil (teléfono, email personal, LinkedIn)
 * @access  Private - Solo becarios y administradores
 */
router.put(
  '/profile',
  authenticateToken,
  requireBecario,
  validateBody(updateBecarioProfileSchema),
  becarioController.updateMyProfile
);

/**
 * @route   GET /api/becario/tareas
 * @desc    Obtiene todas las tareas asignadas al becario logueado
 * @access  Private - Solo becarios y administradores
 */
router.get(
  '/tareas',
  authenticateToken,
  requireBecario,
  becarioController.getMyTareas
);

/**
 * @route   GET /api/becario/tareas/:idTarea/historial
 * @desc    Obtiene el historial de cambios de estado de una tarea
 * @access  Private - Solo becarios y administradores
 */
router.get(
  '/tareas/:idTarea/historial',
  authenticateToken,
  requireBecario,
  validateParams(idTareaParamSchema),
  becarioController.getTareaHistorial
);

/**
 * @route   PATCH /api/becario/tareas/:idTarea/estado
 * @desc    Actualiza el estado de una tarea del becario logueado
 * @access  Private - Solo becarios y administradores
 */
router.patch(
  '/tareas/:idTarea/estado',
  authenticateToken,
  requireBecario,
  validateParams(idTareaParamSchema),
  validateBody(updateEstadoTareaSchema),
  becarioController.updateTareaEstado
);

export default router;

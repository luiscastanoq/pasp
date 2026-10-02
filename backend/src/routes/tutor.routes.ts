import { Router } from 'express';
import * as tutorController from '../controllers/tutor.controller';
import * as tareasController from '../modules/tareas/tareas.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireTutor } from '../middlewares/role.middleware';
import {
  createEvaluacionSchema,
  createTutorBecarioSchema,
  createTareaSchema,
  idEvaluacionParamSchema,
  idParamSchema,
  updateBecarioCorporativoAcademicoSchema,
  updateTutorBecarioTutoresSchema,
  updateTutorBecarioUsuarioSchema,
  updateTareaSchema,
  validateBody,
  validateParams,
} from '../shared/validation';

const router = Router();

/**
 * GET /api/tutor/becarios
 * Obtener todos los becarios asignados al tutor logueado
 */
router.get('/becarios', authenticateToken, requireTutor, tutorController.getMyBecarios);

router.get(
  '/tutores-disponibles',
  authenticateToken,
  requireTutor,
  tutorController.getTutoresDisponibles
);

router.post(
  '/becarios',
  authenticateToken,
  requireTutor,
  validateBody(createTutorBecarioSchema),
  tutorController.createBecario
);

router.get(
  '/becarios/:id',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tutorController.getBecarioEditable
);

router.put(
  '/becarios/:id/usuario',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  validateBody(updateTutorBecarioUsuarioSchema),
  tutorController.updateBecarioUsuario
);

router.get(
  '/becarios/:id/tutores',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tutorController.getTutoresDelBecario
);

router.put(
  '/becarios/:id/tutores',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  validateBody(updateTutorBecarioTutoresSchema),
  tutorController.updateTutoresDelBecario
);

/**
 * PUT /api/tutor/becarios/:id
 * Actualizar información corporativa y académica de un becario
 */
router.put(
  '/becarios/:id',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  validateBody(updateBecarioCorporativoAcademicoSchema),
  tutorController.updateBecarioCorporativoAcademico
);

router.patch(
  '/becarios/:id/estado',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tutorController.toggleEstadoBecario
);

router.delete(
  '/becarios/:id',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tutorController.deleteBecario
);

// ============================================
// RUTAS DE GESTIÓN DE TAREAS - HU-11
// ============================================

/**
 * GET /api/tutor/becarios/:id/tareas
 * Obtener todas las tareas de un becario específico
 */
router.get(
  '/becarios/:id/tareas',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tareasController.getTareasByBecario
);

/**
 * POST /api/tutor/becarios/:id/tareas
 * Crear una nueva tarea para un becario
 */
router.post(
  '/becarios/:id/tareas',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  validateBody(createTareaSchema),
  tareasController.createTarea
);

/**
 * PUT /api/tutor/tareas/:id
 * Actualizar una tarea existente
 */
router.put(
  '/tareas/:id',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  validateBody(updateTareaSchema),
  tareasController.updateTarea
);

/**
 * DELETE /api/tutor/tareas/:id
 * Eliminar una tarea existente
 */
router.delete(
  '/tareas/:id',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tareasController.deleteTarea
);

/**
 * GET /api/tutor/tareas/:id/historial
 * Obtener historial de cambios de una tarea
 */
router.get(
  '/tareas/:id/historial',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tareasController.getTareaHistorial
);

// ============================================
// RUTAS DE EVALUACIONES - HU-13 / HU-14
// ============================================

/**
 * GET /api/tutor/becarios/:id/evaluaciones
 * Obtener todas las evaluaciones de un becario
 */
router.get(
  '/becarios/:id/evaluaciones',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tutorController.getEvaluaciones
);

/**
 * POST /api/tutor/becarios/:id/evaluaciones
 * Crear una nueva evaluacion para un becario
 */
router.post(
  '/becarios/:id/evaluaciones',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  validateBody(createEvaluacionSchema),
  tutorController.createEvaluacion
);

/**
 * DELETE /api/tutor/becarios/:idBecario/evaluaciones/:idEvaluacion
 * Eliminar una evaluación
 */
router.delete(
  '/becarios/:idBecario/evaluaciones/:idEvaluacion',
  authenticateToken,
  requireTutor,
  validateParams(idEvaluacionParamSchema),
  tutorController.deleteEvaluacion
);

// ============================================
// RUTAS DE FICHAJES - HU-12
// ============================================

/**
 * GET /api/tutor/becarios/:id/fichajes
 * Obtener historial paginado de fichajes de un becario
 * Query params: page?, limit?, fechaInicio?, fechaFin?
 */
router.get(
  '/becarios/:id/fichajes',
  authenticateToken,
  requireTutor,
  validateParams(idParamSchema),
  tutorController.getBecarioFichajes
);

export default router;

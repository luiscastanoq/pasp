import { Router } from 'express';
import * as tutorController from '../controllers/tutor.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireTutorAcademico } from '../middlewares/role.middleware';
import { idParamSchema, validateParams } from '../shared/validation';

const router = Router();

router.get(
  '/becarios',
  authenticateToken,
  requireTutorAcademico,
  tutorController.getMyBecariosAcademicos,
);

router.get(
  '/becarios/:id/evaluaciones',
  authenticateToken,
  requireTutorAcademico,
  validateParams(idParamSchema),
  tutorController.getEvaluacionesAcademicas,
);

export default router;

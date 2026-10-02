import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import becarioRoutes from './becario.routes';
import fichajeRoutes from './fichaje.routes';
import tutorRoutes from './tutor.routes';
import tutorAcademicoRoutes from './tutor-academico.routes';
import usuariosRoutes from './usuarios.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tutor', tutorRoutes);
router.use('/tutor-academico', tutorAcademicoRoutes);
router.use('/becario', becarioRoutes);
router.use('/fichaje', fichajeRoutes);
router.use('/admin', adminRoutes);
router.use('/usuarios', usuariosRoutes);

export default router;

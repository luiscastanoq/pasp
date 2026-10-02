import { Router } from 'express';
import {
  login,
  changePasswordController,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { loginRateLimiter } from '../middlewares/rate-limit.middleware';
import { demoLogin } from '../controllers/demo.controller';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario y obtener token JWT
 * @access  Public
 */
router.post('/login', loginRateLimiter, login);
router.post('/demo-login', loginRateLimiter, demoLogin);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (por implementar en HU-02)
 * @access  Private
 */
// router.post('/logout', authenticateToken, logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña (HU-03)
 * @access  Public
 */
// router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con token (HU-03)
 * @access  Public
 */
// router.post('/reset-password', resetPassword);

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Cambiar contraseña (primer acceso - HU-04)
 * @access  Private
 */
router.patch('/change-password', authenticateToken, changePasswordController);

export default router;

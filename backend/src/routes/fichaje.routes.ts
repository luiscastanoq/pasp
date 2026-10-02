/**
 * Rutas de fichaje
 * Define los endpoints HTTP para el sistema de fichaje de entrada/salida de becarios
 */

import { Router } from 'express';
import * as fichajeController from '../controllers/fichaje.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireBecario } from '../middlewares/role.middleware';

const router = Router();

/**
 * @route   POST /api/fichaje/entrada
 * @desc    Registra la entrada (fichaje de inicio) de la jornada del becario
 * @access  Private - Solo becarios y administradores
 * @body    No requiere body (usa el idBecario del token JWT)
 * @returns {201} Fichaje creado con éxito
 * @returns {400} Ya existe un fichaje activo o ya completó fichaje del día
 * @returns {401} No autenticado o no es becario
 * @returns {404} Becario no encontrado
 */
router.post(
  '/entrada',
  authenticateToken,
  requireBecario,
  fichajeController.ficharEntrada
);

/**
 * @route   PUT /api/fichaje/:id/salida
 * @desc    Registra la salida (fichaje de fin) de la jornada e imputa las horas trabajadas
 * @access  Private - Solo becarios y administradores
 * @param   {number} id - ID del fichaje activo
 * @body    {number} horasImputadas - Horas trabajadas a imputar (mínimo 0.5h, máximo 16h)
 * @returns {200} Salida registrada con éxito
 * @returns {400} Validación fallida (horas fuera de rango, fichaje ya tiene salida)
 * @returns {401} No autenticado o no es becario
 * @returns {403} El fichaje no pertenece al becario autenticado
 * @returns {404} Fichaje no encontrado
 */
router.put(
  '/:id/salida',
  authenticateToken,
  requireBecario,
  fichajeController.ficharSalida
);

/**
 * @route   GET /api/fichaje/historial
 * @desc    Obtiene el historial paginado de fichajes del becario autenticado
 * @access  Private - Solo becarios y administradores
 * @query   page (default: 1), limit (default: 10, max: 50)
 * @query   fechaInicio (YYYY-MM-DD, opcional), fechaFin (YYYY-MM-DD, opcional)
 * @returns {200} Array de fichajes con paginación
 * @returns {401} No autenticado o no es becario
 * @returns {404} Becario no encontrado
 */
router.get(
  '/historial',
  authenticateToken,
  requireBecario,
  fichajeController.getHistorial
);

/**
 * @route   GET /api/fichaje/activo
 * @desc    Obtiene el fichaje activo del día (sin salida registrada) del becario
 * @access  Private - Solo becarios y administradores
 * @returns {200} Fichaje activo o null si no existe
 * @returns {401} No autenticado o no es becario
 * @returns {404} Becario no encontrado
 * @note    Útil para verificar si el becario ya fichó entrada hoy
 */
router.get(
  '/activo',
  authenticateToken,
  requireBecario,
  fichajeController.getFichajeActivo
);

export default router;

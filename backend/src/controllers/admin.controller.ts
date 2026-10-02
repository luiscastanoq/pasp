import { Request, Response } from "express";
import * as adminService from "../services/admin.service";
import logger from "../config/logger";
import { asyncHandler, sendSuccess } from "../shared/http";

/**
 * GET /api/admin/stats
 * Devuelve las estadisticas globales de usuarios para los KPIs del dashboard
 */
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getUsersStats(req.user?.demo === true);

  logger.info("Stats de usuarios consultadas", {
    userId: req.user?.userId,
  });

  sendSuccess(res, stats);
});

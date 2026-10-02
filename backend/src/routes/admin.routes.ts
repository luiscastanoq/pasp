import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";

const router = Router();

// GET /api/admin/stats - KPIs del dashboard de administrador
router.get("/stats", authenticateToken, requireAdmin, adminController.getStats);

export default router;
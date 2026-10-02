import { prisma } from '../database/prisma';
import { env } from '../config/env';
import { AppError, BadRequestError, NotFoundError } from '../shared/errors';
import {
  asyncHandler,
  sendSuccess,
  sendDatabaseWakingUp,
} from '../shared/http';
import { isTransientDatabaseError } from '../shared/database/database-retry';
import { createLoginResponse } from '../services/auth.service';

const accounts: Record<string, string> = {
  Administrador: 'elena.robles@pasp-demo.test',
  Tutor_Empresa: 'marcos.vidal@pasp-demo.test',
  Tutor_Academico: 'julia.bernal@pasp-demo.test',
  Becario: 'hugo.salas@pasp-demo.test',
};

export const demoLogin = asyncHandler(async (req, res) => {
  if (!env.DEMO_MODE)
    throw new NotFoundError(
      'El acceso de demostración aún no está habilitado.'
    );
  const role: unknown = req.body?.role;
  if (
    typeof role !== 'string' ||
    !Object.prototype.hasOwnProperty.call(accounts, role)
  ) {
    throw new BadRequestError('Selecciona un rol de demostración válido.');
  }
  try {
    // Evita abrir la vista administrativa sobre una base con cuentas ajenas a la demo.
    const otherUsers = await prisma.usuario.count({
      where: {
        esSuperAdmin: false,
        NOT: { email: { endsWith: '@pasp-demo.test' } },
      },
    });
    if (otherUsers > 0) {
      throw new AppError(
        503,
        'DEMO_NOT_READY',
        'El entorno de demostración todavía no está preparado.'
      );
    }
    const user = await prisma.usuario.findUnique({
      where: { email: accounts[role] },
    });
    if (!user || !user.activo || user.esSuperAdmin || user.rol !== role) {
      throw new AppError(
        503,
        'DEMO_NOT_READY',
        'Esta cuenta de demostración todavía no está disponible.'
      );
    }
    sendSuccess(res, createLoginResponse(user, true));
  } catch (error) {
    if (isTransientDatabaseError(error)) {
      sendDatabaseWakingUp(res);
      return;
    }
    throw error;
  }
});

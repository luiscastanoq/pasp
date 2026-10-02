import { Request, Response } from 'express';

import { logger } from '../config/logger';
import { checkDatabaseReadiness } from '../services/database-readiness.service';
import { isTransientDatabaseError } from '../shared/database/database-retry';
import {
  asyncHandler,
  sendDatabaseWakingUp,
  sendSuccess,
} from '../shared/http';

export const databaseReadiness = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      await checkDatabaseReadiness();

      sendSuccess(
        res,
        {
          status: 'READY',
          database: 'READY',
        },
        200,
        'Servicio preparado'
      );
    } catch (error) {
      if (!isTransientDatabaseError(error)) {
        throw error;
      }

      logger.warn('Azure SQL todavía no está preparada', {
        code: 'DATABASE_WAKING_UP',
        requestId: req.requestId,
      });

      sendDatabaseWakingUp(res);
    }
  }
);

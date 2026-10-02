import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes';
import tutorRoutes from './routes/tutor.routes';
import tutorAcademicoRoutes from './routes/tutor-academico.routes';
import becarioRoutes from './routes/becario.routes';
import fichajeRoutes from './routes/fichaje.routes';
import adminRoutes from './routes/admin.routes';
import usuariosRoutes from './routes/usuarios.routes';
import apiV1Routes from './routes/api-v1.routes';
import {
  errorHandler,
  notFoundHandler,
} from './middlewares/error-handler.middleware';
import { sendSuccess } from './shared/http';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { databaseReadiness } from './controllers/health.controller';
import { apiRateLimiter } from './middlewares/rate-limit.middleware';

export const app = express();

if (env.NODE_ENV === 'production') {
  // Azure termina HTTPS delante de Express y envia la IP original en
  // X-Forwarded-For. Confiamos solo en ese primer proxy.
  app.set('trust proxy', 1);
}

app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiRateLimiter);

app.get('/api/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
  }, 200, 'Servidor PASP funcionando correctamente');
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'OK',
    version: 'v1',
    timestamp: new Date().toISOString(),
  }, 200, 'Servidor PASP funcionando correctamente');
});

app.get('/api/v1/health/ready', databaseReadiness);

app.use('/api/v1', apiV1Routes);

// Rutas legacy mantenidas temporalmente para no romper clientes existentes.
app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/tutor-academico', tutorAcademicoRoutes);
app.use('/api/becario', becarioRoutes);
app.use('/api/fichaje', fichajeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

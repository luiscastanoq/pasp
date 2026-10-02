import { app } from './app';
import { env } from './config/env';
import logger from './config/logger';

app.listen(env.PORT, () => {
  logger.info('Servidor iniciado', {
    baseUrl: `http://localhost:${env.PORT}`,
    healthUrl: `http://localhost:${env.PORT}/api/v1/health`,
    authLoginUrl: `http://localhost:${env.PORT}/api/v1/auth/login`,
  });
});

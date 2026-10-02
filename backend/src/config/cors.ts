import { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins = env.FRONTEND_URL
  ? env.FRONTEND_URL.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];

if (env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('FRONTEND_URL debe definir al menos un origen en producción');
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      (env.NODE_ENV !== 'production' && allowedOrigins.length === 0) ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
};

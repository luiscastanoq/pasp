import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno obligatoria no definida: ${name}`);
  }
  return value;
}

function parsePort(value: string | undefined): number {
  if (!value) return 3001;
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      `PORT debe ser un numero entero positivo. Valor recibido: ${value}`
    );
  }
  return port;
}

export const env = {
  DEMO_MODE: process.env.PASP_DEMO_MODE === 'true',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parsePort(process.env.PORT),
  FRONTEND_URL: process.env.FRONTEND_URL,
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '2h',
  DEMO_JWT_EXPIRES_IN: process.env.DEMO_JWT_EXPIRES_IN ?? '30m',
} as const;

import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/auth.service', () => ({
  loginUser: vi.fn(),
  changePassword: vi.fn(),
}));

import { app } from '../app';
import { loginUser } from '../services/auth.service';

const credentials = {
  email: 'persona@pasp-demo.test',
  password: 'Password123!',
};

describe('POST /api/v1/auth/login ante errores de base de datos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 503 sin exponer la conexión cuando Azure SQL sigue iniciándose', async () => {
    vi.mocked(loginUser).mockRejectedValue({
      code: 'P1001',
      message: "Can't reach database server at sql-private.example.test:1433",
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(credentials);

    expect(response.status).toBe(503);
    expect(response.headers['retry-after']).toBe('5');
    expect(response.body).toEqual({
      success: false,
      code: 'DATABASE_WAKING_UP',
      message: 'La base de datos se está iniciando',
    });
    expect(JSON.stringify(response.body)).not.toContain('sql-private');
  });

  it('mantiene 401 para unas credenciales incorrectas', async () => {
    vi.mocked(loginUser).mockRejectedValue(new Error('Credenciales inválidas'));

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(credentials);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
    expect(response.body.message).toBe('Credenciales inválidas');
    expect(response.headers['retry-after']).toBeUndefined();
  });

  it('mantiene 500 para un error inesperado', async () => {
    vi.mocked(loginUser).mockRejectedValue(
      new Error('Fallo inesperado de programación')
    );

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(credentials);

    expect(response.status).toBe(500);
    expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(response.body.message).toBe('Error interno del servidor');
    expect(response.headers['retry-after']).toBeUndefined();
  });
});

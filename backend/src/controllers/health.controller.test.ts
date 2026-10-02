import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/database-readiness.service', () => ({
  checkDatabaseReadiness: vi.fn(),
}));

import { app } from '../app';
import { checkDatabaseReadiness } from '../services/database-readiness.service';

describe('GET /api/v1/health/ready', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 200 cuando Azure SQL está preparada', async () => {
    vi.mocked(checkDatabaseReadiness).mockResolvedValue();

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Servicio preparado',
      data: {
        status: 'READY',
        database: 'READY',
      },
    });
    expect(response.headers['retry-after']).toBeUndefined();
  });

  it('responde 503 y Retry-After cuando la base se está reanudando', async () => {
    vi.mocked(checkDatabaseReadiness).mockRejectedValue({
      code: 'P1001',
      message: "Can't reach database server at sql-private.example.test:1433",
    });

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(503);
    expect(response.headers['retry-after']).toBe('5');
    expect(response.body).toEqual({
      success: false,
      code: 'DATABASE_WAKING_UP',
      message: 'La base de datos se está iniciando',
    });
    expect(JSON.stringify(response.body)).not.toContain('sql-private');
  });

  it('delega los errores inesperados al manejador general', async () => {
    vi.mocked(checkDatabaseReadiness).mockRejectedValue(
      new Error('Fallo inesperado con información interna')
    );

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(response.body.message).toBe('Error interno del servidor');
    expect(JSON.stringify(response.body)).not.toContain('información interna');
  });
});

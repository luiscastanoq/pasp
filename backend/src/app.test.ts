import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from './app';

describe('GET /api/health', () => {
  it('responde correctamente cuando el backend esta vivo', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('OK');
  });
});


describe('GET /api/v1/health', () => {
  it('responde correctamente en la version v1 de la API', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('OK');
    expect(response.body.data.version).toBe('v1');
  });
});
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../database/prisma', () => ({
  prisma: { usuario: { count: vi.fn(), findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock('../utils/password.util', () => ({
  comparePassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('nuevo-hash'),
}));
import { prisma } from '../database/prisma';
import { app } from '../app';
import { env } from '../config/env';
import { generateToken, verifyToken } from '../utils/jwt.util';

describe('acceso y permisos de demostración', () => {
  const originalDemoMode = env.DEMO_MODE;
  afterEach(() => Object.assign(env, { DEMO_MODE: originalDemoMode }));
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(env, { DEMO_MODE: true });
    vi.mocked(prisma.usuario.count).mockResolvedValue(0);
  });

  it.each([
    ['Administrador', 'elena.robles@pasp-demo.test'],
    ['Tutor_Empresa', 'marcos.vidal@pasp-demo.test'],
    ['Tutor_Academico', 'julia.bernal@pasp-demo.test'],
    ['Becario', 'hugo.salas@pasp-demo.test'],
  ])(
    'inicia %s sin exponer contraseña y con token de consulta',
    async (role, email) => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
        idUsuario: 4,
        email,
        rol: role,
        activo: true,
        esSuperAdmin: false,
        primerAcceso: true,
        passwordHash: 'privado',
        nombre: 'Demo',
        apellidos: 'PASP',
      } as never);
      const response = await request(app)
        .post('/api/v1/auth/demo-login')
        .send({ role });
      expect(response.status).toBe(200);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.user.primerAcceso).toBe(false);
      expect(verifyToken(response.body.data.token)).toMatchObject({
        demo: true,
        esSuperAdmin: false,
        role,
      });
    }
  );

  it('está cerrado cuando no se activa expresamente', async () => {
    Object.assign(env, { DEMO_MODE: false });
    expect(
      (
        await request(app)
          .post('/api/v1/auth/demo-login')
          .send({ role: 'Administrador' })
      ).status
    ).toBe(404);
    expect(prisma.usuario.count).not.toHaveBeenCalled();
  });

  it('no abre una base con cuentas ordinarias ajenas a la demo', async () => {
    vi.mocked(prisma.usuario.count).mockResolvedValue(1);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/demo-login')
          .send({ role: 'Administrador' })
      ).status
    ).toBe(503);
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('nunca entrega una cuenta superadministradora por el acceso público', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      activo: true,
      esSuperAdmin: true,
      rol: 'Administrador',
    } as never);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/demo-login')
          .send({ role: 'Administrador' })
      ).status
    ).toBe(503);
  });

  it.each(['Superadmin', '__proto__', 'constructor'])(
    'rechaza el rol %s',
    async role => {
      expect(
        (await request(app).post('/api/v1/auth/demo-login').send({ role }))
          .status
      ).toBe(400);
    }
  );

  it.each(['/api/v1/usuarios/4', '/api/usuarios/4'])(
    'bloquea la escritura antes del controlador en %s',
    async url => {
      const token = generateToken({
        userId: 4,
        email: 'demo@pasp-demo.test',
        role: 'Administrador',
        esSuperAdmin: false,
      });
      const response = await request(app)
        .delete(url)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('DEMO_READ_ONLY');
      expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
    }
  );

  it('conserva la restricción de un token demo aunque se desactive el modo', async () => {
    Object.assign(env, { DEMO_MODE: false });
    const token = generateToken({
      userId: 4,
      email: 'demo@pasp-demo.test',
      role: 'Administrador',
      esSuperAdmin: false,
      demo: true,
    });
    const response = await request(app)
      .delete('/api/v1/usuarios/4')
      .set('Authorization', `Bearer ${token}`);
    expect(response.body.code).toBe('DEMO_READ_ONLY');
  });

  it('permite al superadministrador escribir con su sesión privada', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      idUsuario: 1,
      passwordHash: 'hash-actual',
    } as never);
    const token = generateToken({
      userId: 1,
      email: 'admin@example.test',
      role: 'Administrador',
      esSuperAdmin: true,
    });
    const response = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Actual123!', newPassword: 'Nueva123!' });
    expect(response.status).toBe(200);
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idUsuario: 1 } })
    );
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../database/prisma';
import { changePassword, loginUser } from './auth.service';
import { comparePassword, hashPassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { env } from '../config/env';

vi.mock('../database/prisma', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../utils/password.util', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock('../utils/jwt.util', () => ({
  generateToken: vi.fn(),
}));

const usuarioActivo = {
  idUsuario: 7,
  email: 'ana@test.com',
  passwordHash: 'hash-guardado',
  rol: 'Tutor_Academico',
  nombre: 'Ana',
  apellidos: 'Lopez',
  practica: null,
  cliente: null,
  primerAcceso: true,
  esSuperAdmin: false,
  activo: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('auth.service', () => {
  it('mantiene al superadministrador fuera de las sesiones demo al entrar con contraseña', async () => {
    const originalDemoMode = env.DEMO_MODE;
    Object.assign(env, { DEMO_MODE: true });
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ...usuarioActivo,
      rol: 'Administrador',
      esSuperAdmin: true,
    } as never);
    vi.mocked(comparePassword).mockResolvedValue(true);
    try {
      await loginUser({ email: usuarioActivo.email, password: 'privada' });
      expect(generateToken).toHaveBeenCalledWith(
        expect.objectContaining({ esSuperAdmin: true })
      );
      expect(
        vi.mocked(generateToken).mock.calls[
          vi.mocked(generateToken).mock.calls.length - 1
        ]?.[0]
      ).not.toHaveProperty('demo');
    } finally {
      Object.assign(env, { DEMO_MODE: originalDemoMode });
    }
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia sesion y nunca devuelve el hash de la contrasena', async () => {
    // Simulamos un usuario valido para proteger el camino feliz del inicio de sesion.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(
      usuarioActivo as never
    );
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(generateToken).mockReturnValue('token-seguro');

    const result = await loginUser({
      email: usuarioActivo.email,
      password: 'Password123',
    });

    expect(result.token).toBe('token-seguro');
    expect(result.user.rol).toBe('Tutor_Academico');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('reintenta la lectura del usuario cuando Azure SQL se está iniciando', async () => {
    vi.useFakeTimers();

    try {
      vi.mocked(prisma.usuario.findUnique)
        .mockRejectedValueOnce({
          code: 'P1001',
          message: "Can't reach database server",
        })
        .mockResolvedValue(usuarioActivo as never);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValue('token-tras-reintento');

      const loginPromise = loginUser({
        email: usuarioActivo.email,
        password: 'Password123',
      });

      await vi.advanceTimersByTimeAsync(5_000);

      await expect(loginPromise).resolves.toEqual(
        expect.objectContaining({ token: 'token-tras-reintento' })
      );
      expect(prisma.usuario.findUnique).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rechaza un email que no existe', async () => {
    // El mensaje generico evita confirmar si una direccion esta registrada.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);

    await expect(
      loginUser({ email: 'nadie@test.com', password: 'Password123' })
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('rechaza una contrasena incorrecta y una cuenta inactiva', async () => {
    // Ambos casos deben detener el acceso antes de generar un token de sesion.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(
      usuarioActivo as never
    );
    vi.mocked(comparePassword).mockResolvedValue(false);
    await expect(
      loginUser({ email: usuarioActivo.email, password: 'incorrecta' })
    ).rejects.toThrow('Credenciales inválidas');

    vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
      ...usuarioActivo,
      activo: false,
    } as never);
    await expect(
      loginUser({ email: usuarioActivo.email, password: 'Password123' })
    ).rejects.toThrow('Cuenta inactiva');
    expect(generateToken).not.toHaveBeenCalled();
  });

  it('cambia la contrasena y desactiva el primer acceso', async () => {
    // Al guardar la nueva clave se debe cerrar tambien el flujo obligatorio de primer acceso.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(
      usuarioActivo as never
    );
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue('hash-nuevo');
    vi.mocked(prisma.usuario.update).mockResolvedValue({} as never);

    await changePassword({
      userId: usuarioActivo.idUsuario,
      currentPassword: 'Password123',
      newPassword: 'NuevaClave456',
    });

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'hash-nuevo',
          primerAcceso: false,
        }),
      })
    );
  });

  it('rechaza la contrasena actual incorrecta y una nueva debil', async () => {
    // Estas dos barreras evitan sustituir una clave sin permiso o por otra demasiado simple.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(
      usuarioActivo as never
    );
    vi.mocked(comparePassword).mockResolvedValueOnce(false);
    await expect(
      changePassword({
        userId: 7,
        currentPassword: 'mal',
        newPassword: 'NuevaClave456',
      })
    ).rejects.toThrow('La contraseña actual es incorrecta');

    vi.mocked(comparePassword).mockResolvedValueOnce(true);
    await expect(
      changePassword({
        userId: 7,
        currentPassword: 'Password123',
        newPassword: 'solo-letras',
      })
    ).rejects.toThrow('incluyendo letras y números');
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });
});

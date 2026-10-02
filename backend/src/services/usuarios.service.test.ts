import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../database/prisma';
import { deleteUsuario, toggleActivoUsuario, updateAdministrador } from './usuarios.service';

vi.mock('../database/prisma', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('usuarios.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza cambiar un email por otro que ya esta en uso', async () => {
    // Esta comprobacion protege la unicidad del email antes de intentar escribir en la base.
    vi.mocked(prisma.usuario.findUnique)
      .mockResolvedValueOnce({ idUsuario: 2, email: 'actual@test.com' } as never)
      .mockResolvedValueOnce({ idUsuario: 3, email: 'ocupado@test.com' } as never);

    const action = updateAdministrador(2, { email: ' OCUPADO@test.com ' });

    await expect(action).rejects.toMatchObject({ message: 'EMAIL_DUPLICADO', statusCode: 409 });
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('activa un usuario que estaba inactivo', async () => {
    // El servicio debe invertir el estado actual, no fijar siempre el mismo valor.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      idUsuario: 5,
      activo: false,
      nombre: 'Ana',
      email: 'ana@test.com',
    } as never);
    vi.mocked(prisma.usuario.update).mockResolvedValue({
      idUsuario: 5,
      activo: true,
      rol: 'Becario',
    } as never);

    const result = await toggleActivoUsuario(5);

    expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { activo: true },
    }));
    expect(result.activo).toBe(true);
  });

  it('impide eliminar al superadministrador', async () => {
    // El usuario que sostiene la administracion del sistema debe quedar protegido.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      idUsuario: 1,
      esSuperAdmin: true,
      email: 'root@test.com',
      nombre: 'Root',
    } as never);

    await expect(deleteUsuario(1, 9)).rejects.toMatchObject({
      message: 'NO_PUEDE_ELIMINAR_SUPERADMIN',
      statusCode: 403,
    });
    expect(prisma.usuario.delete).not.toHaveBeenCalled();
  });

  it('impide que un administrador se elimine a si mismo', async () => {
    // Esta regla evita dejar una sesion activa apuntando a un usuario que acaba de borrarse.
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      idUsuario: 9,
      esSuperAdmin: false,
      email: 'admin@test.com',
      nombre: 'Admin',
    } as never);

    await expect(deleteUsuario(9, 9)).rejects.toMatchObject({
      message: 'NO_PUEDE_ELIMINARSE_A_SI_MISMO',
      statusCode: 403,
    });
    expect(prisma.usuario.delete).not.toHaveBeenCalled();
  });
});

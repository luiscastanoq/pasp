import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../app';
import * as usuariosService from '../services/usuarios.service';
import { ROLES } from '../shared/constants/domain.constants';
import { generateToken } from '../utils/jwt.util';

vi.mock('../services/usuarios.service', () => ({
  usuariosService: {
    updateAdministrador: vi.fn(),
    toggleActivoUsuario: vi.fn(),
  },
}));

const tokenAdministrador = generateToken({
  userId: 1,
  email: 'admin@test.com',
  role: ROLES.ADMINISTRADOR,
  esSuperAdmin: false,
});

const usuarioBase = {
  idUsuario: 15,
  nombre: 'Usuario',
  apellidos: 'Temporal',
  email: 'temporal@test.com',
  rol: ROLES.ADMINISTRADOR,
  activo: true,
};

describe('rutas de gestión de usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('actualiza un usuario pasando por validación y controlador', async () => {
    // Protege el contrato HTTP real y la conversión del ID antes del servicio.
    vi.mocked(
      usuariosService.usuariosService.updateAdministrador,
    ).mockResolvedValue({
      ...usuarioBase,
      nombre: 'Usuario editado',
    } as never);

    const response = await request(app)
      .put('/api/v1/usuarios/15')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        nombre: 'Usuario editado',
        apellidos: 'Temporal',
        email: 'temporal@test.com',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.usuario.nombre).toBe('Usuario editado');
    expect(
      usuariosService.usuariosService.updateAdministrador,
    ).toHaveBeenCalledWith(15, {
      nombre: 'Usuario editado',
      apellidos: 'Temporal',
      email: 'temporal@test.com',
    });
  });

  it('deshabilita un usuario desde la ruta administrativa', async () => {
    // Así detectaremos si se rompe la unión entre PATCH, controlador y servicio.
    vi.mocked(
      usuariosService.usuariosService.toggleActivoUsuario,
    ).mockResolvedValue({ ...usuarioBase, activo: false } as never);

    const response = await request(app)
      .patch('/api/v1/usuarios/15/estado')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(response.status).toBe(200);
    expect(response.body.data.usuario.activo).toBe(false);
    expect(response.body.message).toContain('deshabilitado');
    expect(
      usuariosService.usuariosService.toggleActivoUsuario,
    ).toHaveBeenCalledWith(15);
  });
});

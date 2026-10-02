import { describe, expect, it } from 'vitest';

import { ROLES } from '../constants/domain.constants';
import { createUsuarioSchema } from './usuarios.schemas';

describe('createUsuarioSchema', () => {
  it('rechaza un email con formato invalido', () => {
    // Este test protege una validacion basica: no deberia crearse un usuario con email mal formado.
    const result = createUsuarioSchema.safeParse({
      nombre: 'Luis',
      apellidos: 'Garcia',
      email: 'email-invalido',
      contrasena: 'Password123!',
      rol: ROLES.ADMINISTRADOR,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['email']);
  });

  it('exige los campos de practicas cuando el usuario es becario', () => {
    // Un becario necesita datos extra para que su ficha y seguimiento funcionen correctamente.
    const result = createUsuarioSchema.safeParse({
      nombre: 'Ana',
      apellidos: 'Lopez',
      email: 'ana.lopez@test.com',
      contrasena: 'Password123!',
      rol: ROLES.BECARIO,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map(issue => issue.path[0])).toEqual(
      expect.arrayContaining([
        'practica',
        'cliente',
        'horasContrato',
        'fechaInicioPracticas',
        'fechaFinPracticas',
        'tipoFormacion',
        'nombreFormacion',
        'centroEstudios',
      ]),
    );
  });

  it('acepta un usuario administrador con los campos minimos validos', () => {
    // Este caso confirma el camino feliz mas simple: un admin no necesita datos de practicas.
    const result = createUsuarioSchema.safeParse({
      nombre: 'Luis',
      apellidos: 'Garcia',
      email: 'luis.garcia@test.com',
      contrasena: 'Password123!',
      rol: ROLES.ADMINISTRADOR,
    });

    expect(result.success).toBe(true);
  });
});

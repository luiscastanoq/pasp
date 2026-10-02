import request, { type Test } from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../app';
import { ROLES } from '../shared/constants/domain.constants';
import { generateToken } from '../utils/jwt.util';

const roles = [
  ROLES.ADMINISTRADOR,
  ROLES.TUTOR_EMPRESA,
  ROLES.TUTOR_ACADEMICO,
  ROLES.BECARIO,
] as const;

const tokens = Object.fromEntries(
  roles.map((role, index) => [
    role,
    generateToken({
      userId: index + 1,
      email: `${role.toLowerCase()}@test.com`,
      role,
      esSuperAdmin: false,
    }),
  ]),
) as Record<(typeof roles)[number], string>;

interface CasoPermiso {
  zona: string;
  ejecutar: (token: string) => Test;
  rolesPermitidos: readonly string[];
  estadoTrasPermiso: 400 | 422;
}

const casos: CasoPermiso[] = [
  {
    zona: 'administración',
    ejecutar: token =>
      request(app)
        .get('/api/v1/usuarios/id-invalido')
        .set('Authorization', `Bearer ${token}`),
    rolesPermitidos: [ROLES.ADMINISTRADOR],
    estadoTrasPermiso: 422,
  },
  {
    zona: 'tutor de empresa',
    ejecutar: token =>
      request(app)
        .get('/api/v1/tutor/becarios/id-invalido')
        .set('Authorization', `Bearer ${token}`),
    rolesPermitidos: [ROLES.ADMINISTRADOR, ROLES.TUTOR_EMPRESA],
    estadoTrasPermiso: 422,
  },
  {
    zona: 'tutor académico',
    ejecutar: token =>
      request(app)
        .get('/api/v1/tutor-academico/becarios/id-invalido/evaluaciones')
        .set('Authorization', `Bearer ${token}`),
    rolesPermitidos: [ROLES.ADMINISTRADOR, ROLES.TUTOR_ACADEMICO],
    estadoTrasPermiso: 422,
  },
  {
    zona: 'becario',
    ejecutar: token =>
      request(app)
        .get('/api/v1/becario/tareas/id-invalido/historial')
        .set('Authorization', `Bearer ${token}`),
    rolesPermitidos: [ROLES.ADMINISTRADOR, ROLES.BECARIO],
    estadoTrasPermiso: 422,
  },
  {
    zona: 'fichaje',
    ejecutar: token =>
      request(app)
        .put('/api/v1/fichaje/id-invalido/salida')
        .set('Authorization', `Bearer ${token}`)
        .send({ horasImputadas: 8 }),
    rolesPermitidos: [ROLES.ADMINISTRADOR, ROLES.BECARIO],
    estadoTrasPermiso: 400,
  },
];

describe('matriz de permisos de las rutas', () => {
  for (const caso of casos) {
    for (const role of roles) {
      it(`${caso.zona}: aplica la regla al rol ${role}`, async () => {
        // Un ID inválido permite probar autenticación, rol y validación sin consultar la BD.
        const response = await caso.ejecutar(tokens[role]);
        const permitido = caso.rolesPermitidos.includes(role);

        // 400/422 significa que llegó a validación; 403 que fue bloqueado antes.
        expect(response.status).toBe(
          permitido ? caso.estadoTrasPermiso : 403,
        );
      });
    }
  }
});

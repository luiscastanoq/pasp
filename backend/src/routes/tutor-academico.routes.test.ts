import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../app';
import { ROLES } from '../shared/constants/domain.constants';
import * as evaluacionService from '../services/evaluacion.service';
import * as tutorService from '../services/tutor.service';
import { generateToken } from '../utils/jwt.util';

vi.mock('../services/tutor.service', () => ({
  getBecariosAcademicosByTutorId: vi.fn(),
}));

vi.mock('../services/evaluacion.service', () => ({
  getEvaluacionesByBecario: vi.fn(),
}));

const tokenAcademico = generateToken({
  userId: 31,
  email: 'academico@test.com',
  role: ROLES.TUTOR_ACADEMICO,
  esSuperAdmin: false,
});

const tokenEmpresa = generateToken({
  userId: 32,
  email: 'empresa@test.com',
  role: ROLES.TUTOR_EMPRESA,
  esSuperAdmin: false,
});

const becarioAsignado = { idBecario: 3, nombre: 'Luis' };

describe('rutas del tutor académico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista únicamente los becarios devueltos para el tutor autenticado', async () => {
    // La identidad utilizada por la consulta debe proceder del token, no de la URL.
    vi.mocked(tutorService.getBecariosAcademicosByTutorId).mockResolvedValue([
      becarioAsignado,
    ] as never);

    const response = await request(app)
      .get('/api/v1/tutor-academico/becarios')
      .set('Authorization', `Bearer ${tokenAcademico}`);

    expect(response.status).toBe(200);
    expect(tutorService.getBecariosAcademicosByTutorId).toHaveBeenCalledWith(31);
    expect(response.body.data.becarios).toEqual([becarioAsignado]);
  });

  it('permite leer las evaluaciones de un becario académico asignado', async () => {
    // Comprobamos la ruta completa: rol, asignación y servicio de evaluaciones.
    vi.mocked(tutorService.getBecariosAcademicosByTutorId).mockResolvedValue([
      becarioAsignado,
    ] as never);
    vi.mocked(evaluacionService.getEvaluacionesByBecario).mockResolvedValue([]);

    const response = await request(app)
      .get('/api/v1/tutor-academico/becarios/3/evaluaciones')
      .set('Authorization', `Bearer ${tokenAcademico}`);

    expect(response.status).toBe(200);
    expect(response.body.data.evaluaciones).toEqual([]);
  });

  it('rechaza un becario no asignado y también un rol de tutor distinto', async () => {
    // Cambiar manualmente el ID o reutilizar otra clase de tutor no concede acceso.
    vi.mocked(tutorService.getBecariosAcademicosByTutorId).mockResolvedValue([
      becarioAsignado,
    ] as never);

    const noAsignado = await request(app)
      .get('/api/v1/tutor-academico/becarios/99/evaluaciones')
      .set('Authorization', `Bearer ${tokenAcademico}`);
    expect(noAsignado.status).toBe(403);
    expect(evaluacionService.getEvaluacionesByBecario).not.toHaveBeenCalled();

    const rolIncorrecto = await request(app)
      .get('/api/v1/tutor-academico/becarios')
      .set('Authorization', `Bearer ${tokenEmpresa}`);
    expect(rolIncorrecto.status).toBe(403);
  });
});

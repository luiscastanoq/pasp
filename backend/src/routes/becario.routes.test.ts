import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../app';
import { ESTADO_TAREA, ROLES } from '../shared/constants/domain.constants';
import * as becarioService from '../services/becario.service';
import { generateToken } from '../utils/jwt.util';

vi.mock('../services/becario.service', () => ({
  getTareaHistorial: vi.fn(),
  updateTareaEstado: vi.fn(),
}));

const tokenBecario = generateToken({
  userId: 21,
  email: 'becario@test.com',
  role: ROLES.BECARIO,
  esSuperAdmin: false,
});

describe('rutas de tareas del becario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acepta el ID convertido por Zod al consultar el historial', async () => {
    // Esta prueba recorre ruta, validación y controlador: el punto exacto del bug.
    vi.mocked(becarioService.getTareaHistorial).mockResolvedValue([]);

    const response = await request(app)
      .get('/api/v1/becario/tareas/15/historial')
      .set('Authorization', `Bearer ${tokenBecario}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [] });
    expect(becarioService.getTareaHistorial).toHaveBeenCalledWith(
      15,
      21,
      ROLES.BECARIO,
    );
  });

  it('acepta el mismo ID al cambiar el estado de la tarea', async () => {
    // GET y PATCH comparten el conversor, por eso protegemos ambos recorridos.
    vi.mocked(becarioService.updateTareaEstado).mockResolvedValue({
      idTarea: 15,
      estado: ESTADO_TAREA.EN_PROGRESO,
    } as never);

    const response = await request(app)
      .patch('/api/v1/becario/tareas/15/estado')
      .set('Authorization', `Bearer ${tokenBecario}`)
      .send({ estado: ESTADO_TAREA.EN_PROGRESO });

    expect(response.status).toBe(200);
    expect(becarioService.updateTareaEstado).toHaveBeenCalledWith(
      15,
      21,
      ESTADO_TAREA.EN_PROGRESO,
    );
  });
});

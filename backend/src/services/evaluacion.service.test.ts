import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../database/prisma';
import {
  createEvaluacion,
  deleteEvaluacion,
  getEvaluacionesByBecario,
} from './evaluacion.service';
import { verificarAsignacionTutorBecario } from './tutor.service';

vi.mock('../database/prisma', () => ({
  prisma: {
    becario: { findUnique: vi.fn() },
    usuario: { findUnique: vi.fn() },
    evaluacion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('./tutor.service', () => ({
  verificarAsignacionTutorBecario: vi.fn(),
}));

const datosValidos = {
  idBecario: 3,
  idTutorEvaluador: 8,
  titulo: ' Evaluacion mensual ',
  descripcion: ' Buen progreso ',
  puntuacionPuntualidad: 5,
  puntuacionCalidad: 4,
  puntuacionActitud: 3,
  puntuacionAutonomia: 2,
  puntuacionComunicacion: 1,
};

describe('evaluacion.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(true);
  });

  it('calcula la media y limpia los textos antes de guardar', async () => {
    // Las notas 5, 4, 3, 2 y 1 tienen media 3; comprobamos la regla completa de guardado.
    vi.mocked(prisma.becario.findUnique).mockResolvedValue({ idBecario: 3 } as never);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ idUsuario: 8 } as never);
    vi.mocked(prisma.evaluacion.create).mockResolvedValue({ idEvaluacion: 11 } as never);

    await createEvaluacion(datosValidos);

    expect(prisma.evaluacion.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        titulo: 'Evaluacion mensual',
        comentarios: 'Buen progreso',
        puntuacionMedia: 3,
      }),
    }));
  });

  it('rechaza puntuaciones fuera de rango aunque se salte la validacion HTTP', async () => {
    // La regla se repite en el servicio para proteger llamadas internas o futuras rutas.
    vi.mocked(prisma.becario.findUnique).mockResolvedValue({ idBecario: 3 } as never);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ idUsuario: 8 } as never);

    await expect(createEvaluacion({
      ...datosValidos,
      puntuacionCalidad: 6,
    })).rejects.toThrow('enteros entre 1 y 5');
    expect(prisma.evaluacion.create).not.toHaveBeenCalled();
  });

  it('rechaza una evaluacion si el becario o el tutor no existen', async () => {
    // No debe crearse una evaluacion que apunte a personas inexistentes.
    vi.mocked(prisma.becario.findUnique).mockResolvedValueOnce(null);
    await expect(createEvaluacion(datosValidos)).rejects.toThrow('Becario no encontrado');

    vi.mocked(prisma.becario.findUnique).mockResolvedValueOnce({ idBecario: 3 } as never);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce(null);
    await expect(createEvaluacion(datosValidos)).rejects.toThrow('Tutor no encontrado');
  });

  it('solo elimina una evaluacion que existe', async () => {
    // Comprobamos primero el caso de error y despues que el registro correcto si se borra.
    vi.mocked(prisma.evaluacion.findUnique).mockResolvedValueOnce(null);
    await expect(deleteEvaluacion(99, 3, 8)).rejects.toThrow('Evaluación no encontrada');

    vi.mocked(prisma.evaluacion.findUnique).mockResolvedValueOnce({
      idEvaluacion: 11,
      idBecario: 3,
    } as never);
    vi.mocked(prisma.evaluacion.delete).mockResolvedValue({ idEvaluacion: 11 } as never);
    await deleteEvaluacion(11, 3, 8);
    expect(prisma.evaluacion.delete).toHaveBeenCalledWith({ where: { idEvaluacion: 11 } });
  });

  it('impide consultar y crear evaluaciones de un becario no asignado', async () => {
    // Leer notas ajenas también es una fuga de información, aunque no cambie datos.
    vi.mocked(prisma.becario.findUnique).mockResolvedValue({ idBecario: 3 } as never);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ idUsuario: 8 } as never);
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(false);

    await expect(getEvaluacionesByBecario(3, 8)).rejects.toThrow('No tienes permisos');
    expect(prisma.evaluacion.findMany).not.toHaveBeenCalled();

    await expect(createEvaluacion(datosValidos)).rejects.toThrow('No tienes permisos');
    expect(prisma.evaluacion.create).not.toHaveBeenCalled();
  });

  it('impide borrar una evaluación ajena o con un becario distinto en la URL', async () => {
    // Se validan tanto el recurso real como el becario indicado por la petición.
    vi.mocked(prisma.evaluacion.findUnique).mockResolvedValue({
      idEvaluacion: 11,
      idBecario: 3,
    } as never);

    await expect(deleteEvaluacion(11, 4, 8)).rejects.toThrow('Evaluación no encontrada');
    expect(prisma.evaluacion.delete).not.toHaveBeenCalled();

    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(false);
    await expect(deleteEvaluacion(11, 3, 99)).rejects.toThrow('No tienes permisos');
    expect(prisma.evaluacion.delete).not.toHaveBeenCalled();
  });
});

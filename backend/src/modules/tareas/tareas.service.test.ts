import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../database/prisma';
import { ESTADO_TAREA } from '../../shared/constants/domain.constants';
import {
  createTarea,
  deleteTarea,
  getTareaHistorial,
  getTareasByBecarioId,
  updateTarea,
} from './tareas.service';
import { verificarAsignacionTutorBecario } from '../../services/tutor.service';

vi.mock('../../database/prisma', () => ({
  prisma: {
    becario: { findUnique: vi.fn() },
    usuario: { findUnique: vi.fn() },
    tarea: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    tareaHistorial: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../services/tutor.service', () => ({
  verificarAsignacionTutorBecario: vi.fn(),
}));

const tareaBase = {
  idTarea: 10,
  idBecario: 2,
  idTutorAsignador: 8,
  nombreTarea: 'Preparar informe',
  descripcion: null,
  estado: ESTADO_TAREA.PENDIENTE,
  fechaInicio: new Date('2026-07-01'),
  fechaFinEstimada: null,
  fechaCompletada: null,
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-01'),
};

describe('tareas.service', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(true);
  });

  it('rechaza nombres cortos y una fecha final anterior al inicio', async () => {
    // Estas reglas evitan tareas irreconocibles y periodos de trabajo imposibles.
    await expect(createTarea({
      idBecario: 2,
      idTutorAsignador: 8,
      nombreTarea: 'No',
      fechaInicio: new Date('2026-07-10'),
    })).rejects.toThrow('al menos 3 caracteres');

    vi.mocked(prisma.becario.findUnique).mockResolvedValue({ idBecario: 2 } as never);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ idUsuario: 8 } as never);
    await expect(createTarea({
      idBecario: 2,
      idTutorAsignador: 8,
      nombreTarea: 'Informe',
      fechaInicio: new Date('2026-07-10'),
      fechaFinEstimada: new Date('2026-07-01'),
    })).rejects.toThrow('posterior a la fecha de inicio');
  });

  it('al completar una tarea fija la fecha y registra el historial', async () => {
    // El cambio de estado debe actualizar la tarea y dejar una pista de quien lo realizo.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00.000Z'));
    vi.mocked(prisma.tarea.findUnique).mockResolvedValue(tareaBase as never);
    const update = vi.fn().mockResolvedValue({
      ...tareaBase,
      estado: ESTADO_TAREA.COMPLETADA,
      fechaCompletada: new Date('2026-07-13T12:00:00.000Z'),
    });
    const createHistory = vi.fn().mockResolvedValue({});
    vi.mocked(prisma.$transaction).mockImplementation(async callback => callback({
      tarea: { update },
      tareaHistorial: { create: createHistory },
    } as never));

    const result = await updateTarea(
      10,
      {
        estado: ESTADO_TAREA.COMPLETADA,
        idUsuarioModificador: 15,
      },
      15,
    );

    expect(result.fechaCompletada).toBe('2026-07-13');
    expect(createHistory).toHaveBeenCalledWith({
      data: expect.objectContaining({
        estadoAnterior: ESTADO_TAREA.PENDIENTE,
        estadoNuevo: ESTADO_TAREA.COMPLETADA,
        idUsuarioModificador: 15,
      }),
    });
  });

  it('limpia fechaCompletada cuando la tarea vuelve a estar en progreso', async () => {
    // Reabrir una tarea significa que ya no debe figurar como completada en los listados.
    vi.mocked(prisma.tarea.findUnique).mockResolvedValue({
      ...tareaBase,
      estado: ESTADO_TAREA.COMPLETADA,
      fechaCompletada: new Date('2026-07-12'),
    } as never);
    const update = vi.fn().mockImplementation(async args => ({ ...tareaBase, ...args.data }));
    vi.mocked(prisma.$transaction).mockImplementation(async callback => callback({
      tarea: { update },
      tareaHistorial: { create: vi.fn() },
    } as never));

    const result = await updateTarea(
      10,
      { estado: ESTADO_TAREA.EN_PROGRESO },
      8,
    );

    expect(result.fechaCompletada).toBeNull();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ fechaCompletada: null }),
    }));
  });

  it('impide consultar el historial a un tutor no asignado', async () => {
    // Conocer el ID de una tarea no debe permitir leer datos de otro becario.
    vi.mocked(prisma.tarea.findUnique).mockResolvedValue({
      ...tareaBase,
      becario: { idBecario: 2 },
    } as never);
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(false);

    await expect(getTareaHistorial(10, 99)).rejects.toThrow('No tienes permisos');
    expect(prisma.tareaHistorial.findMany).not.toHaveBeenCalled();
  });

  it('impide listar las tareas de un becario no asignado al tutor', async () => {
    // Incluso una consulta de solo lectura puede revelar información privada.
    vi.mocked(prisma.becario.findUnique).mockResolvedValue({ idBecario: 2 } as never);
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(false);

    await expect(getTareasByBecarioId(2, 99)).rejects.toThrow('No tienes permisos');
    expect(prisma.tarea.findMany).not.toHaveBeenCalled();
  });

  it('impide crear tareas para un becario no asignado al tutor', async () => {
    // Un tutor solo puede asignar trabajo a los becarios vinculados con él.
    vi.mocked(prisma.becario.findUnique).mockResolvedValue({ idBecario: 2 } as never);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ idUsuario: 99 } as never);
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(false);

    await expect(createTarea({
      idBecario: 2,
      idTutorAsignador: 99,
      nombreTarea: 'Tarea ajena',
      fechaInicio: new Date('2026-07-16'),
    })).rejects.toThrow('No tienes permisos');
    expect(prisma.tarea.create).not.toHaveBeenCalled();
  });

  it('impide actualizar una tarea cuando el tutor no tiene asignado al becario', async () => {
    // Conocer el ID no concede permiso para cambiar estado, texto o fechas.
    vi.mocked(prisma.tarea.findUnique).mockResolvedValue(tareaBase as never);
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(false);

    await expect(
      updateTarea(10, { estado: ESTADO_TAREA.EN_PROGRESO }, 99),
    ).rejects.toThrow('No tienes permisos');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('impide eliminar una tarea cuando el tutor no tiene asignado al becario', async () => {
    // El servicio debe rechazar la operación antes de ejecutar el DELETE real.
    vi.mocked(prisma.tarea.findUnique).mockResolvedValue(tareaBase as never);
    vi.mocked(verificarAsignacionTutorBecario).mockResolvedValue(false);

    await expect(deleteTarea(10, 99)).rejects.toThrow('No tienes permisos');
    expect(prisma.tarea.delete).not.toHaveBeenCalled();
  });

  it('permite eliminar la tarea cuando el tutor tiene asignado al becario', async () => {
    // El caso correcto evita que la protección bloquee el trabajo normal del tutor.
    vi.mocked(prisma.tarea.findUnique).mockResolvedValue(tareaBase as never);
    vi.mocked(prisma.tarea.delete).mockResolvedValue(tareaBase as never);

    await deleteTarea(10, 8);

    expect(prisma.tarea.delete).toHaveBeenCalledWith({
      where: { idTarea: 10 },
    });
  });
});

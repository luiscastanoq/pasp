import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../database/prisma';
import {
  ficharEntrada,
  ficharSalida,
  getFichajeActivo,
  getHistorialFichajes,
} from './fichaje.service';

vi.mock('../database/prisma', () => ({
  prisma: {
    becario: { findUnique: vi.fn() },
    fichaje: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const fechaFija = new Date('2026-07-13T10:00:00.000Z');

const fichajeBase = {
  idFichaje: 20,
  idBecario: 4,
  fecha: new Date('2026-07-13T00:00:00.000Z'),
  horaEntrada: new Date('2026-07-13T06:30:00.000Z'),
  horaSalida: null,
  horasTrabajadas: null,
  horas_imputadas: null,
  createdAt: new Date('2026-07-13T06:30:00.000Z'),
  updatedAt: new Date('2026-07-13T06:30:00.000Z'),
};

describe('fichaje.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(fechaFija);
  });

  it('registra una entrada para un becario activo', async () => {
    // Fijamos el reloj para que el resultado no dependa del dia ni de la hora de ejecucion.
    vi.mocked(prisma.becario.findUnique).mockResolvedValue({
      idBecario: 4,
      usuario: { activo: true },
    } as never);
    vi.mocked(prisma.fichaje.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.fichaje.create).mockResolvedValue(fichajeBase as never);

    const result = await ficharEntrada({ idBecario: 4 });

    expect(result.idFichaje).toBe(20);
    expect(prisma.fichaje.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ idBecario: 4, horaEntrada: fechaFija }),
    }));
  });

  it('rechaza la entrada de un usuario inactivo o un segundo fichaje del dia', async () => {
    // Se protegen dos causas frecuentes de registros duplicados o no autorizados.
    vi.mocked(prisma.becario.findUnique).mockResolvedValueOnce({
      idBecario: 4,
      usuario: { activo: false },
    } as never);
    await expect(ficharEntrada({ idBecario: 4 })).rejects.toThrow('Usuario inactivo');

    vi.mocked(prisma.becario.findUnique).mockResolvedValueOnce({
      idBecario: 4,
      usuario: { activo: true },
    } as never);
    vi.mocked(prisma.fichaje.findFirst).mockResolvedValueOnce(fichajeBase as never);
    await expect(ficharEntrada({ idBecario: 4 })).rejects.toThrow('Solo se permite un fichaje por día');
    expect(prisma.fichaje.create).not.toHaveBeenCalled();
  });

  it('registra la salida y calcula las horas trabajadas', async () => {
    // Entre las 06:30 y las 10:00 hay 3.5 horas; este calculo alimenta el resumen del becario.
    vi.mocked(prisma.fichaje.findUnique).mockResolvedValue(fichajeBase as never);
    vi.mocked(prisma.fichaje.update).mockResolvedValue({
      ...fichajeBase,
      horaSalida: fechaFija,
      horasTrabajadas: 3.5,
      horas_imputadas: 3,
    } as never);

    const result = await ficharSalida(20, { horasImputadas: 3 });

    expect(Number(result.horasTrabajadas)).toBe(3.5);
    expect(result.horas_imputadas).toBe(3);
  });

  it('impide registrar dos salidas en el mismo fichaje', async () => {
    // Una segunda salida cambiaria las horas ya cerradas y debe considerarse un error.
    vi.mocked(prisma.fichaje.findUnique).mockResolvedValue({
      ...fichajeBase,
      horaSalida: new Date('2026-07-13T09:00:00.000Z'),
    } as never);

    await expect(ficharSalida(20, { horasImputadas: 2.5 }))
      .rejects.toThrow('ya tiene registrada una salida');
    expect(prisma.fichaje.update).not.toHaveBeenCalled();
  });

  it('rechaza horas imputadas fuera del rango permitido', async () => {
    // Esta barrera evita guardar jornadas negativas, vacias o superiores al maximo razonable.
    await expect(ficharSalida(20, { horasImputadas: -1 }))
      .rejects.toThrow('entre 0.5 y 16');
    await expect(ficharSalida(20, { horasImputadas: 17 }))
      .rejects.toThrow('entre 0.5 y 16');
    await expect(ficharSalida(20, { horasImputadas: Number.NaN }))
      .rejects.toThrow('entre 0.5 y 16');
    expect(prisma.fichaje.findUnique).not.toHaveBeenCalled();
  });

  it('devuelve solo el fichaje que pertenece al dia actual', async () => {
    // Un fichaje de ayer no debe mantener hoy los botones en estado de jornada iniciada.
    vi.mocked(prisma.fichaje.findFirst).mockResolvedValueOnce(fichajeBase as never);
    await expect(getFichajeActivo(4)).resolves.toMatchObject({ idFichaje: 20 });

    vi.mocked(prisma.fichaje.findFirst).mockResolvedValueOnce({
      ...fichajeBase,
      horaEntrada: new Date('2026-07-12T08:00:00.000Z'),
    } as never);
    await expect(getFichajeActivo(4)).resolves.toBeNull();
  });

  it('pagina el historial y transforma horas_imputadas a camelCase', async () => {
    // La prueba protege tanto los limites de pagina como el nombre que recibe el frontend.
    vi.mocked(prisma.fichaje.count).mockResolvedValue(12);
    vi.mocked(prisma.fichaje.findMany).mockResolvedValue([{
      ...fichajeBase,
      horas_imputadas: 3,
    }] as never);

    const result = await getHistorialFichajes({
      idBecario: 4,
      page: 2,
      limit: 5,
      fechaInicio: '2026-07-01',
      fechaFin: '2026-07-31',
    });

    expect(result.totalPages).toBe(3);
    expect(result.fichajes[0].horasImputadas).toBe(3);
    expect(prisma.fichaje.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 5,
      take: 5,
    }));
  });
});

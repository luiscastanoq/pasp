import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../database/prisma';
import {
  createBecarioAsignadoATutor,
  getBecariosAcademicosByTutorId,
  getBecariosByTutorId,
} from './tutor.service';
import { TIPO_TUTORIA } from '../shared/constants/domain.constants';
import * as usuariosCreacionService from '../modules/usuarios';

vi.mock('../database/prisma', () => ({
  prisma: {
    tutorBecario: { findMany: vi.fn() },
    tarea: { groupBy: vi.fn() },
    fichaje: { findFirst: vi.fn() },
  },
}));
vi.mock('../modules/usuarios', () => ({
  createBecario: vi.fn(),
}));

const becarioData = {
  nombre: 'Eva',
  apellidos: 'Becaria',
  email: 'eva.becaria@pasp.com',
  contrasena: 'Temporal123!',
  practica: 'Desarrollo',
  cliente: 'Cliente',
  horasContrato: 600,
  fechaInicioPracticas: '2026-09-01',
  fechaFinPracticas: '2027-02-28',
  tipoFormacion: 'Universitaria',
  nombreFormacion: 'Ingeniería Informática',
  centroEstudios: 'Universidad',
};

describe('consulta de becarios del tutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.tutorBecario.findMany).mockResolvedValue([]);
    vi.mocked(prisma.tarea.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.fichaje.findFirst).mockResolvedValue(null);
  });

  it('devuelve una lista vacía y excluye siempre relaciones inactivas', async () => {
    // Una relación antigua no debe reaparecer en ningún panel de tutor.
    await expect(getBecariosByTutorId(7)).resolves.toEqual([]);
    await expect(getBecariosAcademicosByTutorId(8)).resolves.toEqual([]);

    expect(prisma.tutorBecario.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          idTutor: 7,
          activo: true,
          tipoTutor: {
            in: [
              TIPO_TUTORIA.EMPRESA_PRINCIPAL,
              TIPO_TUTORIA.EMPRESA_SECUNDARIO,
            ],
          },
        }),
      })
    );
    expect(prisma.tutorBecario.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          idTutor: 8,
          activo: true,
          tipoTutor: { in: [TIPO_TUTORIA.ACADEMICO] },
        }),
      })
    );
    expect(prisma.tarea.groupBy).not.toHaveBeenCalled();
  });

  it.each([getBecariosByTutorId, getBecariosAcademicosByTutorId])(
    'separa los estados por becario e incluye ceros cuando no hay tareas',
    async getBecarios => {
      const relaciones = [1, 2, 3].map(idBecario => ({
        idBecario,
        tipoTutor: TIPO_TUTORIA.EMPRESA_PRINCIPAL,
        becario: {
          idBecario,
          horasContrato: 600,
          usuario: { idUsuario: idBecario + 10, nombre: 'Demo', activo: true },
          tutores: [],
        },
      }));
      vi.mocked(prisma.tutorBecario.findMany).mockResolvedValue(
        relaciones as never
      );
      vi.mocked(prisma.tarea.groupBy).mockResolvedValue([
        { idBecario: 1, estado: 'Pendiente', _count: { _all: 1 } },
        { idBecario: 1, estado: 'En_Progreso', _count: { _all: 1 } },
        { idBecario: 1, estado: 'Completada', _count: { _all: 4 } },
        { idBecario: 2, estado: 'Completada', _count: { _all: 3 } },
      ] as never);

      const result = await getBecarios(7);

      expect(result).toEqual([
        expect.objectContaining({
          idBecario: 1,
          tareasAsignadas: 6,
          tareasPendientes: 1,
          tareasEnProgreso: 1,
          tareasCompletadas: 4,
        }),
        expect.objectContaining({
          idBecario: 2,
          tareasAsignadas: 3,
          tareasPendientes: 0,
          tareasEnProgreso: 0,
          tareasCompletadas: 3,
        }),
        expect.objectContaining({
          idBecario: 3,
          tareasAsignadas: 0,
          tareasPendientes: 0,
          tareasEnProgreso: 0,
          tareasCompletadas: 0,
        }),
      ]);
      expect(prisma.tarea.groupBy).toHaveBeenCalledExactlyOnceWith({
        by: ['idBecario', 'estado'],
        where: { idBecario: { in: [1, 2, 3] } },
        _count: { _all: true },
      });
    }
  );
});

describe('creación de becarios por un tutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usuariosCreacionService.createBecario).mockResolvedValue({
      idUsuario: 21,
      email: becarioData.email,
      rol: 'Becario',
      nombre: becarioData.nombre,
      apellidos: becarioData.apellidos,
      primerAcceso: true,
      activo: true,
      createdAt: new Date('2026-08-03T00:00:00.000Z'),
    });
  });

  it('conserva el tipo secundario elegido por el tutor creador sin exigir uno principal', async () => {
    await createBecarioAsignadoATutor(7, {
      ...becarioData,
      tutoresAsignados: [{ tutorId: 7, tipo: TIPO_TUTORIA.EMPRESA_SECUNDARIO }],
    });

    expect(usuariosCreacionService.createBecario).toHaveBeenCalledWith(
      expect.objectContaining({
        tutoresAsignados: [
          { tutorId: 7, tipo: TIPO_TUTORIA.EMPRESA_SECUNDARIO },
        ],
      })
    );
  });

  it('mantiene empresa principal como valor por defecto para clientes antiguos', async () => {
    await createBecarioAsignadoATutor(7, becarioData);

    expect(usuariosCreacionService.createBecario).toHaveBeenCalledWith(
      expect.objectContaining({
        tutoresAsignados: [
          { tutorId: 7, tipo: TIPO_TUTORIA.EMPRESA_PRINCIPAL },
        ],
      })
    );
  });

  it('rechaza un tipo académico para el tutor de empresa creador', async () => {
    await expect(
      createBecarioAsignadoATutor(7, {
        ...becarioData,
        tutoresAsignados: [{ tutorId: 7, tipo: TIPO_TUTORIA.ACADEMICO }],
      })
    ).rejects.toThrow(
      'Tipo de tutoría de empresa inválido para el tutor creador'
    );

    expect(usuariosCreacionService.createBecario).not.toHaveBeenCalled();
  });
});

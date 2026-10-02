import logger from '../../config/logger';
import { prisma } from '../../database/prisma';
import {
  TIPO_TUTORIA,
  TIPOS_TUTORIA_ACADEMICA,
  TIPOS_TUTORIA_EMPRESA,
  TipoTutoriaEmpresa,
  isTutorAcademicoRol,
  isTutorEmpresaRol,
} from '../../shared/constants/domain.constants';

type HttpError = Error & { statusCode?: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

export interface BecarioEmpresaAsignacion {
  becarioId: number;
  tipoTutoria: TipoTutoriaEmpresa;
}

export const getBecariosDeTutorAcademico = async (tutorId: number) => {
  const tutor = await prisma.usuario.findUnique({
    where: { idUsuario: tutorId },
    select: { rol: true },
  });

  if (!tutor) {
    throw new Error('Usuario no encontrado');
  }

  if (!isTutorAcademicoRol(tutor.rol)) {
    throw new Error('El usuario no es un Tutor académico');
  }

  const asignaciones = await prisma.tutorBecario.findMany({
    where: {
      idTutor: tutorId,
      tipoTutor: { in: [...TIPOS_TUTORIA_ACADEMICA] },
      activo: true,
    },
    include: {
      becario: {
        include: {
          usuario: {
            select: {
              nombre: true,
              apellidos: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return asignaciones.map(asignacion => ({
    id: asignacion.idBecario.toString(),
    nombre: asignacion.becario.usuario.nombre,
    apellidos: asignacion.becario.usuario.apellidos,
    emailPersonal: asignacion.becario.emailPersonal || asignacion.becario.usuario.email,
    centroEstudios: asignacion.becario.centroEstudios
      ? { nombre: asignacion.becario.centroEstudios }
      : null,
    tipoFormacion: asignacion.becario.tipoFormacion,
    porcentajeAsignacion: 0,
  }));
};

export const actualizarBecariosDeTutorAcademico = async (
  tutorId: number,
  becarioIds: number[],
) => {
  const tutor = await prisma.usuario.findUnique({
    where: { idUsuario: tutorId },
    select: { rol: true },
  });

  if (!tutor) {
    throw createHttpError('Usuario no encontrado', 404);
  }

  if (!isTutorAcademicoRol(tutor.rol)) {
    throw createHttpError('El usuario no es un Tutor académico', 400);
  }

  if (becarioIds.length > 0) {
    const becariosEncontrados = await prisma.becario.findMany({
      where: { idBecario: { in: becarioIds } },
      select: { idBecario: true },
    });
    const idsEncontrados = new Set(becariosEncontrados.map(b => b.idBecario));
    for (const id of becarioIds) {
      if (!idsEncontrados.has(id)) {
        throw createHttpError(`BECARIO_NO_ENCONTRADO:${id}`, 400);
      }
    }
  }

  await prisma.$transaction(async tx => {
    await tx.tutorBecario.deleteMany({
      where: {
        idTutor: tutorId,
        tipoTutor: { in: [...TIPOS_TUTORIA_ACADEMICA] },
      },
    });

    if (becarioIds.length > 0) {
      await tx.tutorBecario.createMany({
        data: becarioIds.map(idBecario => ({
          idTutor: tutorId,
          idBecario,
          tipoTutor: TIPO_TUTORIA.ACADEMICO,
          activo: true,
        })),
      });
    }
  });

  logger.info('Becarios actualizados para Tutor académico', {
    tutorId,
    cantidadBecarios: becarioIds.length,
  });

  return { success: true, cantidadBecarios: becarioIds.length };
};

export const getBecariosDeTutorEmpresa = async (tutorId: number) => {
  const tutor = await prisma.usuario.findUnique({
    where: { idUsuario: tutorId },
    select: { rol: true },
  });

  if (!tutor) {
    throw createHttpError('Usuario no encontrado', 404);
  }

  if (!isTutorEmpresaRol(tutor.rol)) {
    throw createHttpError('El usuario no es un Tutor de empresa', 400);
  }

  const asignaciones = await prisma.tutorBecario.findMany({
    where: {
      idTutor: tutorId,
      tipoTutor: { in: [...TIPOS_TUTORIA_EMPRESA] },
      activo: true,
    },
    include: {
      becario: {
        include: {
          usuario: {
            select: {
              nombre: true,
              apellidos: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return asignaciones.map(asignacion => ({
    id: asignacion.idBecario.toString(),
    nombre: asignacion.becario.usuario.nombre,
    apellidos: asignacion.becario.usuario.apellidos,
    emailPersonal: asignacion.becario.emailPersonal || asignacion.becario.usuario.email,
    centroEstudios: asignacion.becario.centroEstudios
      ? { nombre: asignacion.becario.centroEstudios }
      : null,
    tipoFormacion: asignacion.becario.tipoFormacion,
    tipoTutoria: asignacion.tipoTutor as TipoTutoriaEmpresa,
  }));
};

export const actualizarBecariosDeTutorEmpresa = async (
  tutorId: number,
  becarios: BecarioEmpresaAsignacion[],
) => {
  const tutor = await prisma.usuario.findUnique({
    where: { idUsuario: tutorId },
    select: { rol: true },
  });

  if (!tutor) {
    throw createHttpError('Usuario no encontrado', 404);
  }

  if (!isTutorEmpresaRol(tutor.rol)) {
    throw createHttpError('El usuario no es un Tutor de empresa', 400);
  }

  if (becarios.length > 0) {
    const ids = becarios.map(b => b.becarioId);
    const encontrados = await prisma.becario.findMany({
      where: { idBecario: { in: ids } },
      select: { idBecario: true },
    });
    const idsEncontrados = new Set(encontrados.map(b => b.idBecario));
    for (const id of ids) {
      if (!idsEncontrados.has(id)) {
        throw createHttpError(`BECARIO_NO_ENCONTRADO:${id}`, 400);
      }
    }
  }

  await prisma.$transaction(async tx => {
    await tx.tutorBecario.deleteMany({
      where: {
        idTutor: tutorId,
        tipoTutor: { in: [...TIPOS_TUTORIA_EMPRESA] },
      },
    });

    if (becarios.length > 0) {
      await tx.tutorBecario.createMany({
        data: becarios.map(b => ({
          idTutor: tutorId,
          idBecario: b.becarioId,
          tipoTutor: b.tipoTutoria,
          activo: true,
        })),
      });
    }
  });

  logger.info('Becarios actualizados para Tutor de empresa', {
    tutorId,
    cantidadBecarios: becarios.length,
  });

  return { success: true, cantidadBecarios: becarios.length };
};

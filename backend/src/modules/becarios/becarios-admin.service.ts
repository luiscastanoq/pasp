import type { Prisma } from '@prisma/client';
import logger from '../../config/logger';
import { prisma } from '../../database/prisma';
import { ROLES, TIPO_FORMACION, TipoTutoria } from '../../shared/constants/domain.constants';

type HttpError = Error & { statusCode?: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

export interface UpdateBecarioDetalleData {
  horasContrato?: number;
  ayudaEconomica?: number | null;
  equipoEnUso?: string | null;
  fechaInicioPracticas?: string;
  fechaFinPracticas?: string;
  tipoFormacion?: string;
  nombreFormacion?: string;
  centroEstudios?: string;
  telefonoPersonal?: string | null;
  emailPersonal?: string | null;
  linkedin?: string | null;
}

export interface TutorBecarioAsignacion {
  tutorId: number;
  tipoTutoria: TipoTutoria;
}

async function assertUsuarioBecario(idUsuario: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    select: { rol: true },
  });

  if (!usuario) {
    throw createHttpError('USUARIO_NO_ENCONTRADO', 404);
  }

  if (usuario.rol !== ROLES.BECARIO) {
    throw createHttpError('NO_ES_BECARIO', 400);
  }
}

export const getBecarioDetalle = async (idUsuario: number) => {
  await assertUsuarioBecario(idUsuario);

  const becario = await prisma.becario.findUnique({
    where: { idUsuario },
  });

  if (!becario) {
    throw createHttpError('PERFIL_BECARIO_NO_ENCONTRADO', 404);
  }

  const esUniversitaria = becario.tipoFormacion === TIPO_FORMACION.UNIVERSITARIA;
  const nombreFormacion = esUniversitaria
    ? (becario.nombreGradoUniversitario ?? '')
    : (becario.nombreFormacionProfesional ?? '');

  return {
    idBecario: becario.idBecario,
    horasContrato: becario.horasContrato,
    ayudaEconomica: becario.ayudaEconomica,
    equipoEnUso: becario.equipoEnUso ?? '',
    fechaInicioPracticas: becario.fechaInicioPracticas
      ? becario.fechaInicioPracticas.toISOString().split('T')[0]
      : '',
    fechaFinPracticas: becario.fechaFinPracticas
      ? becario.fechaFinPracticas.toISOString().split('T')[0]
      : '',
    tipoFormacion: becario.tipoFormacion ?? '',
    nombreFormacion,
    centroEstudios: becario.centroEstudios ?? '',
    telefonoPersonal: becario.telefonoPersonal ?? '',
    emailPersonal: becario.emailPersonal ?? '',
    linkedin: becario.linkedin ?? '',
  };
};

export const getTutoresDelBecario = async (idUsuario: number) => {
  await assertUsuarioBecario(idUsuario);

  const becario = await prisma.becario.findUnique({
    where: { idUsuario },
    select: { idBecario: true },
  });

  if (!becario) {
    return [];
  }

  const asignaciones = await prisma.tutorBecario.findMany({
    where: {
      idBecario: becario.idBecario,
      activo: true,
    },
    include: {
      tutor: {
        select: {
          idUsuario: true,
          nombre: true,
          apellidos: true,
          email: true,
          rol: true,
        },
      },
    },
  });

  return asignaciones.map(a => ({
    id: String(a.tutor.idUsuario),
    nombre: a.tutor.nombre,
    apellidos: a.tutor.apellidos,
    email: a.tutor.email,
    rol: a.tutor.rol,
    tipoTutoria: a.tipoTutor as TipoTutoria,
  }));
};

export const updateBecarioDetalle = async (
  idUsuario: number,
  data: UpdateBecarioDetalleData,
) => {
  await assertUsuarioBecario(idUsuario);

  const becarioExistente = await prisma.becario.findUnique({
    where: { idUsuario },
    select: { idBecario: true, tipoFormacion: true },
  });

  if (!becarioExistente) {
    throw createHttpError('PERFIL_BECARIO_NO_ENCONTRADO', 404);
  }

  const updateData: Prisma.BecarioUpdateInput = {};
  const camposModificados: string[] = [];

  if (data.horasContrato !== undefined) {
    updateData.horasContrato = data.horasContrato;
    camposModificados.push('horasContrato');
  }
  if (data.ayudaEconomica !== undefined) {
    updateData.ayudaEconomica = data.ayudaEconomica;
    camposModificados.push('ayudaEconomica');
  }
  if (data.equipoEnUso !== undefined) {
    updateData.equipoEnUso = data.equipoEnUso?.trim() || null;
    camposModificados.push('equipoEnUso');
  }
  if (data.fechaInicioPracticas !== undefined) {
    updateData.fechaInicioPracticas = new Date(data.fechaInicioPracticas);
    camposModificados.push('fechaInicioPracticas');
  }
  if (data.fechaFinPracticas !== undefined) {
    updateData.fechaFinPracticas = new Date(data.fechaFinPracticas);
    camposModificados.push('fechaFinPracticas');
  }
  if (data.centroEstudios !== undefined) {
    updateData.centroEstudios = data.centroEstudios.trim();
    camposModificados.push('centroEstudios');
  }
  if (data.telefonoPersonal !== undefined) {
    updateData.telefonoPersonal = data.telefonoPersonal?.trim() || null;
    camposModificados.push('telefonoPersonal');
  }
  if (data.emailPersonal !== undefined) {
    updateData.emailPersonal = data.emailPersonal?.trim() || null;
    camposModificados.push('emailPersonal');
  }
  if (data.linkedin !== undefined) {
    updateData.linkedin = data.linkedin?.trim() || null;
    camposModificados.push('linkedin');
  }

  const tipoFormacionFinal = data.tipoFormacion ?? becarioExistente.tipoFormacion ?? '';
  if (data.tipoFormacion !== undefined) {
    updateData.tipoFormacion = data.tipoFormacion;
    camposModificados.push('tipoFormacion');
  }
  if (data.nombreFormacion !== undefined) {
    const esUniversitaria = tipoFormacionFinal === TIPO_FORMACION.UNIVERSITARIA;
    if (esUniversitaria) {
      updateData.nombreGradoUniversitario = data.nombreFormacion.trim();
      updateData.nombreFormacionProfesional = null;
    } else {
      updateData.nombreFormacionProfesional = data.nombreFormacion.trim();
      updateData.nombreGradoUniversitario = null;
    }
    camposModificados.push('nombreFormacion');
  }

  const becarioActualizado = await prisma.becario.update({
    where: { idUsuario },
    data: updateData,
  });

  logger.info('Perfil de becario actualizado', {
    idUsuario,
    idBecario: becarioExistente.idBecario,
    camposModificados,
  });

  const esUniversitariaRespuesta = (becarioActualizado.tipoFormacion ?? '') === TIPO_FORMACION.UNIVERSITARIA;
  const nombreFormacionRespuesta = esUniversitariaRespuesta
    ? (becarioActualizado.nombreGradoUniversitario ?? '')
    : (becarioActualizado.nombreFormacionProfesional ?? '');

  return {
    idBecario: becarioActualizado.idBecario,
    horasContrato: becarioActualizado.horasContrato,
    ayudaEconomica: becarioActualizado.ayudaEconomica,
    equipoEnUso: becarioActualizado.equipoEnUso ?? '',
    fechaInicioPracticas: becarioActualizado.fechaInicioPracticas
      ? becarioActualizado.fechaInicioPracticas.toISOString().split('T')[0]
      : '',
    fechaFinPracticas: becarioActualizado.fechaFinPracticas
      ? becarioActualizado.fechaFinPracticas.toISOString().split('T')[0]
      : '',
    tipoFormacion: becarioActualizado.tipoFormacion ?? '',
    nombreFormacion: nombreFormacionRespuesta,
    centroEstudios: becarioActualizado.centroEstudios ?? '',
    telefonoPersonal: becarioActualizado.telefonoPersonal ?? '',
    emailPersonal: becarioActualizado.emailPersonal ?? '',
    linkedin: becarioActualizado.linkedin ?? '',
  };
};

export const actualizarTutoresDelBecario = async (
  idUsuario: number,
  tutores: TutorBecarioAsignacion[],
) => {
  await assertUsuarioBecario(idUsuario);

  const becario = await prisma.becario.findUnique({
    where: { idUsuario },
    select: { idBecario: true },
  });

  if (!becario) {
    throw createHttpError('PERFIL_BECARIO_NO_ENCONTRADO', 404);
  }

  if (tutores.length > 0) {
    const tutorIds = tutores.map(t => t.tutorId);
    const encontrados = await prisma.usuario.findMany({
      where: { idUsuario: { in: tutorIds } },
      select: { idUsuario: true },
    });
    const idsEncontrados = new Set(encontrados.map(u => u.idUsuario));
    const idsInvalidos = tutorIds.filter(id => !idsEncontrados.has(id));
    if (idsInvalidos.length > 0) {
      throw createHttpError(`TUTOR_NO_ENCONTRADO:${idsInvalidos.join(',')}`, 400);
    }
  }

  await prisma.$transaction(async tx => {
    await tx.tutorBecario.deleteMany({
      where: { idBecario: becario.idBecario },
    });

    if (tutores.length > 0) {
      await tx.tutorBecario.createMany({
        data: tutores.map(t => ({
          idTutor: t.tutorId,
          idBecario: becario.idBecario,
          tipoTutor: t.tipoTutoria,
          activo: true,
        })),
      });
    }
  });

  logger.info('Tutores actualizados para Becario', {
    idUsuario,
    idBecario: becario.idBecario,
    cantidadTutores: tutores.length,
  });

  return { success: true, cantidadTutores: tutores.length };
};

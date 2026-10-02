import { prisma } from '../database/prisma';
import { verificarAsignacionTutorBecario } from './tutor.service';

async function exigirAsignacionTutor(
  idBecario: number,
  idTutor: number,
): Promise<void> {
  const estaAsignado = await verificarAsignacionTutorBecario(idBecario, idTutor);

  if (!estaAsignado) {
    throw new Error('No tienes permisos para gestionar evaluaciones de este becario');
  }
}

export interface CreateEvaluacionData {
  idBecario: number;
  idTutorEvaluador: number;
  titulo: string;
  descripcion: string;
  puntuacionPuntualidad: number;
  puntuacionCalidad: number;
  puntuacionActitud: number;
  puntuacionAutonomia: number;
  puntuacionComunicacion: number;
}

export const createEvaluacion = async (data: CreateEvaluacionData) => {
  const becario = await prisma.becario.findUnique({ where: { idBecario: data.idBecario } });
  if (!becario) throw new Error('Becario no encontrado');

  const tutor = await prisma.usuario.findUnique({ where: { idUsuario: data.idTutorEvaluador } });
  if (!tutor) throw new Error('Tutor no encontrado');

  await exigirAsignacionTutor(data.idBecario, data.idTutorEvaluador);

  const puntuaciones = [
    data.puntuacionPuntualidad,
    data.puntuacionCalidad,
    data.puntuacionActitud,
    data.puntuacionAutonomia,
    data.puntuacionComunicacion,
  ];
  for (const p of puntuaciones) {
    if (!Number.isInteger(p) || p < 1 || p > 5) {
      throw new Error('Las puntuaciones deben ser numeros enteros entre 1 y 5');
    }
  }

  const puntuacionMedia = puntuaciones.reduce((sum, p) => sum + p, 0) / puntuaciones.length;

  const evaluacion = await prisma.evaluacion.create({
    data: {
      idBecario: data.idBecario,
      idTutorEvaluador: data.idTutorEvaluador,
      titulo: data.titulo.trim(),
      comentarios: data.descripcion.trim(),
      puntuacionPuntualidad: data.puntuacionPuntualidad,
      puntuacionCalidad: data.puntuacionCalidad,
      puntuacionActitud: data.puntuacionActitud,
      puntuacionAutonomia: data.puntuacionAutonomia,
      puntuacionComunicacion: data.puntuacionComunicacion,
      puntuacionMedia,
    },
    include: {
      tutorEvaluador: {
        select: { idUsuario: true, nombre: true, apellidos: true, rol: true },
      },
    },
  });

  return evaluacion;
};

// ============================================
// ELIMINACIÓN DE EVALUACIONES - HU-16
// ============================================

export const deleteEvaluacion = async (
  idEvaluacion: number,
  idBecario: number,
  idTutor: number,
) => {
  const evaluacion = await prisma.evaluacion.findUnique({
    where: { idEvaluacion },
  });
  if (!evaluacion) throw new Error('Evaluación no encontrada');
  if (evaluacion.idBecario !== idBecario) throw new Error('Evaluación no encontrada');

  await exigirAsignacionTutor(idBecario, idTutor);

  await prisma.evaluacion.delete({ where: { idEvaluacion } });
};

// ============================================
// LECTURA DE EVALUACIONES - HU-14
// ============================================

export const getEvaluacionesByBecario = async (
  idBecario: number,
  idTutor?: number,
) => {
  const becario = await prisma.becario.findUnique({ where: { idBecario } });
  if (!becario) throw new Error('Becario no encontrado');

  if (idTutor !== undefined) {
    await exigirAsignacionTutor(idBecario, idTutor);
  }

  const evaluaciones = await prisma.evaluacion.findMany({
    where: { idBecario },
    orderBy: { fechaEvaluacion: 'desc' },
    include: {
      tutorEvaluador: {
        select: { idUsuario: true, nombre: true, apellidos: true, rol: true },
      },
    },
  });

  return evaluaciones;
};

import type { Prisma } from '@prisma/client';
import logger from '../../config/logger';
import { prisma } from '../../database/prisma';
import { createErrorWithCause } from '../../shared/errors';
import { ESTADO_TAREA, EstadoTarea } from '../../shared/constants/domain.constants';
import { verificarAsignacionTutorBecario } from '../../services/tutor.service';

export interface CreateTareaData {
  idBecario: number;
  idTutorAsignador: number;
  nombreTarea: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFinEstimada?: Date;
}

export interface UpdateTareaData {
  nombreTarea?: string;
  descripcion?: string;
  estado?: EstadoTarea;
  fechaFinEstimada?: Date;
  fechaCompletada?: Date;
  idUsuarioModificador?: number;
}

async function exigirAsignacionTutor(
  idBecario: number,
  idTutor: number,
): Promise<void> {
  const estaAsignado = await verificarAsignacionTutorBecario(idBecario, idTutor);

  if (!estaAsignado) {
    throw new Error('No tienes permisos para gestionar tareas de este becario');
  }
}

export const getTareasByBecarioId = async (
  idBecario: number,
  idTutor?: number,
) => {
  try {
    const becarioExists = await prisma.becario.findUnique({
      where: { idBecario },
    });

    if (!becarioExists) {
      throw new Error('Becario no encontrado');
    }

    if (idTutor !== undefined) {
      await exigirAsignacionTutor(idBecario, idTutor);
    }

    const tareas = await prisma.tarea.findMany({
      where: { idBecario },
      include: {
        tutorAsignador: {
          select: {
            idUsuario: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });

    return tareas.map((tarea) => ({
      idTarea: tarea.idTarea,
      nombreTarea: tarea.nombreTarea,
      descripcion: tarea.descripcion,
      estado: tarea.estado,
      fechaInicio: tarea.fechaInicio.toISOString().split('T')[0],
      fechaFinEstimada: tarea.fechaFinEstimada
        ? tarea.fechaFinEstimada.toISOString().split('T')[0]
        : null,
      fechaCompletada: tarea.fechaCompletada
        ? tarea.fechaCompletada.toISOString().split('T')[0]
        : null,
      tutorAsignador: {
        idUsuario: tarea.tutorAsignador.idUsuario,
        nombre: tarea.tutorAsignador.nombre,
        apellidos: tarea.tutorAsignador.apellidos,
        email: tarea.tutorAsignador.email,
      },
      createdAt: tarea.createdAt,
      updatedAt: tarea.updatedAt,
    }));
  } catch (error) {
    logger.error('Error al obtener tareas del becario', { error });
    if (
      error instanceof Error &&
      (error.message === 'Becario no encontrado' ||
        error.message.includes('permisos'))
    ) {
      throw error;
    }
    throw createErrorWithCause('Error al consultar las tareas del becario', error);
  }
};

export const createTarea = async (data: CreateTareaData) => {
  try {
    const {
      idBecario,
      idTutorAsignador,
      nombreTarea,
      descripcion,
      fechaInicio,
      fechaFinEstimada,
    } = data;

    if (!nombreTarea || nombreTarea.trim().length < 3) {
      throw new Error('El nombre de la tarea debe tener al menos 3 caracteres');
    }

    const becarioExists = await prisma.becario.findUnique({
      where: { idBecario },
    });

    if (!becarioExists) {
      throw new Error('Becario no encontrado');
    }

    const tutorExists = await prisma.usuario.findUnique({
      where: { idUsuario: idTutorAsignador },
    });

    if (!tutorExists) {
      throw new Error('Tutor no encontrado');
    }

    await exigirAsignacionTutor(idBecario, idTutorAsignador);

    if (fechaFinEstimada && fechaFinEstimada < fechaInicio) {
      throw new Error('La fecha fin estimada debe ser posterior a la fecha de inicio');
    }

    const nuevaTarea = await prisma.tarea.create({
      data: {
        idBecario,
        idTutorAsignador,
        nombreTarea: nombreTarea.trim(),
        descripcion: descripcion?.trim() || null,
        estado: ESTADO_TAREA.PENDIENTE,
        fechaInicio,
        fechaFinEstimada: fechaFinEstimada || null,
        fechaCompletada: null,
      },
      include: {
        tutorAsignador: {
          select: {
            idUsuario: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
        becario: {
          select: {
            idBecario: true,
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

    return {
      idTarea: nuevaTarea.idTarea,
      nombreTarea: nuevaTarea.nombreTarea,
      descripcion: nuevaTarea.descripcion,
      estado: nuevaTarea.estado,
      fechaInicio: nuevaTarea.fechaInicio.toISOString().split('T')[0],
      fechaFinEstimada: nuevaTarea.fechaFinEstimada
        ? nuevaTarea.fechaFinEstimada.toISOString().split('T')[0]
        : null,
      fechaCompletada: null,
      tutorAsignador: nuevaTarea.tutorAsignador,
      becario: {
        idBecario: nuevaTarea.becario.idBecario,
        nombre: nuevaTarea.becario.usuario.nombre,
        apellidos: nuevaTarea.becario.usuario.apellidos,
        email: nuevaTarea.becario.usuario.email,
      },
      createdAt: nuevaTarea.createdAt,
    };
  } catch (error) {
    logger.error('Error al crear tarea', { error });
    if (
      error instanceof Error &&
      (error.message === 'Becario no encontrado' ||
        error.message === 'Tutor no encontrado' ||
        error.message.includes('permisos') ||
        error.message.includes('nombre de la tarea') ||
        error.message.includes('fecha'))
    ) {
      throw error;
    }
    throw createErrorWithCause('Error al crear la tarea', error);
  }
};

export const deleteTarea = async (idTarea: number, idTutor: number) => {
  try {
    const tareaExists = await prisma.tarea.findUnique({
      where: { idTarea },
    });

    if (!tareaExists) {
      throw new Error('Tarea no encontrada');
    }

    await exigirAsignacionTutor(tareaExists.idBecario, idTutor);

    await prisma.tarea.delete({
      where: { idTarea },
    });

    logger.info('Tarea eliminada exitosamente', { idTarea });
  } catch (error) {
    logger.error('Error al eliminar tarea', { error });
    if (
      error instanceof Error &&
      (error.message === 'Tarea no encontrada' ||
        error.message.includes('permisos'))
    ) {
      throw error;
    }
    throw createErrorWithCause('Error al eliminar la tarea', error);
  }
};

export const updateTarea = async (
  idTarea: number,
  data: UpdateTareaData,
  idTutor: number,
) => {
  try {
    const tareaExists = await prisma.tarea.findUnique({
      where: { idTarea },
    });

    if (!tareaExists) {
      throw new Error('Tarea no encontrada');
    }

    await exigirAsignacionTutor(tareaExists.idBecario, idTutor);

    if (data.nombreTarea && data.nombreTarea.trim().length < 3) {
      throw new Error('El nombre de la tarea debe tener al menos 3 caracteres');
    }

    const dataUpdate: Prisma.TareaUpdateInput = {};
    if (data.nombreTarea) {
      dataUpdate.nombreTarea = data.nombreTarea.trim();
    }
    if (data.descripcion !== undefined) {
      dataUpdate.descripcion = data.descripcion?.trim() || null;
    }
    if (data.estado) {
      dataUpdate.estado = data.estado;
      dataUpdate.fechaCompletada = data.estado === ESTADO_TAREA.COMPLETADA ? new Date() : null;
    }
    if (data.fechaFinEstimada !== undefined) {
      dataUpdate.fechaFinEstimada = data.fechaFinEstimada;
    }
    if (data.fechaCompletada !== undefined) {
      dataUpdate.fechaCompletada = data.fechaCompletada;
    }

    const estadoAnterior = tareaExists.estado;
    const tareaActualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.tarea.update({
        where: { idTarea },
        data: dataUpdate,
      });

      if (data.estado && data.estado !== estadoAnterior) {
        await tx.tareaHistorial.create({
          data: {
            idTarea,
            estadoAnterior,
            estadoNuevo: data.estado,
            idUsuarioModificador:
              data.idUsuarioModificador ?? tareaExists.idTutorAsignador,
          },
        });
      }

      return updated;
    });

    return {
      idTarea: tareaActualizada.idTarea,
      nombreTarea: tareaActualizada.nombreTarea,
      descripcion: tareaActualizada.descripcion,
      estado: tareaActualizada.estado,
      fechaInicio: tareaActualizada.fechaInicio.toISOString().split('T')[0],
      fechaFinEstimada: tareaActualizada.fechaFinEstimada
        ? tareaActualizada.fechaFinEstimada.toISOString().split('T')[0]
        : null,
      fechaCompletada: tareaActualizada.fechaCompletada
        ? tareaActualizada.fechaCompletada.toISOString().split('T')[0]
        : null,
      idTutorAsignador: tareaActualizada.idTutorAsignador,
      updatedAt: tareaActualizada.updatedAt,
    };
  } catch (error) {
    logger.error('Error al actualizar tarea', { error });
    if (error instanceof Error && error.message === 'Tarea no encontrada') {
      throw error;
    }
    if (error instanceof Error && error.message.includes('nombre de la tarea')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      throw error;
    }
    throw createErrorWithCause('Error al actualizar la tarea', error);
  }
};

export const getTareaHistorial = async (
  idTarea: number,
  idTutor: number,
) => {
  try {
    const tarea = await prisma.tarea.findUnique({
      where: { idTarea },
      include: { becario: { select: { idBecario: true } } },
    });

    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const estaAsignado = await verificarAsignacionTutorBecario(
      tarea.becario.idBecario,
      idTutor,
    );

    if (!estaAsignado) {
      throw new Error('No tienes permisos para ver el historial de esta tarea');
    }

    const historial = await prisma.tareaHistorial.findMany({
      where: { idTarea },
      include: {
        usuarioModificador: {
          select: { idUsuario: true, nombre: true, apellidos: true, rol: true },
        },
      },
      orderBy: { fechaCambio: 'desc' },
    });

    return historial.map((entry) => ({
      idHistorial: entry.idHistorial,
      estadoAnterior: entry.estadoAnterior,
      estadoNuevo: entry.estadoNuevo,
      fechaCambio: entry.fechaCambio,
      modificadoPor: {
        idUsuario: entry.usuarioModificador.idUsuario,
        nombre: entry.usuarioModificador.nombre,
        apellidos: entry.usuarioModificador.apellidos,
        rol: entry.usuarioModificador.rol,
      },
    }));
  } catch (error) {
    logger.error('Error al obtener historial de tarea', { idTarea, error });
    if (error instanceof Error) throw error;
    throw createErrorWithCause('Error al obtener el historial de la tarea', error);
  }
};

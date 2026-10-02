/**
 * Servicio de gestion de becarios
 */

import { prisma } from '../database/prisma';
import logger from '../config/logger';
import { createErrorWithCause } from '../shared/errors';
import { ESTADO_TAREA, ROLES, EstadoTarea } from '../shared/constants/domain.constants';

export interface UpdateBecarioProfileData {
  telefono_personal?: string | null;
  email_personal?: string | null;
  linkedin?: string | null;
}

export const getBecarioProfileByUserId = async (idUsuario: number) => {
  try {
    const becario = await prisma.becario.findUnique({
      where: { idUsuario },
      include: {
        usuario: {
          select: {
            idUsuario: true,
            email: true,
            nombre: true,
            apellidos: true,
            practica: true,
            cliente: true,
            rol: true,
            activo: true,
            createdAt: true,
          },
        },
        tutores: {
          where: { activo: true },
          include: {
            tutor: {
              select: {
                idUsuario: true,
                nombre: true,
                apellidos: true,
                email: true,
              },
            },
          },
          orderBy: { tipoTutor: 'asc' },
        },
      },
    });

    if (!becario) {
      logger.warn(`Becario no encontrado para usuario ID: ${idUsuario}`);
      return null;
    }

    return {
      idBecario: becario.idBecario,
      usuario: {
        idUsuario: becario.usuario.idUsuario,
        email: becario.usuario.email,
        nombre: becario.usuario.nombre,
        apellidos: becario.usuario.apellidos,
        rol: becario.usuario.rol,
        activo: becario.usuario.activo,
        createdAt: becario.usuario.createdAt,
      },
      corporativo: {
        practica: becario.usuario.practica,
        cliente: becario.usuario.cliente,
      },
      academico: {
        tipoFormacion: becario.tipoFormacion,
        nombreGradoUniversitario: becario.nombreGradoUniversitario,
        nombreFormacionProfesional: becario.nombreFormacionProfesional,
        centroEstudios: becario.centroEstudios,
      },
      contacto: {
        telefonoPersonal: becario.telefonoPersonal,
        emailPersonal: becario.emailPersonal,
        linkedin: becario.linkedin,
      },
      practicas: {
        fechaInicioPracticas: becario.fechaInicioPracticas,
        fechaFinPracticas: becario.fechaFinPracticas,
        horasContrato: becario.horasContrato,
        ayudaEconomica: becario.ayudaEconomica,
        equipoEnUso: becario.equipoEnUso,
      },
      tutores: becario.tutores.map((relacion) => ({
        idTutor: relacion.tutor.idUsuario,
        nombre: relacion.tutor.nombre,
        apellidos: relacion.tutor.apellidos,
        email: relacion.tutor.email,
        tipoTutor: relacion.tipoTutor,
        fechaAsignacion: relacion.fechaAsignacion,
      })),
    };
  } catch (error) {
    logger.error('Error al obtener perfil del becario:', error);
    throw createErrorWithCause('Error al consultar el perfil del becario', error);
  }
};

export const updateBecarioProfile = async (
  idBecario: number,
  data: UpdateBecarioProfileData
) => {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.telefono_personal !== undefined) updateData['telefonoPersonal'] = data.telefono_personal;
    if (data.email_personal !== undefined) updateData['emailPersonal'] = data.email_personal;
    if (data.linkedin !== undefined) updateData['linkedin'] = data.linkedin;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No hay campos validos para actualizar');
    }

    const becarioActualizado = await prisma.becario.update({
      where: { idBecario },
      data: updateData,
      select: {
        idBecario: true,
        telefonoPersonal: true,
        emailPersonal: true,
        linkedin: true,
        updatedAt: true,
      },
    });

    logger.info(`Perfil del becario ${idBecario} actualizado`);
    return becarioActualizado;
  } catch (error) {
    logger.error(`Error al actualizar perfil del becario ${idBecario}:`, error);
    throw createErrorWithCause('Error al actualizar el perfil del becario', error);
  }
};

export const updateTareaEstado = async (
  idTarea: number,
  idUsuario: number,
  estado: EstadoTarea
) => {
  try {
    const tarea = await prisma.tarea.findUnique({
      where: { idTarea },
      include: { becario: { select: { idUsuario: true } } },
    });

    if (!tarea) throw new Error('Tarea no encontrada');
    if (tarea.becario.idUsuario !== idUsuario) throw new Error('No tienes permisos para modificar esta tarea');

    const estadoAnterior = tarea.estado;
    const fechaCompletada = estado === ESTADO_TAREA.COMPLETADA ? new Date() : null;

    const tareaActualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.tarea.update({
        where: { idTarea },
        data: { estado, fechaCompletada },
        include: {
          tutorAsignador: {
            select: { idUsuario: true, nombre: true, apellidos: true, email: true },
          },
        },
      });

      await tx.tareaHistorial.create({
        data: {
          idTarea,
          estadoAnterior,
          estadoNuevo: estado,
          idUsuarioModificador: idUsuario,
        },
      });

      return updated;
    });

    logger.info(`Tarea ${idTarea} actualizada a estado '${estado}' por usuario ${idUsuario}`);

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
      tutorAsignador: {
        idUsuario: tareaActualizada.tutorAsignador.idUsuario,
        nombre: tareaActualizada.tutorAsignador.nombre,
        apellidos: tareaActualizada.tutorAsignador.apellidos,
        email: tareaActualizada.tutorAsignador.email,
      },
      updatedAt: tareaActualizada.updatedAt,
    };
  } catch (error) {
    logger.error(`Error al actualizar estado de tarea ${idTarea}:`, error);
    if (error instanceof Error) throw error;
    throw createErrorWithCause('Error al actualizar el estado de la tarea', error);
  }
};

export const getTareaHistorial = async (
  idTarea: number,
  idUsuario: number,
  rol: string
) => {
  try {
    const tarea = await prisma.tarea.findUnique({
      where: { idTarea },
      include: { becario: { select: { idUsuario: true } } },
    });

    if (!tarea) throw new Error('Tarea no encontrada');
    if (rol === ROLES.BECARIO && tarea.becario.idUsuario !== idUsuario) {
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
    logger.error(`Error al obtener historial de tarea ${idTarea}:`, error);
    if (error instanceof Error) throw error;
    throw createErrorWithCause('Error al obtener el historial de la tarea', error);
  }
};

export const verifyBecarioOwnership = async (
  idBecario: number,
  idUsuario: number
): Promise<boolean> => {
  try {
    const becario = await prisma.becario.findFirst({ where: { idBecario, idUsuario } });
    return becario !== null;
  } catch (error) {
    logger.error('Error al verificar propiedad del becario:', error);
    return false;
  }
};

import type { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { createErrorWithCause } from '../shared/errors';
import {
  ESTADO_TAREA,
  TIPO_TUTORIA,
  TIPO_FORMACION,
  TIPOS_TUTORIA,
  TIPOS_TUTORIA_ACADEMICA,
  TIPOS_TUTORIA_EMPRESA,
  TIPOS_FORMACION_COMPATIBLES,
  TUTOR_ROLES,
  TipoTutoria,
  normalizeRolUsuario,
} from '../shared/constants/domain.constants';
import logger from '../config/logger';
import { usuariosService } from './usuarios.service';
import type { UpdateAdministradorData } from './usuarios.service';
import * as usuariosCreacionService from '../modules/usuarios';

export type CreateBecarioTutorData = Omit<
  usuariosCreacionService.CreateBecarioData,
  'tutoresAsignados'
> & {
  tutoresAsignados?: usuariosCreacionService.TutorAsignado[];
};

type BecarioTutorFilter = {
  tiposTutor?: readonly string[];
};

/**
 * Obtiene todos los becarios asignados a un tutor específico
 * ADAPTADO PARA SCHEMA V2.0:
 * - nombre, apellidos, practica, cliente ahora están en Usuario
 * - Tabla Proyectos fue eliminada
 * - departamento fue eliminado (reemplazado por cliente)
 *
 * @param tutorId - ID del usuario con rol de tutor
 * @returns Array de becarios con su información básica
 */
async function getBecariosAsignadosByTutorId(
  tutorId: number,
  options: BecarioTutorFilter = {}
) {
  try {
    // Buscar todas las relaciones activas del tutor con becarios
    const relaciones = await prisma.tutorBecario.findMany({
      where: {
        idTutor: tutorId,
        activo: true,
        ...(options.tiposTutor
          ? { tipoTutor: { in: [...options.tiposTutor] } }
          : {}),
      },
      include: {
        becario: {
          include: {
            usuario: {
              select: {
                idUsuario: true,
                email: true,
                nombre: true,
                apellidos: true,
                practica: true,
                cliente: true,
                activo: true,
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
                    rol: true,
                  },
                },
              },
              orderBy: { fechaAsignacion: 'asc' },
            },
          },
        },
      },
      orderBy: {
        fechaAsignacion: 'desc',
      },
    });

    const tareasPorEstado = relaciones.length
      ? await prisma.tarea.groupBy({
          by: ['idBecario', 'estado'],
          where: { idBecario: { in: relaciones.map(rel => rel.idBecario) } },
          _count: { _all: true },
        })
      : [];
    const contadores = new Map<
      number,
      {
        tareasAsignadas: number;
        tareasPendientes: number;
        tareasEnProgreso: number;
        tareasCompletadas: number;
      }
    >();
    for (const grupo of tareasPorEstado) {
      const conteo = contadores.get(grupo.idBecario) ?? {
        tareasAsignadas: 0,
        tareasPendientes: 0,
        tareasEnProgreso: 0,
        tareasCompletadas: 0,
      };
      conteo.tareasAsignadas += grupo._count._all;
      if (grupo.estado === ESTADO_TAREA.PENDIENTE)
        conteo.tareasPendientes += grupo._count._all;
      if (grupo.estado === ESTADO_TAREA.EN_PROGRESO)
        conteo.tareasEnProgreso += grupo._count._all;
      if (grupo.estado === ESTADO_TAREA.COMPLETADA)
        conteo.tareasCompletadas += grupo._count._all;
      contadores.set(grupo.idBecario, conteo);
    }

    const becariosPromises = relaciones.map(async rel => {
      // Obtener el último fichaje del becario (solo necesitamos la fecha)
      const ultimoFichaje = await prisma.fichaje.findFirst({
        where: { idBecario: rel.becario.idBecario },
        orderBy: { fecha: 'desc' },
        select: { fecha: true },
      });

      return {
        idBecario: rel.becario.idBecario,
        idUsuario: rel.becario.usuario.idUsuario,
        nombre: rel.becario.usuario.nombre,
        apellidos: rel.becario.usuario.apellidos,
        email: rel.becario.usuario.email,
        activo: rel.becario.usuario.activo,
        practica: rel.becario.usuario.practica,
        cliente: rel.becario.usuario.cliente,
        tipoTutor: rel.tipoTutor,
        fechaInicioPracticas: rel.becario.fechaInicioPracticas,
        fechaFinPracticas: rel.becario.fechaFinPracticas,
        horasContrato: Number(rel.becario.horasContrato), // Convertir Decimal a number - Horas pactadas en contrato
        ayudaEconomica: rel.becario.ayudaEconomica,
        equipoEnUso: rel.becario.equipoEnUso,
        ...(contadores.get(rel.becario.idBecario) ?? {
          tareasAsignadas: 0,
          tareasPendientes: 0,
          tareasEnProgreso: 0,
          tareasCompletadas: 0,
        }),
        // Fecha del último fichaje
        ultimoFichaje: ultimoFichaje?.fecha || null,
        // Información académica (nueva estructura v2.0)
        tipoFormacion: rel.becario.tipoFormacion,
        nombreGradoUniversitario: rel.becario.nombreGradoUniversitario,
        nombreFormacionProfesional: rel.becario.nombreFormacionProfesional,
        centroEstudios: rel.becario.centroEstudios,
        // Información de contacto adicional
        telefonoPersonal: rel.becario.telefonoPersonal,
        emailPersonal: rel.becario.emailPersonal,
        linkedin: rel.becario.linkedin,
        tutores: rel.becario.tutores.map(tutoria => ({
          idTutor: tutoria.idTutor,
          nombre: tutoria.tutor.nombre,
          apellidos: tutoria.tutor.apellidos,
          email: tutoria.tutor.email,
          rol: tutoria.tutor.rol,
          tipoTutor: tutoria.tipoTutor,
          fechaAsignacion: tutoria.fechaAsignacion,
        })),
      };
    });

    // Esperar a que todas las promesas se resuelvan
    const becarios = await Promise.all(becariosPromises);

    return becarios;
  } catch (error) {
    logger.error('Error al obtener becarios del tutor', { error });
    throw createErrorWithCause(
      'Error al consultar los becarios asignados',
      error
    );
  }
}

export const getBecariosByTutorId = async (tutorId: number) => {
  return getBecariosAsignadosByTutorId(tutorId, {
    tiposTutor: TIPOS_TUTORIA_EMPRESA,
  });
};

export const getBecariosAcademicosByTutorId = async (tutorId: number) => {
  return getBecariosAsignadosByTutorId(tutorId, {
    tiposTutor: TIPOS_TUTORIA_ACADEMICA,
  });
};

export const createBecarioAsignadoATutor = async (
  tutorId: number,
  data: CreateBecarioTutorData
) => {
  try {
    const tutoriaTutorActual = data.tutoresAsignados?.find(
      tutor => tutor.tutorId === tutorId
    );
    const tipoTutoriaTutorActual =
      tutoriaTutorActual?.tipo ?? TIPO_TUTORIA.EMPRESA_PRINCIPAL;

    if (!TIPOS_TUTORIA_EMPRESA.some(tipo => tipo === tipoTutoriaTutorActual)) {
      throw new Error(
        'Tipo de tutoría de empresa inválido para el tutor creador'
      );
    }

    const tutoresExtra = new Map<
      number,
      usuariosCreacionService.TutorAsignado
    >();
    for (const tutor of data.tutoresAsignados ?? []) {
      if (tutor.tutorId !== tutorId) {
        tutoresExtra.set(tutor.tutorId, tutor);
      }
    }

    const tutoresAsignados = [
      {
        tutorId,
        tipo: tipoTutoriaTutorActual,
      },
      ...Array.from(tutoresExtra.values()),
    ];

    const usuario = await usuariosCreacionService.createBecario({
      ...data,
      tutoresAsignados,
    });

    logger.info('Becario creado y asignado por tutor', {
      tutorId,
      nuevoUsuarioId: usuario.idUsuario,
      email: usuario.email,
    });

    return usuario;
  } catch (error) {
    logger.error('Error al crear becario desde tutor', { error });
    if (error instanceof Error) {
      throw error;
    }
    throw createErrorWithCause('Error al crear el becario', error);
  }
};

export const toggleEstadoBecarioAsignado = async (
  idBecario: number,
  idTutor: number
) => {
  try {
    const becario = await prisma.becario.findUnique({
      where: { idBecario },
      select: { idUsuario: true },
    });

    if (!becario) {
      throw new Error('Becario no encontrado');
    }

    const estaAsignado = await verificarAsignacionTutorBecario(
      idBecario,
      idTutor
    );
    if (!estaAsignado) {
      throw new Error('No tienes permisos para gestionar este becario');
    }

    const usuarioActualizado = await usuariosService.toggleActivoUsuario(
      becario.idUsuario
    );

    logger.info('Estado de becario alternado por tutor', {
      idBecario,
      idTutor,
      idUsuario: becario.idUsuario,
      activo: usuarioActualizado.activo,
    });

    return usuarioActualizado;
  } catch (error) {
    logger.error('Error al alternar estado del becario desde tutor', { error });
    if (error instanceof Error) {
      throw error;
    }
    throw createErrorWithCause('Error al cambiar el estado del becario', error);
  }
};

export const deleteBecarioAsignado = async (
  idBecario: number,
  idTutor: number
) => {
  try {
    const becario = await prisma.becario.findUnique({
      where: { idBecario },
      select: { idUsuario: true },
    });

    if (!becario) {
      throw new Error('Becario no encontrado');
    }

    const estaAsignado = await verificarAsignacionTutorBecario(
      idBecario,
      idTutor
    );
    if (!estaAsignado) {
      throw new Error('No tienes permisos para gestionar este becario');
    }

    await usuariosService.deleteUsuario(becario.idUsuario, idTutor);

    logger.info('Becario eliminado por tutor', {
      idBecario,
      idTutor,
      idUsuario: becario.idUsuario,
    });
  } catch (error) {
    logger.error('Error al eliminar becario desde tutor', { error });
    if (error instanceof Error) {
      throw error;
    }
    throw createErrorWithCause('Error al eliminar el becario', error);
  }
};

// ============================================
// ACTUALIZACIÓN DE INFORMACIÓN DEL BECARIO POR TUTOR
// ============================================

/**
 * Interfaz para actualizar información corporativa y académica del becario
 * El tutor puede actualizar estos campos, pero NO los datos de contacto
 */
export interface UpdateBecarioCorporativoAcademicoData {
  // Información corporativa (tabla Usuario)
  practica?: string | null;
  cliente?: string | null;
  // Información de prácticas (tabla Becarios)
  horasContrato?: number;
  ayudaEconomica?: number | null;
  equipoEnUso?: string | null;
  fechaInicioPracticas?: Date;
  fechaFinPracticas?: Date | null;
  // Información académica (tabla Becarios)
  tipoFormacion?: string | null;
  nombreGradoUniversitario?: string | null;
  nombreFormacionProfesional?: string | null;
  centroEstudios?: string | null;
  telefonoPersonal?: string | null;
  emailPersonal?: string | null;
  linkedin?: string | null;
}

export interface TutorBecarioAsignacion {
  tutorId: number;
  tipoTutoria: TipoTutoria;
}

/**
 * Verifica que un becario está asignado a un tutor específico
 *
 * @param idBecario - ID del becario
 * @param idTutor - ID del tutor (usuario)
 * @returns true si el becario está asignado al tutor
 */
export const verificarAsignacionTutorBecario = async (
  idBecario: number,
  idTutor: number
): Promise<boolean> => {
  try {
    const relacion = await prisma.tutorBecario.findFirst({
      where: {
        idBecario,
        idTutor,
        activo: true,
      },
    });

    return relacion !== null;
  } catch (error) {
    logger.error('Error al verificar asignación tutor-becario', { error });
    return false;
  }
};

function toDateInput(value: Date | null): string {
  return value ? value.toISOString().split('T')[0] : '';
}

function formatBecarioDetalle(becario: {
  idBecario: number;
  horasContrato: Prisma.Decimal | number;
  ayudaEconomica: number | null;
  equipoEnUso: string | null;
  fechaInicioPracticas: Date | null;
  fechaFinPracticas: Date | null;
  tipoFormacion: string | null;
  nombreGradoUniversitario: string | null;
  nombreFormacionProfesional: string | null;
  centroEstudios: string | null;
  telefonoPersonal: string | null;
  emailPersonal: string | null;
  linkedin: string | null;
}) {
  const esUniversitaria =
    becario.tipoFormacion === TIPO_FORMACION.UNIVERSITARIA;

  return {
    idBecario: becario.idBecario,
    horasContrato: Number(becario.horasContrato),
    ayudaEconomica: becario.ayudaEconomica,
    equipoEnUso: becario.equipoEnUso ?? '',
    fechaInicioPracticas: toDateInput(becario.fechaInicioPracticas),
    fechaFinPracticas: toDateInput(becario.fechaFinPracticas),
    tipoFormacion: becario.tipoFormacion ?? '',
    nombreFormacion: esUniversitaria
      ? (becario.nombreGradoUniversitario ?? '')
      : (becario.nombreFormacionProfesional ?? ''),
    centroEstudios: becario.centroEstudios ?? '',
    telefonoPersonal: becario.telefonoPersonal ?? '',
    emailPersonal: becario.emailPersonal ?? '',
    linkedin: becario.linkedin ?? '',
  };
}

async function getAssignedBecario(idBecario: number, idTutor: number) {
  const becario = await prisma.becario.findUnique({
    where: { idBecario },
    include: {
      usuario: {
        select: {
          idUsuario: true,
          nombre: true,
          apellidos: true,
          email: true,
          rol: true,
          activo: true,
          primerAcceso: true,
          esSuperAdmin: true,
          practica: true,
          cliente: true,
        },
      },
    },
  });

  if (!becario) {
    throw new Error('Becario no encontrado');
  }

  const estaAsignado = await verificarAsignacionTutorBecario(
    idBecario,
    idTutor
  );
  if (!estaAsignado) {
    throw new Error('No tienes permisos para editar este becario');
  }

  return becario;
}

export const getBecarioEditableByTutor = async (
  idBecario: number,
  idTutor: number
) => {
  const becario = await getAssignedBecario(idBecario, idTutor);

  return {
    usuario: becario.usuario,
    becario: formatBecarioDetalle(becario),
    tutorActualId: idTutor,
  };
};

export const getTutoresDisponibles = async () => {
  return prisma.usuario
    .findMany({
      where: {
        activo: true,
        rol: { in: [...TUTOR_ROLES] },
      },
      select: {
        idUsuario: true,
        nombre: true,
        apellidos: true,
        email: true,
        rol: true,
      },
      orderBy: [{ apellidos: 'asc' }, { nombre: 'asc' }],
    })
    .then(tutores =>
      tutores.map(tutor => ({
        ...tutor,
        rol: normalizeRolUsuario(tutor.rol),
      }))
    );
};

export const getTutoresDelBecarioByTutor = async (
  idBecario: number,
  idTutor: number
) => {
  await getAssignedBecario(idBecario, idTutor);

  const asignaciones = await prisma.tutorBecario.findMany({
    where: { idBecario, activo: true },
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
    orderBy: { fechaAsignacion: 'asc' },
  });

  return asignaciones.map(asignacion => ({
    id: String(asignacion.tutor.idUsuario),
    nombre: asignacion.tutor.nombre,
    apellidos: asignacion.tutor.apellidos,
    email: asignacion.tutor.email,
    rol: normalizeRolUsuario(asignacion.tutor.rol),
    tipoTutoria: asignacion.tipoTutor as TipoTutoria,
  }));
};

export const updateBecarioUsuarioByTutor = async (
  idBecario: number,
  idTutor: number,
  data: UpdateAdministradorData
) => {
  const becario = await getAssignedBecario(idBecario, idTutor);
  return usuariosService.updateAdministrador(becario.idUsuario, data);
};

export const actualizarTutoresDelBecarioByTutor = async (
  idBecario: number,
  idTutor: number,
  tutores: TutorBecarioAsignacion[]
) => {
  await getAssignedBecario(idBecario, idTutor);

  const propia = await prisma.tutorBecario.findFirst({
    where: { idBecario, idTutor, activo: true },
    select: { idTutor: true, tipoTutor: true },
  });

  if (!propia) {
    throw new Error('No tienes permisos para editar este becario');
  }

  const tutoresUnicos = new Map<number, TutorBecarioAsignacion>();
  for (const tutor of tutores) {
    if (!TIPOS_TUTORIA.some(tipo => tipo === tutor.tipoTutoria)) {
      throw new Error('Tipo de tutoria invalido');
    }
    if (tutor.tutorId !== idTutor) {
      tutoresUnicos.set(tutor.tutorId, tutor);
    }
  }

  const tutoresFinales = [
    ...Array.from(tutoresUnicos.values()),
    {
      tutorId: propia.idTutor,
      tipoTutoria: propia.tipoTutor as TipoTutoria,
    },
  ];

  if (tutoresFinales.length > 0) {
    const tutorIds = tutoresFinales.map(t => t.tutorId);
    const encontrados = await prisma.usuario.findMany({
      where: {
        idUsuario: { in: tutorIds },
        rol: { in: [...TUTOR_ROLES] },
      },
      select: { idUsuario: true },
    });
    const idsEncontrados = new Set(encontrados.map(u => u.idUsuario));
    const idsInvalidos = tutorIds.filter(id => !idsEncontrados.has(id));
    if (idsInvalidos.length > 0) {
      throw new Error(`Tutor no encontrado: ${idsInvalidos.join(',')}`);
    }
  }

  await prisma.$transaction(async tx => {
    await tx.tutorBecario.deleteMany({ where: { idBecario } });
    await tx.tutorBecario.createMany({
      data: tutoresFinales.map(tutor => ({
        idBecario,
        idTutor: tutor.tutorId,
        tipoTutor: tutor.tipoTutoria,
        activo: true,
      })),
    });
  });

  logger.info('Tutores de becario actualizados por tutor', {
    idBecario,
    idTutor,
    cantidadTutores: tutoresFinales.length,
  });

  return { success: true, cantidadTutores: tutoresFinales.length };
};

/**
 * Actualiza la información corporativa y académica de un becario
 * Solo el tutor asignado puede realizar esta actualización
 * NO se pueden editar los datos de contacto (telefonoPersonal, emailPersonal, linkedin)
 *
 * @param idBecario - ID del becario a actualizar
 * @param idTutor - ID del tutor que realiza la actualización
 * @param data - Datos a actualizar
 * @returns Becario actualizado con toda su información
 */
export const updateBecarioCorporativoAcademico = async (
  idBecario: number,
  idTutor: number,
  data: UpdateBecarioCorporativoAcademicoData
) => {
  try {
    // Verificar que el becario existe y obtener su idUsuario
    const becario = await prisma.becario.findUnique({
      where: { idBecario },
      select: { idUsuario: true },
    });

    if (!becario) {
      throw new Error('Becario no encontrado');
    }

    // Verificar que el tutor está asignado a este becario
    const estaAsignado = await verificarAsignacionTutorBecario(
      idBecario,
      idTutor
    );
    if (!estaAsignado) {
      throw new Error('No tienes permisos para editar este becario');
    }

    // Validar que al menos un campo esté presente
    if (Object.keys(data).length === 0) {
      throw new Error('Debe proporcionar al menos un campo para actualizar');
    }

    // Validar horasContrato si se proporciona
    if (data.horasContrato !== undefined && data.horasContrato < 0) {
      throw new Error('Las horas de contrato no pueden ser negativas');
    }

    if (
      data.ayudaEconomica !== undefined &&
      data.ayudaEconomica !== null &&
      data.ayudaEconomica < 0
    ) {
      throw new Error('La ayuda economica no puede ser negativa');
    }

    // Validar fechas si se proporcionan
    if (data.fechaInicioPracticas && data.fechaFinPracticas) {
      if (data.fechaFinPracticas < data.fechaInicioPracticas) {
        throw new Error(
          'La fecha de fin debe ser posterior a la fecha de inicio'
        );
      }
    }

    // Validar tipoFormacion si se proporciona
    if (data.tipoFormacion !== undefined && data.tipoFormacion !== null) {
      const tipoFormacionValido = TIPOS_FORMACION_COMPATIBLES.some(
        tipo => tipo === data.tipoFormacion
      );
      if (!tipoFormacionValido) {
        throw new Error(
          `Tipo de formación inválido. Valores permitidos: ${TIPOS_FORMACION_COMPATIBLES.join(', ')}`
        );
      }
    }

    // Preparar datos para actualizar en tabla Usuario (practica, cliente)
    const usuarioUpdateData: Prisma.UsuarioUpdateInput = {};
    if (data.practica !== undefined) usuarioUpdateData.practica = data.practica;
    if (data.cliente !== undefined) usuarioUpdateData.cliente = data.cliente;

    // Preparar datos para actualizar en tabla Becarios
    const becarioUpdateData: Prisma.BecarioUpdateInput = {};
    if (data.horasContrato !== undefined)
      becarioUpdateData.horasContrato = data.horasContrato;
    if (data.ayudaEconomica !== undefined)
      becarioUpdateData.ayudaEconomica = data.ayudaEconomica;
    if (data.equipoEnUso !== undefined)
      becarioUpdateData.equipoEnUso = data.equipoEnUso?.trim() || null;
    if (data.fechaInicioPracticas !== undefined)
      becarioUpdateData.fechaInicioPracticas = data.fechaInicioPracticas;
    if (data.fechaFinPracticas !== undefined)
      becarioUpdateData.fechaFinPracticas = data.fechaFinPracticas;
    if (data.tipoFormacion !== undefined)
      becarioUpdateData.tipoFormacion = data.tipoFormacion;
    if (data.nombreGradoUniversitario !== undefined)
      becarioUpdateData.nombreGradoUniversitario =
        data.nombreGradoUniversitario;
    if (data.nombreFormacionProfesional !== undefined)
      becarioUpdateData.nombreFormacionProfesional =
        data.nombreFormacionProfesional;
    if (data.centroEstudios !== undefined)
      becarioUpdateData.centroEstudios = data.centroEstudios;
    if (data.telefonoPersonal !== undefined)
      becarioUpdateData.telefonoPersonal = data.telefonoPersonal;
    if (data.emailPersonal !== undefined)
      becarioUpdateData.emailPersonal = data.emailPersonal;
    if (data.linkedin !== undefined) becarioUpdateData.linkedin = data.linkedin;

    // Actualizar ambas tablas en una transacción
    const becarioActualizado = await prisma.$transaction(async tx => {
      // Actualizar Usuario si hay cambios
      if (Object.keys(usuarioUpdateData).length > 0) {
        await tx.usuario.update({
          where: { idUsuario: becario.idUsuario },
          data: usuarioUpdateData,
        });
      }

      // Actualizar Becario si hay cambios
      if (Object.keys(becarioUpdateData).length > 0) {
        await tx.becario.update({
          where: { idBecario },
          data: becarioUpdateData,
        });
      }

      // Obtener el becario completo con toda la información
      const becarioCompleto = await tx.becario.findUnique({
        where: { idBecario },
        include: {
          usuario: {
            select: {
              idUsuario: true,
              email: true,
              nombre: true,
              apellidos: true,
              activo: true,
              practica: true,
              cliente: true,
            },
          },
        },
      });

      return becarioCompleto;
    });

    logger.info('Becario actualizado por tutor', { idBecario, idTutor });

    // Formatear respuesta
    return {
      idBecario: becarioActualizado!.idBecario,
      idUsuario: becarioActualizado!.usuario.idUsuario,
      nombre: becarioActualizado!.usuario.nombre,
      apellidos: becarioActualizado!.usuario.apellidos,
      email: becarioActualizado!.usuario.email,
      activo: becarioActualizado!.usuario.activo,
      practica: becarioActualizado!.usuario.practica,
      cliente: becarioActualizado!.usuario.cliente,
      fechaInicioPracticas: becarioActualizado!.fechaInicioPracticas,
      fechaFinPracticas: becarioActualizado!.fechaFinPracticas,
      horasContrato: Number(becarioActualizado!.horasContrato),
      ayudaEconomica: becarioActualizado!.ayudaEconomica,
      equipoEnUso: becarioActualizado!.equipoEnUso,
      tipoFormacion: becarioActualizado!.tipoFormacion,
      nombreGradoUniversitario: becarioActualizado!.nombreGradoUniversitario,
      nombreFormacionProfesional:
        becarioActualizado!.nombreFormacionProfesional,
      centroEstudios: becarioActualizado!.centroEstudios,
      telefonoPersonal: becarioActualizado!.telefonoPersonal,
      emailPersonal: becarioActualizado!.emailPersonal,
      linkedin: becarioActualizado!.linkedin,
    };
  } catch (error) {
    logger.error('Error al actualizar becario', { error });
    if (error instanceof Error) {
      throw error;
    }
    throw createErrorWithCause(
      'Error al actualizar la información del becario',
      error
    );
  }
};

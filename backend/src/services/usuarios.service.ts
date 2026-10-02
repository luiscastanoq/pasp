import type { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { hashPassword } from '../utils/password.util';
import logger from '../config/logger';
import { ROLES, normalizeRolUsuario } from '../shared/constants/domain.constants';

type HttpError = Error & { statusCode?: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface UpdateAdministradorData {
  nombre?: string;
  apellidos?: string;
  email?: string;
  contrasena?: string; // texto plano — se hashea si viene
  practica?: string;   // solo aplica para Tutor_Empresa
  cliente?: string;    // solo aplica para Tutor_Empresa
}

// ── Servicios ─────────────────────────────────────────────────────────────────

/**
 * Obtiene todos los usuarios del sistema.
 */
export const getAll = async (hideSuperAdmin = false) => {
  const usuarios = await prisma.usuario.findMany({
    where: hideSuperAdmin ? { esSuperAdmin: false } : undefined,
    select: {
      idUsuario: true,
      nombre: true,
      apellidos: true,
      email: true,
      rol: true,
      activo: true,
      primerAcceso: true,
      cliente: true,
    },
    orderBy: { apellidos: 'asc' },
  });

  return usuarios.map(usuario => ({
    ...usuario,
    rol: normalizeRolUsuario(usuario.rol),
  }));
};

/**
 * Obtiene todos los usuarios con rol Becario y sus datos de perfil.
 * Usado por el modal de selección de becarios (HU-5.10).
 */
export const getBecarios = async () => {
  const becarios = await prisma.usuario.findMany({
    where: { rol: ROLES.BECARIO, activo: true },
    select: {
      idUsuario: true,
      nombre: true,
      apellidos: true,
      becario: {
        select: {
          idBecario: true,
          emailPersonal: true,
          centroEstudios: true,
          tipoFormacion: true,
        },
      },
    },
    orderBy: { apellidos: 'asc' },
  });

  // Filtramos usuarios que realmente tengan perfil de becario
  return becarios
    .filter(u => u.becario !== null)
    .map(u => ({
      id: String(u.becario!.idBecario), // ← idBecario para TutorBecario
      nombre: u.nombre,
      apellidos: u.apellidos,
      emailPersonal: u.becario!.emailPersonal ?? '',
      centroEstudios: u.becario!.centroEstudios
        ? { nombre: u.becario!.centroEstudios }
        : null,
      tipoFormacion: u.becario!.tipoFormacion ?? null,
    }));
};

/**
 * Obtiene un usuario por su ID, excluyendo la contraseña.
 *
 * @throws Error 'USUARIO_NO_ENCONTRADO' (404) si el usuario no existe.
 */
export const getUsuarioById = async (id: number, hideSuperAdmin = false) => {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario: id },
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
      createdAt: true,
    },
  });

  if (!usuario || (hideSuperAdmin && usuario.esSuperAdmin)) {
    throw createHttpError('USUARIO_NO_ENCONTRADO', 404);
  }

  return {
    ...usuario,
    rol: normalizeRolUsuario(usuario.rol),
  };
};

/**
 * Actualiza nombre, apellidos, email y opcionalmente contraseña de un usuario.
 * Al establecer una nueva contraseña temporal, reactiva el primer acceso para
 * obligar al usuario a sustituirla por una contraseña personal.
 * Verifica que el nuevo email no esté en uso por otro usuario → 409 si colisiona.
 * Registra log INFO con campos modificados.
 *
 * @throws Error 'USUARIO_NO_ENCONTRADO' (404) si el usuario no existe.
 * @throws Error 'EMAIL_DUPLICADO' (409) si el email ya lo usa otro usuario.
 */
export const updateAdministrador = async (
  id: number,
  data: UpdateAdministradorData,
) => {
  const { nombre, apellidos, email, contrasena, practica, cliente } = data;

  // Verificar que el usuario existe
  const existente = await prisma.usuario.findUnique({
    where: { idUsuario: id },
  });
  if (!existente) {
    throw createHttpError('USUARIO_NO_ENCONTRADO', 404);
  }

  // Verificar colisión de email (solo si se está cambiando a uno diferente)
  if (email && email.toLowerCase().trim() !== existente.email) {
    const emailEnUso = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (emailEnUso) {
      throw createHttpError('EMAIL_DUPLICADO', 409);
    }
  }

  // Construir objeto de actualización solo con los campos presentes
  const updateData: Prisma.UsuarioUpdateInput = {};
  const camposModificados: string[] = [];

  if (nombre !== undefined) {
    updateData.nombre = nombre.trim();
    camposModificados.push('nombre');
  }
  if (apellidos !== undefined) {
    updateData.apellidos = apellidos.trim();
    camposModificados.push('apellidos');
  }
  if (email !== undefined) {
    updateData.email = email.toLowerCase().trim();
    camposModificados.push('email');
  }
  if (contrasena !== undefined && contrasena.trim() !== '') {
    updateData.passwordHash = await hashPassword(contrasena);
    updateData.primerAcceso = true;
    camposModificados.push('contrasena');
  }
  if (practica !== undefined) {
    updateData.practica = practica.trim();
    camposModificados.push('practica');
  }
  if (cliente !== undefined) {
    updateData.cliente = cliente.trim();
    camposModificados.push('cliente');
  }

  const usuarioActualizado = await prisma.usuario.update({
    where: { idUsuario: id },
    data: updateData,
    select: {
      idUsuario: true,
      nombre: true,
      apellidos: true,
      email: true,
      rol: true,
      activo: true,
      primerAcceso: true,
      practica: true,
      cliente: true,
      createdAt: true,
    },
  });

  logger.info('Usuario actualizado', {
    usuarioId: id,
    camposModificados,
  });

  return {
    ...usuarioActualizado,
    rol: normalizeRolUsuario(usuarioActualizado.rol),
  };
};

/**
 * Alterna el campo `activo` del usuario (habilitar/deshabilitar).
 * Registra log INFO con el nuevo estado.
 *
 * @throws Error 'USUARIO_NO_ENCONTRADO' (404) si el usuario no existe.
 */
export const toggleActivoUsuario = async (id: number) => {
  const existente = await prisma.usuario.findUnique({
    where: { idUsuario: id },
    select: { idUsuario: true, activo: true, nombre: true, email: true },
  });

  if (!existente) {
    throw createHttpError('USUARIO_NO_ENCONTRADO', 404);
  }

  const nuevoEstado = !existente.activo;

  const usuarioActualizado = await prisma.usuario.update({
    where: { idUsuario: id },
    data: { activo: nuevoEstado },
    select: {
      idUsuario: true,
      nombre: true,
      apellidos: true,
      email: true,
      rol: true,
      activo: true,
      primerAcceso: true,
      cliente: true,
    },
  });

  logger.info('Estado de usuario alternado', {
    usuarioId: id,
    email: existente.email,
    nuevoEstado: nuevoEstado ? 'activo' : 'inactivo',
  });

  return {
    ...usuarioActualizado,
    rol: normalizeRolUsuario(usuarioActualizado.rol),
  };
};

/**
 * Elimina un usuario del sistema.
 * Validaciones:
 *  - No puede eliminar a un usuario con esSuperAdmin: true → 403
 *  - No puede eliminarse a sí mismo → 403
 *
 * @throws Error 'USUARIO_NO_ENCONTRADO' (404) si el usuario no existe.
 * @throws Error 'NO_PUEDE_ELIMINAR_SUPERADMIN' (403) si es superAdmin.
 * @throws Error 'NO_PUEDE_ELIMINARSE_A_SI_MISMO' (403) si intenta borrarse él mismo.
 */
export const deleteUsuario = async (id: number, idAdminLogueado: number) => {
  const existente = await prisma.usuario.findUnique({
    where: { idUsuario: id },
    select: { idUsuario: true, esSuperAdmin: true, email: true, nombre: true },
  });

  if (!existente) {
    throw createHttpError('USUARIO_NO_ENCONTRADO', 404);
  }

  if (existente.esSuperAdmin) {
    throw createHttpError('NO_PUEDE_ELIMINAR_SUPERADMIN', 403);
  }

  if (id === idAdminLogueado) {
    throw createHttpError('NO_PUEDE_ELIMINARSE_A_SI_MISMO', 403);
  }

  await prisma.usuario.delete({ where: { idUsuario: id } });

  logger.info('Usuario eliminado', {
    usuarioEliminadoId: id,
    email: existente.email,
    eliminadoPor: idAdminLogueado,
  });
};

export const usuariosService = {
  getAll,
  getUsuarioById,
  updateAdministrador,
  toggleActivoUsuario,
  deleteUsuario,
  getBecarios,
};

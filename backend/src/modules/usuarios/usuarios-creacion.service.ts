import { prisma } from '../../database/prisma';
import { hashPassword } from '../../utils/password.util';
import {
  ROLES,
  TIPO_FORMACION,
  TIPO_TUTORIA,
  TipoTutoria,
  TipoTutoriaEmpresa,
} from '../../shared/constants/domain.constants';

type HttpError = Error & { statusCode?: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

export interface CreateAdministradorData {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
}

export interface TutorAsignado {
  tutorId: number;
  tipo: TipoTutoria;
}

export interface CreateBecarioData {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  practica: string;
  cliente: string;
  horasContrato: number;
  ayudaEconomica?: number;
  equipoEnUso?: string | null;
  fechaInicioPracticas: string;
  fechaFinPracticas: string;
  tipoFormacion: string;
  nombreFormacion: string;
  centroEstudios: string;
  telefonoPersonal?: string;
  emailPersonal?: string;
  linkedin?: string;
  tutoresAsignados?: TutorAsignado[];
}

export interface CreateTutorAcademicoData {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  becarioIds: number[];
}

export interface BecarioEmpresaAsignacion {
  becarioId: number;
  tipoTutoria: TipoTutoriaEmpresa;
}

export interface CreateTutorEmpresaData {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  practica: string;
  cliente: string;
  becarios: BecarioEmpresaAsignacion[];
}

export interface UsuarioCreado {
  idUsuario: number;
  email: string;
  rol: string;
  nombre: string;
  apellidos: string;
  primerAcceso: boolean;
  activo: boolean;
  createdAt: Date;
}

export const createAdministrador = async (
  data: CreateAdministradorData,
): Promise<UsuarioCreado> => {
  const { nombre, apellidos, email, contrasena } = data;

  const existente = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existente) {
    throw new Error('EMAIL_DUPLICADO');
  }

  const passwordHash = await hashPassword(contrasena);

  return prisma.usuario.create({
    data: {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      rol: ROLES.ADMINISTRADOR,
      practica: null,
      cliente: null,
      primerAcceso: true,
      activo: true,
      esSuperAdmin: false,
    },
    select: {
      idUsuario: true,
      email: true,
      rol: true,
      nombre: true,
      apellidos: true,
      primerAcceso: true,
      activo: true,
      createdAt: true,
    },
  });
};

export const createTutorAcademico = async (
  data: CreateTutorAcademicoData,
): Promise<UsuarioCreado> => {
  const { nombre, apellidos, email, contrasena, becarioIds } = data;

  const existente = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existente) throw new Error('EMAIL_DUPLICADO');

  if (becarioIds.length > 0) {
    const becariosEncontrados = await prisma.becario.findMany({
      where: { idBecario: { in: becarioIds } },
      select: { idBecario: true },
    });
    const idsEncontrados = new Set(becariosEncontrados.map(b => b.idBecario));
    for (const id of becarioIds) {
      if (!idsEncontrados.has(id)) {
        throw new Error(`BECARIO_NO_ENCONTRADO:${id}`);
      }
    }
  }

  const passwordHash = await hashPassword(contrasena);

  return prisma.$transaction(async tx => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        rol: ROLES.TUTOR_ACADEMICO,
        practica: null,
        cliente: null,
        primerAcceso: true,
        activo: true,
        esSuperAdmin: false,
      },
      select: {
        idUsuario: true,
        email: true,
        rol: true,
        nombre: true,
        apellidos: true,
        primerAcceso: true,
        activo: true,
        createdAt: true,
      },
    });

    if (becarioIds.length > 0) {
      await tx.tutorBecario.createMany({
        data: becarioIds.map(idBecario => ({
          idTutor: usuario.idUsuario,
          idBecario,
          tipoTutor: TIPO_TUTORIA.ACADEMICO,
          activo: true,
        })),
      });
    }

    return usuario;
  });
};

export const createTutorEmpresa = async (
  data: CreateTutorEmpresaData,
): Promise<UsuarioCreado> => {
  const { nombre, apellidos, email, contrasena, practica, cliente, becarios } = data;

  const existente = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existente) throw new Error('EMAIL_DUPLICADO');

  if (becarios.length > 0) {
    const ids = becarios.map(b => b.becarioId);
    const encontrados = await prisma.becario.findMany({
      where: { idBecario: { in: ids } },
      select: { idBecario: true },
    });
    const idsEncontrados = new Set(encontrados.map(b => b.idBecario));
    for (const id of ids) {
      if (!idsEncontrados.has(id)) {
        throw new Error(`BECARIO_NO_ENCONTRADO:${id}`);
      }
    }
  }

  const passwordHash = await hashPassword(contrasena);

  return prisma.$transaction(async tx => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        rol: ROLES.TUTOR_EMPRESA,
        practica: practica.trim(),
        cliente: cliente.trim(),
        primerAcceso: true,
        activo: true,
        esSuperAdmin: false,
      },
      select: {
        idUsuario: true,
        email: true,
        rol: true,
        nombre: true,
        apellidos: true,
        primerAcceso: true,
        activo: true,
        createdAt: true,
      },
    });

    if (becarios.length > 0) {
      await tx.tutorBecario.createMany({
        data: becarios.map(b => ({
          idTutor: usuario.idUsuario,
          idBecario: b.becarioId,
          tipoTutor: b.tipoTutoria,
          activo: true,
        })),
      });
    }

    return usuario;
  });
};

export const createBecario = async (data: CreateBecarioData): Promise<UsuarioCreado> => {
  const {
    nombre,
    apellidos,
    email,
    contrasena,
    practica,
    cliente,
    horasContrato,
    ayudaEconomica,
    equipoEnUso,
    fechaInicioPracticas,
    fechaFinPracticas,
    tipoFormacion,
    nombreFormacion,
    centroEstudios,
    telefonoPersonal,
    emailPersonal,
    linkedin,
    tutoresAsignados = [],
  } = data;

  const existente = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existente) {
    throw createHttpError('EMAIL_DUPLICADO', 409);
  }

  if (tutoresAsignados.length > 0) {
    const tutorIds = tutoresAsignados.map(t => t.tutorId);
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

  const passwordHash = await hashPassword(contrasena);

  return prisma.$transaction(async tx => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        rol: ROLES.BECARIO,
        practica: practica.trim(),
        cliente: cliente.trim(),
        primerAcceso: true,
        activo: true,
        esSuperAdmin: false,
      },
      select: {
        idUsuario: true,
        email: true,
        rol: true,
        nombre: true,
        apellidos: true,
        primerAcceso: true,
        activo: true,
        createdAt: true,
      },
    });

    const esUniversitaria = tipoFormacion === TIPO_FORMACION.UNIVERSITARIA;
    const becarioCreado = await tx.becario.create({
      data: {
        idUsuario: usuario.idUsuario,
        horasContrato,
        ayudaEconomica: ayudaEconomica ?? null,
        equipoEnUso: equipoEnUso?.trim() || null,
        fechaInicioPracticas: new Date(fechaInicioPracticas),
        fechaFinPracticas: new Date(fechaFinPracticas),
        tipoFormacion,
        nombreGradoUniversitario: esUniversitaria ? nombreFormacion.trim() : null,
        nombreFormacionProfesional: !esUniversitaria ? nombreFormacion.trim() : null,
        centroEstudios: centroEstudios.trim(),
        telefonoPersonal: telefonoPersonal?.trim() || null,
        emailPersonal: emailPersonal?.trim() || null,
        linkedin: linkedin?.trim() || null,
      },
      select: { idBecario: true },
    });

    if (tutoresAsignados.length > 0) {
      await tx.tutorBecario.createMany({
        data: tutoresAsignados.map(t => ({
          idTutor: t.tutorId,
          idBecario: becarioCreado.idBecario,
          tipoTutor: t.tipo,
          activo: true,
        })),
      });
    }

    return usuario;
  });
};

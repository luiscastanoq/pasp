/**
 * Servicio de Fichaje - PASP (Simplificado v2.1)
 * Sistema simplificado de registro de entrada/salida
 */

import type { Fichaje, Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';

const APP_TIME_ZONE = 'Europe/Madrid';

function getMadridDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

function dateOnlyFromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export interface CreateFichajeData {
  idBecario: number;
}

export interface UpdateSalidaData {
  horasImputadas: number;
}

/**
 * Registra la entrada de un becario
 */
export async function ficharEntrada( data: CreateFichajeData): Promise<Fichaje> {
  const { idBecario } = data;

  const ahora = new Date();
  const fechaHoyStr = getMadridDateKey(ahora);
  const fechaHoy = dateOnlyFromDateKey(fechaHoyStr);

  // Validar becario existe y está activo
  const becario = await prisma.becario.findUnique({
    where: { idBecario },
    include: { usuario: { select: { activo: true } } },
  });

  if (!becario) {
    throw new Error('Becario no encontrado');
  }

  if (!becario.usuario.activo) {
    throw new Error('Usuario inactivo. No puede fichar');
  }

  const fichajeMasReciente = await prisma.fichaje.findFirst({
    where: { idBecario },
    orderBy: { fecha: 'desc' },
  });

  if (fichajeMasReciente) {
    const fechaFichaje = fichajeMasReciente.fecha instanceof Date
      ? fichajeMasReciente.fecha.toISOString().slice(0, 10)
      : String(fichajeMasReciente.fecha).slice(0, 10);

    if (fechaFichaje === fechaHoyStr) {
      throw new Error('Ya existe un fichaje para hoy. Solo se permite un fichaje por día');
    }
  }

  // Crear fichaje
  const nuevoFichaje = await prisma.fichaje.create({
    data: {
      idBecario,
      fecha: fechaHoy,
      horaEntrada: ahora,
    },
  });

  return nuevoFichaje;
}

/**
 * Registra la salida con horas imputadas y calcula horas trabajadas automáticamente
 */
export async function ficharSalida(
        idFichaje: number,
     data: UpdateSalidaData
): Promise<Fichaje> {
  const { horasImputadas } = data;

  // La API solo admite jornadas imputadas entre media hora y dieciseis horas.
  if (!Number.isFinite(horasImputadas) || horasImputadas < 0.5 || horasImputadas > 16) {
    throw new Error('Las horas imputadas deben estar entre 0.5 y 16');
  }

  // Buscar el fichaje
  const fichaje = await prisma.fichaje.findUnique({
    where: { idFichaje },
  });

  if (!fichaje) {
    throw new Error('Fichaje no encontrado');
  }

  // Validar que no tiene salida registrada
  if (fichaje.horaSalida !== null) {
    throw new Error('Este fichaje ya tiene registrada una salida');
  }

  const horaSalida = new Date();

  // Calcular diferencia con instantes reales.
  const tiempoTranscurridoMs = horaSalida.getTime() - fichaje.horaEntrada.getTime();
  const horasTrabajadas = tiempoTranscurridoMs / (1000 * 60 * 60);
  const horasTrabajadasRedondeadas = Math.round(horasTrabajadas * 100) / 100;





  // Actualizar fichaje con salida
  const fichajeActualizado = await prisma.fichaje.update({
    where: { idFichaje },
      data: {
      horaSalida,
      horasTrabajadas: horasTrabajadasRedondeadas,
      horas_imputadas: horasImputadas,
    },
  });

  return fichajeActualizado;
}

/**
 * Obtiene el fichaje del día de un becario (con o sin salida).
 * Devuelve null si no ha fichado entrada hoy.
 *
 * NOTA: Para evitar problemas de zona horaria con SQL Server (@db.Date),
 * se obtiene el fichaje más reciente y se comprueba si es de hoy
 * comparando las fechas como strings (YYYY-MM-DD).
 */
export async function getFichajeActivo(idBecario: number): Promise<Fichaje | null> {
  const fechaHoyStr = getMadridDateKey();

  // Obtener el fichaje más reciente del becario
  const fichajeMasReciente = await prisma.fichaje.findFirst({
    where: { idBecario },
    orderBy: { fecha: 'desc' },
  });

  if (!fichajeMasReciente) return null;

  const fechaFichaje = getMadridDateKey(fichajeMasReciente.horaEntrada);

  if (fechaFichaje === fechaHoyStr) {
    return fichajeMasReciente;
  }

  return null;
}

export interface HistorialFichajesParams {
  idBecario: number;
  page?: number;
  limit?: number;
  fechaInicio?: string; // YYYY-MM-DD
  fechaFin?: string;    // YYYY-MM-DD
}

/**
 * DTO de fichaje con campos en camelCase para las respuestas de la API.
 * Prisma usa snake_case para `horas_imputadas`; este DTO lo expone como `horasImputadas`.
 */
export interface FichajeDTO {
  idFichaje: number;
  idBecario: number;
  fecha: Date;
  horaEntrada: Date;
  horaSalida: Date | null;
  horasTrabajadas: number | null;
  horasImputadas: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistorialFichajesResult {
  fichajes: FichajeDTO[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Convierte un objeto Prisma Fichaje (snake_case) al DTO camelCase de la API.
 */
function toFichajeDTO(f: Fichaje): FichajeDTO {
  return {
    idFichaje: f.idFichaje,
    idBecario: f.idBecario,
    fecha: f.fecha,
    horaEntrada: f.horaEntrada,
    horaSalida: f.horaSalida,
    horasTrabajadas: f.horasTrabajadas !== null ? Number(f.horasTrabajadas) : null,
    horasImputadas: f.horas_imputadas !== null ? Number(f.horas_imputadas) : null,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

/**
 * Obtiene el historial paginado de fichajes de un becario con filtros opcionales por fecha.
 * Los registros se devuelven ordenados por fecha descendente (más reciente primero).
 */
export async function getHistorialFichajes(
  params: HistorialFichajesParams
): Promise<HistorialFichajesResult> {
  const { idBecario, page = 1, limit = 10, fechaInicio, fechaFin } = params;

  const whereClause: Prisma.FichajeWhereInput = { idBecario };

  if (fechaInicio || fechaFin) {
    const fechaFilter: Prisma.DateTimeFilter = {};
    if (fechaInicio) {
      fechaFilter.gte = new Date(`${fechaInicio}T00:00:00.000Z`);
    }
    if (fechaFin) {
      fechaFilter.lte = new Date(`${fechaFin}T23:59:59.999Z`);
    }
    whereClause.fecha = fechaFilter;
  }

  const skip = (page - 1) * limit;

  const [total, fichajes] = await Promise.all([
    prisma.fichaje.count({ where: whereClause }),
    prisma.fichaje.findMany({
      where: whereClause,
      orderBy: { fecha: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    fichajes: fichajes.map(toFichajeDTO),
    total,
    page,
    totalPages,
  };
}

export default {
  ficharEntrada,
  ficharSalida,
  getFichajeActivo,
  getHistorialFichajes,
};

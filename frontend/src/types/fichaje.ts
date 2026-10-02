/**
 * Tipos TypeScript para el sistema de fichaje simplificado v2.1
 */

/**
 * Fichaje completo con todos los datos
 */
export interface Fichaje {
  idFichaje: number;
  idBecario: number;
  fecha: string; // ISO 8601 date string
  horaEntrada: string; // ISO 8601 datetime string
  horaSalida: string | null; // ISO 8601 datetime string
  horasTrabajadas: number | null; // Calculadas automáticamente
  horas_imputadas: number | null; // Ingresadas manualmente por el becario (snake_case de Prisma)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fichaje del día (puede tener o no salida registrada)
 */
export interface FichajeActivo {
  idFichaje: number;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
}

/**
 * Datos para fichar entrada
 */
export type FicharEntradaData = Record<string, never>;

/**
 * Datos para fichar salida
 */
export interface FicharSalidaData {
  horasImputadas: number;
}

/**
 * Response de fichar entrada
 */
export interface FicharEntradaResponse {
  success: boolean;
  message: string;
   data: {
    idFichaje: number;
    fecha: string;
    horaEntrada: string;
  };
}

/**
 * Response de fichar salida
 */
export interface FicharSalidaResponse {
  success: boolean;
  message: string;
   data: {
    idFichaje: number;
    fecha: string;
    horaEntrada: string;
    horaSalida: string;
    horasTrabajadas: number;
    horasImputadas: number;
  };
}

/**
 * Response de obtener fichaje activo
 */
export interface FichajeActivoResponse {
  success: boolean;
  message?: string;
  data?: FichajeActivo | null;
}

/**
 * Entrada del historial de fichajes
 */
export interface FichajeHistorialEntry {
  idFichaje: number;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  horasTrabajadas: number | null;
  horasImputadas: number | null; // camelCase — la API mapea horas_imputadas → horasImputadas
}

/**
 * Información de paginación
 */
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response del historial paginado de fichajes
 */
export interface FichajeHistorialResponse {
  success: boolean;
  data: {
    fichajes: FichajeHistorialEntry[];
    pagination: PaginationInfo;
  };
}

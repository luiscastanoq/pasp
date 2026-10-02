/**
 * Servicio de autenticación
 * ACTUALIZADO PARA SCHEMA V2.0
 */

import {
  fetchApi,
  fetchWithAuth,
  setToken,
  removeToken,
  getToken,
  setUser,
  removeUser,
  getUser,
  ApiError,
} from '../../../shared/api/api';
import type { RolUsuario } from '../../../shared/constants/domain.constants';

/**
 * Tipos para el servicio de autenticación
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginOptions {
  onDatabaseWaking?: () => void;
}

export type AccessCredentials = LoginCredentials | { role: RolUsuario };

/**
 * Interfaz de Usuario actualizada para Schema V2.0
 * Incluye: nombre, apellidos, practica, cliente
 */
export interface User {
  idUsuario: number;
  email: string;
  rol: RolUsuario;
  nombre: string;
  apellidos: string;
  practica: string | null;
  cliente: string | null;
  primerAcceso: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

interface ApiErrorBody {
  code?: string;
}

const DATABASE_WAKING_UP_CODE = 'DATABASE_WAKING_UP';
const DATABASE_READY_RETRY_DELAY_MS = 5_000;
const DATABASE_READY_MAX_ATTEMPTS = 18;
const DATABASE_READY_TIMEOUT_MESSAGE =
  'El sistema está tardando más de lo esperado en prepararse. Inténtalo de nuevo en unos instantes.';

type DatabaseWakingListener = () => void;

let databaseReadinessPromise: Promise<void> | null = null;
let databaseIsWaking = false;
const databaseWakingListeners = new Set<DatabaseWakingListener>();

function isDatabaseWakingUpError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 503) {
    return false;
  }

  const body = error.data as ApiErrorBody | undefined;
  return body?.code === DATABASE_WAKING_UP_CODE;
}

function wait(delayMs: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, delayMs);
  });
}

async function waitForDatabaseReady(
  onDatabaseWaking?: () => void
): Promise<void> {
  for (let attempt = 1; attempt <= DATABASE_READY_MAX_ATTEMPTS; attempt += 1) {
    try {
      await fetchApi('/health/ready');
      return;
    } catch (error) {
      if (!isDatabaseWakingUpError(error)) {
        throw error;
      }

      onDatabaseWaking?.();

      if (attempt < DATABASE_READY_MAX_ATTEMPTS) {
        await wait(DATABASE_READY_RETRY_DELAY_MS);
      }
    }
  }

  throw new ApiError(503, DATABASE_READY_TIMEOUT_MESSAGE, {
    success: false,
    code: DATABASE_WAKING_UP_CODE,
    message: DATABASE_READY_TIMEOUT_MESSAGE,
  });
}

function notifyDatabaseWaking(): void {
  databaseIsWaking = true;
  databaseWakingListeners.forEach(listener => listener());
}

function getSharedDatabaseReadiness(): Promise<void> {
  if (!databaseReadinessPromise) {
    databaseReadinessPromise = (async () => {
      try {
        await waitForDatabaseReady(notifyDatabaseWaking);
      } finally {
        databaseReadinessPromise = null;
        databaseIsWaking = false;
      }
    })();
  }

  return databaseReadinessPromise;
}

async function ensureDatabaseReady(
  onDatabaseWaking?: DatabaseWakingListener
): Promise<void> {
  if (onDatabaseWaking) {
    databaseWakingListeners.add(onDatabaseWaking);

    if (databaseIsWaking) {
      onDatabaseWaking();
    }
  }

  try {
    await getSharedDatabaseReadiness();
  } finally {
    if (onDatabaseWaking) {
      databaseWakingListeners.delete(onDatabaseWaking);
    }
  }
}

async function requestLogin(
  credentials: AccessCredentials
): Promise<LoginResponse> {
  return fetchApi<LoginResponse>(
    'role' in credentials ? '/auth/demo-login' : '/auth/login',
    {
      method: 'POST',
      skipAuthErrorHandler: true,
      body: JSON.stringify(credentials),
    }
  );
}

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Empieza a preparar Azure SQL sin bloquear la pantalla de login.
   * Si ya hay una comprobación en curso, reutiliza la misma promesa.
   */
  async warmUpDatabase(options: LoginOptions = {}): Promise<void> {
    await ensureDatabaseReady(options.onDatabaseWaking);
  },

  /**
   * Login de usuario
   */
  async login(
    credentials: AccessCredentials,
    options: LoginOptions = {}
  ): Promise<LoginResponse> {
    await ensureDatabaseReady(options.onDatabaseWaking);

    let response: LoginResponse;

    try {
      response = await requestLogin(credentials);
    } catch (error) {
      // La base puede quedar transitoriamente indisponible entre la
      // comprobación de disponibilidad y la consulta del usuario.
      if (!isDatabaseWakingUpError(error)) {
        throw error;
      }

      options.onDatabaseWaking?.();
      await ensureDatabaseReady(options.onDatabaseWaking);
      response = await requestLogin(credentials);
    }

    // Guardar token durante la sesión de la pestaña
    if (response.success && response.data.token) {
      setToken(response.data.token);

      // Guardar datos del usuario durante la sesión de la pestaña
      setUser(response.data.user);
    }

    return response;
  },

  /**
   * Logout de usuario
   */
  logout(): void {
    removeToken();

    // Eliminar datos del usuario almacenados
    removeUser();
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return getToken() !== null;
  },

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return getToken();
  },

  /**
   * Obtener datos del usuario guardados
   */
  getStoredUser(): User | null {
    return getUser();
  },

  /**
   * Cambiar contraseña del usuario
   */
  async changePassword(
    passwords: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    const response = await fetchWithAuth<ChangePasswordResponse>(
      '/auth/change-password',
      {
        method: 'PATCH',
        body: JSON.stringify(passwords),
      }
    );

    return response;
  },
};

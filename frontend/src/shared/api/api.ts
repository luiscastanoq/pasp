/**
 * Configuración base de la API y utilidades
 */

import type { User as AuthUser } from '../../features/auth/services/authService';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

type FetchApiOptions = RequestInit & {
  skipAuthErrorHandler?: boolean;
};

type JwtExpirationPayload = {
  exp?: number;
};

const SESSION_EXPIRED_MESSAGE = 'La sesión no es válida o ha expirado';

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (base64.length % 4)) % 4;
  const paddedBase64 = base64.padEnd(base64.length + paddingLength, '=');

  return atob(paddedBase64);
}

/**
 * Comprueba localmente si un JWT está caducado o mal formado.
 * No sustituye la validación de firma del backend.
 */
export function isTokenExpiredOrInvalid(token: string | null): boolean {
  if (!token) {
    return true;
  }

  const [, payload] = token.split('.');

  if (!payload) {
    return true;
  }

  try {
    const decodedPayload = JSON.parse(
      decodeBase64Url(payload)
    ) as JwtExpirationPayload;

    if (typeof decodedPayload.exp !== 'number') {
      return true;
    }

    return decodedPayload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function getApiErrorMessage(data: unknown): string {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return 'Error en la petición';
}

/**
 * Clase para manejar errores de la API
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Callback para manejar errores de autenticación
 * Permite que el AuthContext maneje la expiración del token
 */
let onAuthErrorCallback: (() => void) | null = null;

export function setAuthErrorHandler(callback: () => void) {
  onAuthErrorCallback = callback;
}

/**
 * Función auxiliar para hacer peticiones HTTP
 */
async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { skipAuthErrorHandler = false, ...requestOptions } = options;

  const config: RequestInit = {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...requestOptions.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      if (data?.code === 'DEMO_READ_ONLY') {
        window.dispatchEvent(
          new CustomEvent('pasp:demo-write-blocked', {
            detail: getApiErrorMessage(data),
          })
        );
      }
      // Si el error es 401 (Unauthorized), invocar el callback
      if (
        response.status === 401 &&
        onAuthErrorCallback &&
        !skipAuthErrorHandler
      ) {
        onAuthErrorCallback();
      }

      throw new ApiError(response.status, getApiErrorMessage(data), data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Error de conexión con el servidor');
  }
}

/**
 * Obtener token almacenado
 */
export function getToken(): string | null {
  localStorage.removeItem('auth_token');
  return sessionStorage.getItem('auth_token');
}

/**
 * Guardar token
 */
export function setToken(token: string): void {
  sessionStorage.setItem('auth_token', token);
}

/**
 * Eliminar token
 */
export function removeToken(): void {
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token');
}

/**
 * Guardar datos del usuario durante la sesión de la pestaña
 */
export function setUser(user: AuthUser): void {
  sessionStorage.setItem('auth_user', JSON.stringify(user));
}

/**
 * Obtener datos del usuario almacenados
 */
export function getUser(): AuthUser | null {
  localStorage.removeItem('auth_user');
  const userData = sessionStorage.getItem('auth_user');
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error al parsear datos del usuario:', error);
    return null;
  }
}

/**
 * Eliminar datos del usuario
 */
export function removeUser(): void {
  sessionStorage.removeItem('auth_user');
  localStorage.removeItem('auth_user');
}

/**
 * Función para hacer peticiones autenticadas
 */
export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  if (token && isTokenExpiredOrInvalid(token)) {
    onAuthErrorCallback?.();

    throw new ApiError(401, SESSION_EXPIRED_MESSAGE, {
      success: false,
      code: 'UNAUTHORIZED',
      message: SESSION_EXPIRED_MESSAGE,
    });
  }

  return fetchApi<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

export { fetchApi };

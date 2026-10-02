import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, fetchApi, setToken, setUser } from '../../../shared/api/api';
import { authService } from './authService';
import type { LoginCredentials, LoginResponse } from './authService';

vi.mock('../../../shared/api/api', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../../shared/api/api')>();

  return {
    ...actual,
    fetchApi: vi.fn(),
    setToken: vi.fn(),
    setUser: vi.fn(),
  };
});

const credentials: LoginCredentials = {
  email: 'hugo.salas@pasp-demo.test',
  password: 'Becario123!',
};

const loginResponse: LoginResponse = {
  success: true,
  message: 'Inicio de sesión correcto',
  data: {
    token: 'token-de-prueba',
    user: {
      idUsuario: 1,
      email: credentials.email,
      rol: 'Becario',
      nombre: 'Hugo',
      apellidos: 'Salas',
      practica: 'Práctica de prueba',
      cliente: 'Cliente de prueba',
      primerAcceso: false,
      activo: true,
      createdAt: '2026-07-29T00:00:00.000Z',
      updatedAt: '2026-07-29T00:00:00.000Z',
    },
  },
};

const databaseWakingError = new ApiError(
  503,
  'La base de datos se está iniciando',
  {
    success: false,
    code: 'DATABASE_WAKING_UP',
    message: 'La base de datos se está iniciando',
  }
);

describe('authService.login', () => {
  it('solicita una sesión demo enviando solamente el rol', async () => {
    vi.mocked(fetchApi)
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce(loginResponse);
    await authService.login({ role: 'Becario' });
    expect(fetchApi).toHaveBeenLastCalledWith('/auth/demo-login', {
      method: 'POST',
      skipAuthErrorHandler: true,
      body: JSON.stringify({ role: 'Becario' }),
    });
    expect(setToken).toHaveBeenCalledWith(loginResponse.data.token);
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('comprueba que la base de datos está preparada antes del login', async () => {
    vi.mocked(fetchApi)
      .mockResolvedValueOnce({
        success: true,
        data: { status: 'READY', database: 'READY' },
      })
      .mockResolvedValueOnce(loginResponse);

    await expect(authService.login(credentials)).resolves.toEqual(
      loginResponse
    );

    expect(fetchApi).toHaveBeenNthCalledWith(1, '/health/ready');
    expect(fetchApi).toHaveBeenNthCalledWith(2, '/auth/login', {
      method: 'POST',
      skipAuthErrorHandler: true,
      body: JSON.stringify(credentials),
    });
    expect(setToken).toHaveBeenCalledWith(loginResponse.data.token);
    expect(setUser).toHaveBeenCalledWith(loginResponse.data.user);
  });

  it('reutiliza el calentamiento en curso cuando el usuario inicia sesión', async () => {
    let resolveReadiness!: (value: unknown) => void;
    const readinessResponse = new Promise(resolve => {
      resolveReadiness = resolve;
    });

    vi.mocked(fetchApi)
      .mockReturnValueOnce(readinessResponse)
      .mockResolvedValueOnce(loginResponse);

    const warmUpPromise = authService.warmUpDatabase();
    const loginPromise = authService.login(credentials);

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi).toHaveBeenCalledWith('/health/ready');

    resolveReadiness({
      success: true,
      data: { status: 'READY', database: 'READY' },
    });

    await expect(Promise.all([warmUpPromise, loginPromise])).resolves.toEqual([
      undefined,
      loginResponse,
    ]);
    expect(fetchApi).toHaveBeenCalledTimes(2);
  });

  it('espera y reintenta mientras Azure SQL se está iniciando', async () => {
    vi.useFakeTimers();
    const onDatabaseWaking = vi.fn();

    vi.mocked(fetchApi)
      .mockRejectedValueOnce(databaseWakingError)
      .mockResolvedValueOnce({
        success: true,
        data: { status: 'READY', database: 'READY' },
      })
      .mockResolvedValueOnce(loginResponse);

    const loginPromise = authService.login(credentials, {
      onDatabaseWaking,
    });

    await vi.advanceTimersByTimeAsync(5_000);

    await expect(loginPromise).resolves.toEqual(loginResponse);
    expect(onDatabaseWaking).toHaveBeenCalledTimes(1);
    expect(fetchApi).toHaveBeenCalledTimes(3);
  });

  it('no reintenta un error que no representa el arranque de la base', async () => {
    const unexpectedError = new ApiError(500, 'Error interno del servidor', {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
    });
    vi.mocked(fetchApi).mockRejectedValueOnce(unexpectedError);

    await expect(authService.login(credentials)).rejects.toBe(unexpectedError);
    expect(fetchApi).toHaveBeenCalledTimes(1);
  });
});

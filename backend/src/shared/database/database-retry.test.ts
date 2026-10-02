import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_RETRY_DELAYS_MS,
  isTransientDatabaseError,
  retryTransientDatabaseOperation,
} from './database-retry';

describe('isTransientDatabaseError', () => {
  it.each(['P1001', 'P1002', 'P1017', '40613', 40613])(
    'reconoce el código transitorio %s',
    code => {
      expect(isTransientDatabaseError({ code })).toBe(true);
    }
  );

  it('reconoce errorCode y causas anidadas', () => {
    const error = new Error('Error de consulta') as Error & {
      cause?: unknown;
    };
    error.cause = {
      errorCode: 'P1001',
    };

    expect(isTransientDatabaseError(error)).toBe(true);
  });

  it.each([
    "Can't reach database server at sql.example.test:1433",
    "Database 'paspdb' is not currently available",
    'The database is resuming',
    'Server has closed the connection',
    'Connection attempt timed out',
  ])('reconoce el mensaje transitorio: %s', message => {
    expect(isTransientDatabaseError(new Error(message))).toBe(true);
  });

  it('no considera transitorio un error de credenciales de Prisma', () => {
    expect(
      isTransientDatabaseError({
        name: 'PrismaClientInitializationError',
        errorCode: 'P1000',
        message: 'Authentication failed against database server',
      })
    ).toBe(false);
  });

  it('no confunde errores normales de autenticación de la aplicación', () => {
    expect(isTransientDatabaseError(new Error('Credenciales inválidas'))).toBe(
      false
    );
  });
});

describe('retryTransientDatabaseOperation', () => {
  it('devuelve el resultado sin esperar cuando el primer intento funciona', async () => {
    const operation = vi.fn().mockResolvedValue({ ready: true });
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await retryTransientDatabaseOperation(operation, { sleep });

    expect(result).toEqual({ ready: true });
    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('espera progresivamente y termina al funcionar un intento posterior', async () => {
    const firstError = { code: 'P1001' };
    const secondError = { errorCode: '40613' };
    const operation = vi
      .fn()
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError)
      .mockResolvedValue('conectado');
    const sleep = vi.fn().mockResolvedValue(undefined);
    const onRetry = vi.fn();

    const result = await retryTransientDatabaseOperation(operation, {
      maxAttempts: 4,
      delaysMs: [5_000, 10_000, 20_000],
      sleep,
      onRetry,
    });

    expect(result).toBe('conectado');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 5_000);
    expect(sleep).toHaveBeenNthCalledWith(2, 10_000);
    expect(onRetry).toHaveBeenNthCalledWith(1, {
      error: firstError,
      failedAttempt: 1,
      nextAttempt: 2,
      delayMs: 5_000,
    });
  });

  it('no reintenta un error que no sea transitorio', async () => {
    const error = new Error('Credenciales inválidas');
    const operation = vi.fn().mockRejectedValue(error);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      retryTransientDatabaseOperation(operation, { sleep })
    ).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('conserva el último error al agotar el máximo de intentos', async () => {
    const errors = [
      { code: 'P1001', attempt: 1 },
      { code: 'P1001', attempt: 2 },
      { code: 'P1001', attempt: 3 },
      { code: 'P1001', attempt: 4 },
    ];
    const operation = vi
      .fn()
      .mockRejectedValueOnce(errors[0])
      .mockRejectedValueOnce(errors[1])
      .mockRejectedValueOnce(errors[2])
      .mockRejectedValueOnce(errors[3]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      retryTransientDatabaseOperation(operation, {
        maxAttempts: 4,
        sleep,
      })
    ).rejects.toBe(errors[3]);

    expect(operation).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([
      ...DEFAULT_RETRY_DELAYS_MS,
    ]);
  });

  it('reutiliza el último intervalo si hay más intentos que intervalos', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce({ code: 'P1001' })
      .mockRejectedValueOnce({ code: 'P1001' })
      .mockResolvedValue('ok');
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      retryTransientDatabaseOperation(operation, {
        maxAttempts: 3,
        delaysMs: [25],
        sleep,
      })
    ).resolves.toBe('ok');

    expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([25, 25]);
  });

  it('rechaza configuraciones que permitirían bucles incorrectos', async () => {
    const operation = vi.fn().mockResolvedValue('no debe ejecutarse');

    await expect(
      retryTransientDatabaseOperation(operation, { maxAttempts: 0 })
    ).rejects.toThrow('maxAttempts');
    await expect(
      retryTransientDatabaseOperation(operation, { delaysMs: [-1] })
    ).rejects.toThrow('tiempos de espera');

    expect(operation).not.toHaveBeenCalled();
  });
});

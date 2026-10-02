const DEFAULT_RETRY_DELAYS_MS = [5_000, 10_000, 20_000] as const;

const TRANSIENT_DATABASE_CODES = new Set([
  'P1001',
  'P1002',
  'P1017',
  '40613',
  '40197',
  '40501',
  '10928',
  '10929',
  '49918',
  '49919',
  '49920',
]);

const TRANSIENT_MESSAGE_PATTERNS = [
  /can't reach database server/i,
  /database(?:\s+['"][^'"]+['"])?\s+is not currently available/i,
  /database is unavailable/i,
  /database(?:\s+['"][^'"]+['"])?\s+is (?:pausing|paused|resuming)/i,
  /server has closed the connection/i,
  /connection (?:attempt )?timed out/i,
  /timed out while connecting/i,
] as const;

type SleepFunction = (delayMs: number) => Promise<void>;

export interface DatabaseRetryEvent {
  error: unknown;
  failedAttempt: number;
  nextAttempt: number;
  delayMs: number;
}

export interface DatabaseRetryOptions {
  maxAttempts?: number;
  delaysMs?: readonly number[];
  sleep?: SleepFunction;
  onRetry?: (event: DatabaseRetryEvent) => void;
}

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });
}

function getStringProperty(
  value: object,
  property: 'code' | 'errorCode' | 'message' | 'name'
): string | null {
  if (!(property in value)) {
    return null;
  }

  const candidate = (value as Record<string, unknown>)[property];
  if (typeof candidate === 'string') {
    return candidate;
  }

  if (typeof candidate === 'number') {
    return String(candidate);
  }

  return null;
}

function getErrorChain(error: unknown): object[] {
  const chain: object[] = [];
  const visited = new Set<object>();
  let current = error;

  while (
    typeof current === 'object' &&
    current !== null &&
    !visited.has(current) &&
    chain.length < 8
  ) {
    visited.add(current);
    chain.push(current);
    current = 'cause' in current ? current.cause : undefined;
  }

  return chain;
}

/**
 * Reconoce errores de conexión que pueden desaparecer cuando Azure SQL
 * termina de reanudar o reconfigurar la base de datos.
 *
 * Un PrismaClientInitializationError no se considera transitorio por su clase
 * solamente: también puede representar credenciales incorrectas (P1000).
 * Por eso se exige un código o mensaje reconocido.
 */
export function isTransientDatabaseError(error: unknown): boolean {
  return getErrorChain(error).some(candidate => {
    const code =
      getStringProperty(candidate, 'code') ??
      getStringProperty(candidate, 'errorCode');
    if (code && TRANSIENT_DATABASE_CODES.has(code.toUpperCase())) {
      return true;
    }

    const message = getStringProperty(candidate, 'message') ?? '';
    if (
      [...TRANSIENT_DATABASE_CODES].some(transientCode =>
        message.includes(transientCode)
      )
    ) {
      return true;
    }

    return TRANSIENT_MESSAGE_PATTERNS.some(pattern => pattern.test(message));
  });
}

function validateOptions(
  maxAttempts: number,
  delaysMs: readonly number[]
): void {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('maxAttempts debe ser un entero mayor o igual que 1.');
  }

  if (
    delaysMs.some(
      delayMs =>
        !Number.isFinite(delayMs) || !Number.isInteger(delayMs) || delayMs < 0
    )
  ) {
    throw new RangeError(
      'Todos los tiempos de espera deben ser enteros no negativos.'
    );
  }
}

function getDelay(delaysMs: readonly number[], failedAttempt: number): number {
  if (delaysMs.length === 0) {
    return 0;
  }

  return delaysMs[Math.min(failedAttempt - 1, delaysMs.length - 1)];
}

/**
 * Repite una operación únicamente cuando falla con un error transitorio.
 *
 * La función devuelve el resultado del primer intento correcto. Si el error no
 * es transitorio o se alcanza el máximo de intentos, vuelve a lanzar el mismo
 * error original para conservar su información de diagnóstico.
 */
export async function retryTransientDatabaseOperation<T>(
  operation: () => Promise<T>,
  options: DatabaseRetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_RETRY_DELAYS_MS.length + 1;
  const delaysMs = options.delaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const sleep = options.sleep ?? defaultSleep;

  validateOptions(maxAttempts, delaysMs);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientDatabaseError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = getDelay(delaysMs, attempt);
      options.onRetry?.({
        error,
        failedAttempt: attempt,
        nextAttempt: attempt + 1,
        delayMs,
      });
      await sleep(delayMs);
    }
  }

  throw new Error('Estado de reintento inalcanzable.');
}

export { DEFAULT_RETRY_DELAYS_MS };

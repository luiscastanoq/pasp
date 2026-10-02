import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchWithAuth,
  isTokenExpiredOrInvalid,
  setAuthErrorHandler,
  setToken,
} from './api';

function createUnsignedToken(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `cabecera.${payload}.firma`;
}

describe('isTokenExpiredOrInvalid', () => {
  afterEach(() => vi.useRealTimers());

  it('acepta un token cuya fecha de expiracion esta en el futuro', () => {
    // Fijar el reloj hace que la prueba sea repetible y no dependa de la hora real.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00.000Z'));
    const futureExpiration = Math.floor(
      new Date('2026-07-13T13:00:00.000Z').getTime() / 1000
    );

    expect(isTokenExpiredOrInvalid(createUnsignedToken(futureExpiration))).toBe(
      false
    );
  });

  it('detecta tokens caducados o mal formados', () => {
    // La aplicacion debe limpiar estas sesiones antes de intentar acceder a una ruta privada.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00.000Z'));
    const pastExpiration = Math.floor(
      new Date('2026-07-13T11:00:00.000Z').getTime() / 1000
    );

    expect(isTokenExpiredOrInvalid(createUnsignedToken(pastExpiration))).toBe(
      true
    );
    expect(isTokenExpiredOrInvalid('token-roto')).toBe(true);
    expect(isTokenExpiredOrInvalid(null)).toBe(true);
  });
});

describe('recuperación de errores autenticados', () => {
  it('avisa globalmente del rechazo demo y conserva el error para el formulario', async () => {
    const notice = vi.fn();
    window.addEventListener('pasp:demo-write-blocked', notice);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'DEMO_READ_ONLY',
            message:
              'Los cambios no se han aplicado porque estás en la versión demo.',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    try {
      await expect(
        fetchWithAuth('/usuarios/4', { method: 'DELETE' })
      ).rejects.toMatchObject({ status: 403 });
      expect(notice).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener('pasp:demo-write-blocked', notice);
    }
  });
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    setAuthErrorHandler(() => undefined);
  });

  it('activa el cierre global de sesión ante un 401', async () => {
    const onAuthError = vi.fn();
    const futureExpiration = Math.floor(Date.now() / 1000) + 3_600;
    setToken(createUnsignedToken(futureExpiration));
    setAuthErrorHandler(onAuthError);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Token inválido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(fetchWithAuth('/privado')).rejects.toMatchObject({
      status: 401,
    });
    expect(onAuthError).toHaveBeenCalledOnce();
  });

  it('conserva la sesión ante errores recuperables del servidor', async () => {
    const onAuthError = vi.fn();
    const futureExpiration = Math.floor(Date.now() / 1000) + 3_600;
    const token = createUnsignedToken(futureExpiration);
    setToken(token);
    setAuthErrorHandler(onAuthError);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Servidor no disponible' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(fetchWithAuth('/privado')).rejects.toMatchObject({
      status: 503,
    });
    expect(onAuthError).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('auth_token')).toBe(token);
  });
});

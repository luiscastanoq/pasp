import { describe, expect, it } from 'vitest';

import {
  normalizeClientIp,
  shouldSkipLoginRateLimit,
} from './rate-limit.middleware';

describe('limitador de intentos de login', () => {
  it('no acumula intentos durante las suites automáticas', () => {
    // Evita que el orden o las repeticiones de E2E produzcan falsos fallos 429.
    expect(process.env.NODE_ENV).toBe('test');
    expect(shouldSkipLoginRateLimit()).toBe(true);
  });

  it('elimina el puerto añadido por el proxy de Azure a una IPv4', () => {
    expect(normalizeClientIp('188.85.211.48:52937')).toBe('188.85.211.48');
  });

  it('conserva una IPv4 que ya está normalizada', () => {
    expect(normalizeClientIp('188.85.211.48')).toBe('188.85.211.48');
  });

  it('conserva IPv6 y elimina el puerto de su formato entre corchetes', () => {
    expect(normalizeClientIp('2001:db8::1')).toBe('2001:db8::1');
    expect(normalizeClientIp('[2001:db8::1]:52937')).toBe('2001:db8::1');
  });
});

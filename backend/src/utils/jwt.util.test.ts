import { describe, expect, it } from 'vitest';

import { generateToken, verifyToken } from './jwt.util';
import type { JwtPayload } from './jwt.util';

describe('jwt.util', () => {
  const payload: JwtPayload = {
    userId: 1,
    email: 'usuario@test.com',
    role: 'admin',
    esSuperAdmin: false,
  };

  it('genera un token y permite verificar su payload', () => {
    const token = generateToken(payload);

    const decoded = verifyToken(token);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
    expect(decoded).toEqual(expect.objectContaining(payload));
  });

  it('lanza un error claro cuando el token es invalido', () => {
    expect(() => verifyToken('token-invalido')).toThrow('Token inválido');
  });
});

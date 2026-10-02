import { describe, expect, it } from 'vitest';

import { comparePassword, hashPassword } from './password.util';

describe('password.util', () => {
  it('hashea una contrasena sin guardarla en texto plano', async () => {
    const password = 'Password123!';

    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(20);
  });

  it('valida la contrasena correcta contra su hash', async () => {
    const password = 'Password123!';
    const hashedPassword = await hashPassword(password);

    const isValid = await comparePassword(password, hashedPassword);

    expect(isValid).toBe(true);
  });

  it('rechaza una contrasena incorrecta contra un hash valido', async () => {
    const hashedPassword = await hashPassword('Password123!');

    const isValid = await comparePassword('OtraPassword123!', hashedPassword);

    expect(isValid).toBe(false);
  });
});

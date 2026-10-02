import { describe, expect, it } from 'vitest';
import { shouldReloadStaleDeployment } from './deploymentRecovery';

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('shouldReloadStaleDeployment', () => {
  it('permite una recarga y bloquea otra inmediata para evitar bucles', () => {
    const storage = createStorage();

    expect(shouldReloadStaleDeployment(storage, 100_000)).toBe(true);
    expect(shouldReloadStaleDeployment(storage, 110_000)).toBe(false);
  });

  it('vuelve a permitir la recuperación después del periodo de seguridad', () => {
    const storage = createStorage();

    expect(shouldReloadStaleDeployment(storage, 100_000)).toBe(true);
    expect(shouldReloadStaleDeployment(storage, 131_000)).toBe(true);
  });
});

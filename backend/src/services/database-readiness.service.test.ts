import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../database/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '../database/prisma';
import { checkDatabaseReadiness } from './database-readiness.service';

describe('checkDatabaseReadiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('termina correctamente cuando SELECT 1 responde', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ ready: 1 }]);

    await expect(checkDatabaseReadiness()).resolves.toBeUndefined();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('conserva el error original para que pueda clasificarse', async () => {
    const error = {
      code: 'P1001',
      message: "Can't reach database server",
    };
    vi.mocked(prisma.$queryRaw).mockRejectedValue(error);

    await expect(checkDatabaseReadiness()).rejects.toBe(error);
  });
});

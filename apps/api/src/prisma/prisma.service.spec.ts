import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.withUser).toBeDefined();
    expect(service.withRole).toBeDefined();
    expect(service.forUser).toBeDefined();
  });

  it('should set local role authenticated and user id in withUser transaction', async () => {
    const mockTx = {
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      $executeRaw: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(service, '$transaction').mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    const result = await service.withUser('usr-test-123', async (tx) => {
      return { success: true, txReceived: Boolean(tx) };
    });

    expect(result).toEqual({ success: true, txReceived: true });
    expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith('SET LOCAL ROLE authenticated;');
    expect(mockTx.$executeRaw).toHaveBeenCalled();
  });

  it('should delegate forUser with object to withUser', async () => {
    const withUserSpy = vi.spyOn(service, 'withUser').mockResolvedValue('ok' as any);
    const cb = vi.fn();

    const res = await service.forUser({ id: 'user-abc' }, cb);

    expect(withUserSpy).toHaveBeenCalledWith('user-abc', cb);
    expect(res).toBe('ok');
  });

  it('should set custom role in withRole', async () => {
    const mockTx = {
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      $executeRaw: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(service, '$transaction').mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    await service.withRole('service_role', undefined, async () => 'done');

    expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith('SET LOCAL ROLE service_role;');
  });
});

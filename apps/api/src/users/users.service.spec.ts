import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    name: 'Leandro Carr',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const mockTx = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expense: {
      deleteMany: vi.fn(),
    },
    category: {
      deleteMany: vi.fn(),
    },
  };

  const mockPrismaService = {
    withUser: vi.fn(async (_userId: string, cb: any) => {
      return cb(mockTx);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile if user exists', async () => {
      const userProfile = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        createdAt: mockUser.createdAt,
      };

      mockTx.user.findUnique.mockResolvedValue(userProfile);

      const result = await service.getProfile('user-123');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
      );
      expect(mockTx.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(userProfile);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user name and avatarUrl under RLS transaction', async () => {
      mockTx.user.findUnique.mockResolvedValue(mockUser);
      mockTx.user.update.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: 'Nuevo Nombre',
        avatarUrl: 'https://new-avatar.jpg',
        createdAt: mockUser.createdAt,
      });

      const dto = {
        name: 'Nuevo Nombre',
        avatarUrl: 'https://new-avatar.jpg',
      };

      const result = await service.updateProfile('user-123', dto);

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
      );
      expect(mockTx.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          name: 'Nuevo Nombre',
          avatarUrl: 'https://new-avatar.jpg',
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      expect(result.name).toBe('Nuevo Nombre');
      expect(result.avatarUrl).toBe('https://new-avatar.jpg');
    });

    it('should update partial profile fields and trim whitespace', async () => {
      mockTx.user.findUnique.mockResolvedValue(mockUser);
      mockTx.user.update.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: 'Nombre Trimmed',
        avatarUrl: mockUser.avatarUrl,
        createdAt: mockUser.createdAt,
      });

      const dto = {
        name: '  Nombre Trimmed  ',
      };

      const result = await service.updateProfile('user-123', dto);

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          name: 'Nombre Trimmed',
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      expect(result.name).toBe('Nombre Trimmed');
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete expenses, categories, and user in GDPR compliant order', async () => {
      mockTx.user.findUnique.mockResolvedValue(mockUser);
      mockTx.expense.deleteMany.mockResolvedValue({ count: 5 });
      mockTx.category.deleteMany.mockResolvedValue({ count: 3 });
      mockTx.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteAccount('user-123');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
      );
      expect(mockTx.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockTx.expense.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(mockTx.category.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(mockTx.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual({
        message: 'Cuenta y datos eliminados permanentemente (GDPR compliant)',
        deletedUserId: 'user-123',
      });
    });

    it('should throw NotFoundException if trying to delete non-existent user', async () => {
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTx.expense.deleteMany).not.toHaveBeenCalled();
      expect(mockTx.category.deleteMany).not.toHaveBeenCalled();
      expect(mockTx.user.delete).not.toHaveBeenCalled();
    });
  });
});

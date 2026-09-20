import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from './gamification.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { ChallengeStatus, TransactionType } from '@prisma/client';

describe('GamificationService', () => {
  let service: GamificationService;

  const mockUser = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    savingStreak: 3,
    lastStreakDate: new Date('2026-09-19T10:00:00.000Z'),
  };

  const mockCategory = {
    id: 'cat-delivery',
    name: 'Delivery y Comida Rápida',
    userId: 'user-123',
  };

  const mockActiveChallenge = {
    id: 'chal-1',
    title: '7 días sin delivery',
    description: 'Cocinar en casa toda la semana',
    targetDays: 7,
    currentStreak: 2,
    bestStreak: 2,
    status: ChallengeStatus.ACTIVE,
    startDate: new Date('2026-09-17T10:00:00.000Z'),
    completedAt: null,
    badgeIcon: 'UtensilsCrossed',
    badgeName: 'Chef Casero',
    targetCategoryId: 'cat-delivery',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCompletedChallenge = {
    id: 'chal-2',
    title: 'Ahorro Extremo Fin de Semana',
    description: 'Gasto 0 en salidas',
    targetDays: 3,
    currentStreak: 3,
    bestStreak: 3,
    status: ChallengeStatus.COMPLETED,
    startDate: new Date('2026-09-10T10:00:00.000Z'),
    completedAt: new Date('2026-09-13T10:00:00.000Z'),
    badgeIcon: 'Shield',
    badgeName: 'Mano de hierro',
    targetCategoryId: null,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTx = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
    challenge: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expense: {
      count: vi.fn(),
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
        GamificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return user saving streak and challenges overview', async () => {
      mockTx.user.findUnique.mockResolvedValue(mockUser);
      mockTx.challenge.findMany.mockResolvedValue([mockActiveChallenge, mockCompletedChallenge]);

      const overview = await service.getOverview('user-123');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith('user-123', expect.any(Function));
      expect(mockTx.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { savingStreak: true, lastStreakDate: true },
      });
      expect(overview.savingStreak).toBe(3);
      expect(overview.activeChallenges).toHaveLength(1);
      expect(overview.completedChallenges).toHaveLength(1);
      expect(overview.badgesEarned).toEqual([
        {
          id: 'chal-2',
          name: 'Mano de hierro',
          icon: 'Shield',
          unlockedAt: mockCompletedChallenge.completedAt,
          challengeTitle: 'Ahorro Extremo Fin de Semana',
        },
      ]);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(service.getOverview('unknown-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createChallenge', () => {
    it('should create a challenge without category successfully', async () => {
      mockTx.challenge.create.mockResolvedValue({
        ...mockActiveChallenge,
        targetCategoryId: null,
      });

      const dto = {
        title: '30 días sin gastos hormiga',
        description: 'No comprar snacks al paso',
        targetDays: 30,
        badgeName: 'Guardián del Bolsillo',
        badgeIcon: 'PiggyBank',
      };

      const result = await service.createChallenge('user-123', dto);

      expect(mockTx.challenge.create).toHaveBeenCalledWith({
        data: {
          title: '30 días sin gastos hormiga',
          description: 'No comprar snacks al paso',
          targetDays: 30,
          badgeName: 'Guardián del Bolsillo',
          badgeIcon: 'PiggyBank',
          targetCategoryId: null,
          status: ChallengeStatus.ACTIVE,
          currentStreak: 0,
          bestStreak: 0,
          userId: 'user-123',
        },
      });
      expect(result).toBeDefined();
    });

    it('should create a challenge with targetCategoryId when category belongs to user', async () => {
      mockTx.category.findFirst.mockResolvedValue(mockCategory);
      mockTx.challenge.create.mockResolvedValue(mockActiveChallenge);

      const dto = {
        title: '7 días sin delivery',
        targetDays: 7,
        targetCategoryId: 'cat-delivery',
      };

      await service.createChallenge('user-123', dto);

      expect(mockTx.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-delivery', userId: 'user-123' },
      });
      expect(mockTx.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            targetCategoryId: 'cat-delivery',
            badgeName: 'Mano de hierro',
            badgeIcon: 'Shield',
          }),
        }),
      );
    });

    it('should throw NotFoundException if targetCategoryId does not exist for user', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);

      await expect(
        service.createChallenge('user-123', {
          title: 'Reto Inválido',
          targetDays: 5,
          targetCategoryId: 'non-existent-cat',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkInStreak', () => {
    const today = new Date('2026-09-20T12:00:00.000Z');

    it('should start streak at 1 if user has never checked in before', async () => {
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 0,
        lastStreakDate: null,
      });
      mockTx.challenge.findMany.mockResolvedValue([]);
      mockTx.user.update.mockResolvedValue({});

      const result = await service.checkInStreak('user-123', today);

      expect(result.alreadyCheckedInToday).toBe(false);
      expect(result.savingStreak).toBe(1);
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          savingStreak: 1,
          lastStreakDate: today,
        },
      });
    });

    it('should increment streak if last streak check-in was yesterday', async () => {
      const yesterday = new Date('2026-09-19T15:00:00.000Z');
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 5,
        lastStreakDate: yesterday,
      });
      mockTx.challenge.findMany.mockResolvedValue([]);
      mockTx.user.update.mockResolvedValue({});

      const result = await service.checkInStreak('user-123', today);

      expect(result.alreadyCheckedInToday).toBe(false);
      expect(result.savingStreak).toBe(6);
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          savingStreak: 6,
          lastStreakDate: today,
        },
      });
    });

    it('should reset streak to 1 if last streak was more than 1 day ago', async () => {
      const threeDaysAgo = new Date('2026-09-17T12:00:00.000Z');
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 10,
        lastStreakDate: threeDaysAgo,
      });
      mockTx.challenge.findMany.mockResolvedValue([]);
      mockTx.user.update.mockResolvedValue({});

      const result = await service.checkInStreak('user-123', today);

      expect(result.alreadyCheckedInToday).toBe(false);
      expect(result.savingStreak).toBe(1);
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          savingStreak: 1,
          lastStreakDate: today,
        },
      });
    });

    it('should not duplicate streak or evaluate challenges if already checked in today', async () => {
      const earlierToday = new Date('2026-09-20T08:00:00.000Z');
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 4,
        lastStreakDate: earlierToday,
      });
      mockTx.challenge.findMany.mockResolvedValue([mockActiveChallenge]);

      const result = await service.checkInStreak('user-123', today);

      expect(result.alreadyCheckedInToday).toBe(true);
      expect(result.savingStreak).toBe(4);
      expect(mockTx.user.update).not.toHaveBeenCalled();
      expect(mockTx.challenge.update).not.toHaveBeenCalled();
    });

    it('should increment challenge streak when target category has no expenses in last 24h', async () => {
      const yesterday = new Date('2026-09-19T10:00:00.000Z');
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 2,
        lastStreakDate: yesterday,
      });
      mockTx.challenge.findMany.mockResolvedValue([mockActiveChallenge]);
      mockTx.expense.count.mockResolvedValue(0);
      mockTx.challenge.update.mockResolvedValue({
        ...mockActiveChallenge,
        currentStreak: 3,
        bestStreak: 3,
      });

      const result = await service.checkInStreak('user-123', today);

      expect(mockTx.expense.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          categoryId: 'cat-delivery',
          type: TransactionType.EXPENSE,
          date: {
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lte: today,
          },
        },
      });
      expect(mockTx.challenge.update).toHaveBeenCalledWith({
        where: { id: 'chal-1' },
        data: {
          currentStreak: 3,
          bestStreak: 3,
          status: ChallengeStatus.ACTIVE,
          completedAt: null,
        },
      });
      expect(result.evaluatedChallengesCount).toBe(1);
    });

    it('should reset challenge streak to 0 if expenses occurred in target category in last 24h', async () => {
      const yesterday = new Date('2026-09-19T10:00:00.000Z');
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 2,
        lastStreakDate: yesterday,
      });
      mockTx.challenge.findMany.mockResolvedValue([mockActiveChallenge]);
      mockTx.expense.count.mockResolvedValue(1); // 1 expense in delivery!
      mockTx.challenge.update.mockResolvedValue({
        ...mockActiveChallenge,
        currentStreak: 0,
      });

      await service.checkInStreak('user-123', today);

      expect(mockTx.challenge.update).toHaveBeenCalledWith({
        where: { id: 'chal-1' },
        data: {
          currentStreak: 0,
          bestStreak: 2,
          status: ChallengeStatus.ACTIVE,
          completedAt: null,
        },
      });
    });

    it('should mark challenge as COMPLETED when currentStreak reaches targetDays', async () => {
      const almostDoneChallenge = {
        ...mockActiveChallenge,
        targetDays: 3,
        currentStreak: 2,
        bestStreak: 2,
      };

      const yesterday = new Date('2026-09-19T10:00:00.000Z');
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 2,
        lastStreakDate: yesterday,
      });
      mockTx.challenge.findMany.mockResolvedValue([almostDoneChallenge]);
      mockTx.expense.count.mockResolvedValue(0);
      mockTx.challenge.update.mockResolvedValue({
        ...almostDoneChallenge,
        currentStreak: 3,
        bestStreak: 3,
        status: ChallengeStatus.COMPLETED,
        completedAt: today,
      });

      await service.checkInStreak('user-123', today);

      expect(mockTx.challenge.update).toHaveBeenCalledWith({
        where: { id: 'chal-1' },
        data: {
          currentStreak: 3,
          bestStreak: 3,
          status: ChallengeStatus.COMPLETED,
          completedAt: today,
        },
      });
    });

    it('should increment general challenge without category regardless of expense categories', async () => {
      const generalChallenge = {
        ...mockActiveChallenge,
        id: 'chal-gen',
        targetCategoryId: null,
        currentStreak: 1,
        bestStreak: 1,
      };

      const yesterday = new Date('2026-09-19T10:00:00.000Z');
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-123',
        savingStreak: 1,
        lastStreakDate: yesterday,
      });
      mockTx.challenge.findMany.mockResolvedValue([generalChallenge]);

      await service.checkInStreak('user-123', today);

      expect(mockTx.expense.count).not.toHaveBeenCalled();
      expect(mockTx.challenge.update).toHaveBeenCalledWith({
        where: { id: 'chal-gen' },
        data: {
          currentStreak: 2,
          bestStreak: 2,
          status: ChallengeStatus.ACTIVE,
          completedAt: null,
        },
      });
    });
  });

  describe('findAllChallenges', () => {
    it('should return all challenges for the user', async () => {
      mockTx.challenge.findMany.mockResolvedValue([mockActiveChallenge, mockCompletedChallenge]);

      const result = await service.findAllChallenges('user-123');

      expect(result).toHaveLength(2);
      expect(mockTx.challenge.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateChallenge', () => {
    it('should update challenge properties', async () => {
      mockTx.challenge.findFirst.mockResolvedValue(mockActiveChallenge);
      mockTx.challenge.update.mockResolvedValue({
        ...mockActiveChallenge,
        title: 'Reto Actualizado',
      });

      const result = await service.updateChallenge('user-123', 'chal-1', {
        title: 'Reto Actualizado',
      });

      expect(mockTx.challenge.update).toHaveBeenCalledWith({
        where: { id: 'chal-1' },
        data: {
          title: 'Reto Actualizado',
        },
      });
      expect(result.title).toBe('Reto Actualizado');
    });

    it('should throw NotFoundException when updating non-existent challenge', async () => {
      mockTx.challenge.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChallenge('user-123', 'non-existent', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when updating with non-existent category', async () => {
      mockTx.challenge.findFirst.mockResolvedValue(mockActiveChallenge);
      mockTx.category.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChallenge('user-123', 'chal-1', {
          targetCategoryId: 'unknown-cat',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeChallenge', () => {
    it('should delete challenge successfully', async () => {
      mockTx.challenge.findFirst.mockResolvedValue(mockActiveChallenge);
      mockTx.challenge.delete.mockResolvedValue(mockActiveChallenge);

      const result = await service.removeChallenge('user-123', 'chal-1');

      expect(mockTx.challenge.delete).toHaveBeenCalledWith({
        where: { id: 'chal-1' },
      });
      expect(result).toEqual({
        message: 'Reto eliminado con éxito',
        id: 'chal-1',
      });
    });

    it('should throw NotFoundException when deleting non-existent challenge', async () => {
      mockTx.challenge.findFirst.mockResolvedValue(null);

      await expect(service.removeChallenge('user-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

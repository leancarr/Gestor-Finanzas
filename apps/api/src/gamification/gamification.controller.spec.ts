import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from './gamification.controller.js';
import { GamificationService } from './gamification.service.js';
import type { AuthUser } from '../auth/auth.interface.js';
import { ChallengeStatus } from '@prisma/client';

describe('GamificationController', () => {
  let controller: GamificationController;
  let service: GamificationService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    role: 'authenticated',
  };

  const mockOverview = {
    savingStreak: 5,
    lastStreakDate: new Date('2026-09-20T10:00:00.000Z'),
    activeChallenges: [
      {
        id: 'chal-1',
        title: '7 días sin delivery',
        targetDays: 7,
        currentStreak: 3,
        bestStreak: 3,
        status: ChallengeStatus.ACTIVE,
      },
    ],
    completedChallenges: [],
    badgesEarned: [],
  };

  const mockChallenge = {
    id: 'chal-1',
    title: '7 días sin delivery',
    description: 'Cocinar en casa toda la semana',
    targetDays: 7,
    currentStreak: 3,
    bestStreak: 3,
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

  const mockCheckInResult = {
    alreadyCheckedInToday: false,
    savingStreak: 6,
    lastStreakDate: new Date('2026-09-20T12:00:00.000Z'),
    evaluatedChallengesCount: 1,
    updatedChallenges: [
      {
        ...mockChallenge,
        currentStreak: 4,
        bestStreak: 4,
      },
    ],
    message: 'Check-in registrado con éxito',
  };

  const mockGamificationService = {
    getOverview: vi.fn().mockResolvedValue(mockOverview),
    findAllChallenges: vi.fn().mockResolvedValue([mockChallenge]),
    createChallenge: vi.fn().mockResolvedValue(mockChallenge),
    checkInStreak: vi.fn().mockResolvedValue(mockCheckInResult),
    updateChallenge: vi.fn().mockResolvedValue(mockChallenge),
    removeChallenge: vi.fn().mockResolvedValue({
      message: 'Reto eliminado con éxito',
      id: 'chal-1',
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
      ],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
    service = module.get<GamificationService>(GamificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should get gamification overview for authenticated user', async () => {
    const result = await controller.getOverview(mockUser);

    expect(mockGamificationService.getOverview).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(mockOverview);
  });

  it('should get all challenges for authenticated user', async () => {
    const result = await controller.findAllChallenges(mockUser);

    expect(mockGamificationService.findAllChallenges).toHaveBeenCalledWith('user-123');
    expect(result).toEqual([mockChallenge]);
  });

  it('should create a challenge for authenticated user', async () => {
    const dto = {
      title: '7 días sin delivery',
      targetDays: 7,
      badgeName: 'Chef Casero',
      badgeIcon: 'UtensilsCrossed',
      targetCategoryId: 'cat-delivery',
    };

    const result = await controller.createChallenge(mockUser, dto);

    expect(mockGamificationService.createChallenge).toHaveBeenCalledWith('user-123', dto);
    expect(result).toEqual(mockChallenge);
  });

  it('should trigger check-in for authenticated user', async () => {
    const result = await controller.checkInStreak(mockUser);

    expect(mockGamificationService.checkInStreak).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(mockCheckInResult);
  });

  it('should update a challenge for authenticated user', async () => {
    const dto = { title: 'Nuevo Título' };
    const result = await controller.updateChallenge(mockUser, 'chal-1', dto);

    expect(mockGamificationService.updateChallenge).toHaveBeenCalledWith('user-123', 'chal-1', dto);
    expect(result).toEqual(mockChallenge);
  });

  it('should remove a challenge for authenticated user', async () => {
    const result = await controller.removeChallenge(mockUser, 'chal-1');

    expect(mockGamificationService.removeChallenge).toHaveBeenCalledWith('user-123', 'chal-1');
    expect(result).toEqual({ message: 'Reto eliminado con éxito', id: 'chal-1' });
  });
});

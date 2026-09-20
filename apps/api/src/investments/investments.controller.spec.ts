import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsController } from './investments.controller.js';
import { InvestmentsService } from './investments.service.js';
import type { AuthUser } from '../auth/auth.interface.js';
import { AssetType } from '@prisma/client';

describe('InvestmentsController', () => {
  let controller: InvestmentsController;
  let service: InvestmentsService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'investor@gestorguita.local',
    role: 'authenticated',
  };

  const mockAsset = {
    id: 'asset-1',
    name: 'Apple Inc.',
    type: AssetType.CEDEAR,
    ticker: 'AAPL',
    quantity: 25,
    purchasePrice: 20000,
    currentPrice: 24650,
    currency: 'ARS',
    institution: 'Balanz',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSummary = {
    totalNetWorthArs: 2500000,
    totalNetWorthUsd: 2118.64,
    totalInvestedArs: 2000000,
    totalInvestedUsd: 1694.92,
    totalProfitLossArs: 500000,
    totalProfitLossUsd: 423.72,
    profitLossPercentage: 25,
    distribution: [
      {
        type: AssetType.CEDEAR,
        totalArs: 2500000,
        totalUsd: 2118.64,
        percentage: 100,
      },
    ],
    rates: {
      usdArs: 1180,
      usdOficial: 1050,
      usdBlue: 1180,
      usdMep: 1150,
      cryptoUsdt: 1200,
      source: 'live',
      lastUpdated: new Date().toISOString(),
    },
  };

  const mockInvestmentsService = {
    create: vi.fn().mockResolvedValue(mockAsset),
    findAll: vi.fn().mockResolvedValue([mockAsset]),
    findOne: vi.fn().mockResolvedValue(mockAsset),
    update: vi.fn().mockResolvedValue(mockAsset),
    remove: vi.fn().mockResolvedValue({ success: true, id: 'asset-1' }),
    getPortfolioSummary: vi.fn().mockResolvedValue(mockSummary),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentsController],
      providers: [
        {
          provide: InvestmentsService,
          useValue: mockInvestmentsService,
        },
      ],
    }).compile();

    controller = module.get<InvestmentsController>(InvestmentsController);
    service = module.get<InvestmentsService>(InvestmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with user id and dto', async () => {
      const dto = {
        name: 'Apple Inc.',
        type: AssetType.CEDEAR,
        ticker: 'AAPL',
        quantity: 25,
        purchasePrice: 20000,
        currentPrice: 24650,
        currency: 'ARS',
      };

      const result = await controller.create(mockUser, dto as any);

      expect(mockInvestmentsService.create).toHaveBeenCalledWith(
        'user-123',
        dto,
      );
      expect(result).toEqual(mockAsset);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with user id and no type filter', async () => {
      const result = await controller.findAll(mockUser, {});

      expect(mockInvestmentsService.findAll).toHaveBeenCalledWith(
        'user-123',
        undefined,
      );
      expect(result).toEqual([mockAsset]);
    });

    it('should call service.findAll with user id and type filter', async () => {
      const result = await controller.findAll(mockUser, {
        type: AssetType.CEDEAR,
      });

      expect(mockInvestmentsService.findAll).toHaveBeenCalledWith(
        'user-123',
        AssetType.CEDEAR,
      );
      expect(result).toEqual([mockAsset]);
    });
  });

  describe('getPortfolioSummary', () => {
    it('should call service.getPortfolioSummary with user id', async () => {
      const result = await controller.getPortfolioSummary(mockUser);

      expect(mockInvestmentsService.getPortfolioSummary).toHaveBeenCalledWith(
        'user-123',
      );
      expect(result).toEqual(mockSummary);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with user id and asset id', async () => {
      const result = await controller.findOne(mockUser, 'asset-1');

      expect(mockInvestmentsService.findOne).toHaveBeenCalledWith(
        'user-123',
        'asset-1',
      );
      expect(result).toEqual(mockAsset);
    });
  });

  describe('update', () => {
    it('should call service.update with user id, asset id and dto', async () => {
      const dto = {
        currentPrice: 26000,
      };

      const result = await controller.update(mockUser, 'asset-1', dto);

      expect(mockInvestmentsService.update).toHaveBeenCalledWith(
        'user-123',
        'asset-1',
        dto,
      );
      expect(result).toEqual(mockAsset);
    });
  });

  describe('remove', () => {
    it('should call service.remove with user id and asset id', async () => {
      const result = await controller.remove(mockUser, 'asset-1');

      expect(mockInvestmentsService.remove).toHaveBeenCalledWith(
        'user-123',
        'asset-1',
      );
      expect(result).toEqual({ success: true, id: 'asset-1' });
    });
  });
});

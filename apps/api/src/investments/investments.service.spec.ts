import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AssetType } from '@prisma/client';
import {
  InvestmentsService,
  calculateAssetValuation,
  round2,
} from './investments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RatesService } from '../rates/rates.service.js';

describe('InvestmentsService', () => {
  let service: InvestmentsService;

  const mockRatesResponse = {
    usd: {
      oficial: { currency: 'USD', name: 'Oficial', buy: 1000, sell: 1050, average: 1025, updatedAt: new Date().toISOString() },
      blue: { currency: 'USD', name: 'Blue', buy: 1160, sell: 1180, average: 1170, updatedAt: new Date().toISOString() },
      mep: { currency: 'USD', name: 'MEP', buy: 1140, sell: 1150, average: 1145, updatedAt: new Date().toISOString() },
      tarjeta: { currency: 'USD', name: 'Tarjeta', buy: 1600, sell: 1650, average: 1625, updatedAt: new Date().toISOString() },
    },
    eur: { currency: 'EUR', name: 'Euro', buy: 1200, sell: 1250, average: 1225, updatedAt: new Date().toISOString() },
    usdt: { currency: 'USDT', name: 'Tether USDT', buy: 1180, sell: 1200, average: 1190, updatedAt: new Date().toISOString() },
    ars: { currency: 'ARS', name: 'Peso Argentino', buy: 1, sell: 1, average: 1, updatedAt: new Date().toISOString() },
    rates: {
      USD_OFICIAL: { currency: 'USD', name: 'Oficial', buy: 1000, sell: 1050, average: 1025, updatedAt: new Date().toISOString() },
      USD_BLUE: { currency: 'USD', name: 'Blue', buy: 1160, sell: 1180, average: 1170, updatedAt: new Date().toISOString() },
      USD_MEP: { currency: 'USD', name: 'MEP', buy: 1140, sell: 1150, average: 1145, updatedAt: new Date().toISOString() },
      USD_TARJETA: { currency: 'USD', name: 'Tarjeta', buy: 1600, sell: 1650, average: 1625, updatedAt: new Date().toISOString() },
      EUR: { currency: 'EUR', name: 'Euro', buy: 1200, sell: 1250, average: 1225, updatedAt: new Date().toISOString() },
      USDT: { currency: 'USDT', name: 'Tether USDT', buy: 1180, sell: 1200, average: 1190, updatedAt: new Date().toISOString() },
      ARS: { currency: 'ARS', name: 'Peso Argentino', buy: 1, sell: 1, average: 1, updatedAt: new Date().toISOString() },
    },
    source: 'live' as const,
    cached: false,
    timestamp: new Date().toISOString(),
  };

  const mockRatesService = {
    getRates: vi.fn().mockResolvedValue(mockRatesResponse),
  };

  const mockTx = {
    asset: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
        InvestmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RatesService,
          useValue: mockRatesService,
        },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAssetValuation helper', () => {
    const rates = {
      usdBlue: 1180,
      usdOficial: 1050,
      cryptoUsdt: 1200,
      eur: 1250,
    };

    it('should correctly value CASH_ARS with 1:1 and no profit/loss', () => {
      const result = calculateAssetValuation(
        {
          type: AssetType.CASH_ARS,
          quantity: 500000,
          currency: 'ARS',
        },
        rates,
      );

      expect(result.currentValArs).toBe(500000);
      expect(result.investedValArs).toBe(500000);
      expect(result.currentValUsd).toBeCloseTo(500000 / 1180, 2);
      expect(result.investedValUsd).toBeCloseTo(500000 / 1180, 2);
    });

    it('should correctly value CASH_USD converting to ARS using usdBlue', () => {
      const result = calculateAssetValuation(
        {
          type: AssetType.CASH_USD,
          quantity: 2000,
          currency: 'USD',
        },
        rates,
      );

      expect(result.currentValUsd).toBe(2000);
      expect(result.investedValUsd).toBe(2000);
      expect(result.currentValArs).toBe(2000 * 1180);
      expect(result.investedValArs).toBe(2000 * 1180);
    });

    it('should correctly value CEDEAR in ARS with purchase and current price', () => {
      const result = calculateAssetValuation(
        {
          type: AssetType.CEDEAR,
          quantity: 10,
          purchasePrice: 20000,
          currentPrice: 25000,
          currency: 'ARS',
        },
        rates,
      );

      expect(result.investedValArs).toBe(200000);
      expect(result.currentValArs).toBe(250000);
      expect(result.investedValUsd).toBeCloseTo(200000 / 1180, 2);
      expect(result.currentValUsd).toBeCloseTo(250000 / 1180, 2);
    });

    it('should correctly value CRYPTO in USD using cryptoUsdt rate for ARS conversion', () => {
      const result = calculateAssetValuation(
        {
          type: AssetType.CRYPTO,
          quantity: 0.5,
          purchasePrice: 60000,
          currentPrice: 70000,
          currency: 'USD',
        },
        rates,
      );

      expect(result.investedValUsd).toBe(30000);
      expect(result.currentValUsd).toBe(35000);
      expect(result.investedValArs).toBe(30000 * 1200);
      expect(result.currentValArs).toBe(35000 * 1200);
    });

    it('should correctly calculate FIXED_TERM projected interest for 30 days', () => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const result = calculateAssetValuation(
        {
          type: AssetType.FIXED_TERM,
          quantity: 100000,
          interestRate: 36.5,
          createdAt: now,
          dueDate: dueDate,
          currency: 'ARS',
        },
        rates,
      );

      // Principal: 100,000 ARS
      // Interest: 100,000 * (36.5 / 100) * (30 / 365) = 3,000 ARS
      // Total value: 103,000 ARS
      expect(result.investedValArs).toBe(100000);
      expect(result.currentValArs).toBeCloseTo(103000, 0);
      expect(result.currentValUsd).toBeCloseTo(103000 / 1180, 2);
    });

    it('should fallback to currentPrice or principal when FIXED_TERM lacks interestRate or dueDate', () => {
      const resultWithCurrentPrice = calculateAssetValuation(
        {
          type: AssetType.FIXED_TERM,
          quantity: 100000,
          currentPrice: 105000,
          currency: 'ARS',
        },
        rates,
      );
      expect(resultWithCurrentPrice.currentValArs).toBe(105000);

      const resultWithoutCurrentPrice = calculateAssetValuation(
        {
          type: AssetType.FIXED_TERM,
          quantity: 100000,
          currency: 'ARS',
        },
        rates,
      );
      expect(resultWithoutCurrentPrice.currentValArs).toBe(100000);
    });

    it('should correctly handle EUR currency conversion', () => {
      const result = calculateAssetValuation(
        {
          type: AssetType.OTHER,
          quantity: 100,
          purchasePrice: 10,
          currentPrice: 12,
          currency: 'EUR',
        },
        rates,
      );

      expect(result.investedValueNative).toBe(1000);
      expect(result.currentValueNative).toBe(1200);
      expect(result.investedValArs).toBe(1000 * 1250);
      expect(result.currentValArs).toBe(1200 * 1250);
    });
  });

  describe('round2 helper', () => {
    it('should correctly round numbers to 2 decimal places', () => {
      expect(round2(123.456)).toBe(123.46);
      expect(round2(100)).toBe(100);
      expect(round2(NaN)).toBe(0);
      expect(round2(Infinity)).toBe(0);
    });
  });

  describe('CRUD Operations', () => {
    const userId = 'user-test-uuid';

    it('should create an asset under RLS transaction', async () => {
      const createDto = {
        name: 'Apple Inc.',
        type: AssetType.CEDEAR,
        ticker: 'AAPL',
        quantity: 25,
        purchasePrice: 20000,
        currentPrice: 24000,
        currency: 'ARS',
        institution: 'Balanz',
      };

      const mockCreated = {
        id: 'asset-1',
        ...createDto,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTx.asset.create.mockResolvedValue(mockCreated);

      const result = await service.create(userId, createDto);

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        userId,
        expect.any(Function),
      );
      expect(mockTx.asset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Apple Inc.',
          type: AssetType.CEDEAR,
          ticker: 'AAPL',
          quantity: 25,
          userId,
        }),
      });
      expect(result).toEqual(mockCreated);
    });

    it('should find all assets without filter', async () => {
      const mockAssets = [
        { id: '1', name: 'Cash', type: AssetType.CASH_ARS, userId },
        { id: '2', name: 'BTC', type: AssetType.CRYPTO, userId },
      ];
      mockTx.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.findAll(userId);

      expect(mockTx.asset.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAssets);
    });

    it('should find all assets filtered by type', async () => {
      const mockAssets = [
        { id: '2', name: 'BTC', type: AssetType.CRYPTO, userId },
      ];
      mockTx.asset.findMany.mockResolvedValue(mockAssets);

      const result = await service.findAll(userId, AssetType.CRYPTO);

      expect(mockTx.asset.findMany).toHaveBeenCalledWith({
        where: { userId, type: AssetType.CRYPTO },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAssets);
    });

    it('should find a single asset by id', async () => {
      const mockAsset = {
        id: 'asset-123',
        name: 'Plazo Fijo',
        type: AssetType.FIXED_TERM,
        userId,
      };
      mockTx.asset.findFirst.mockResolvedValue(mockAsset);

      const result = await service.findOne(userId, 'asset-123');

      expect(mockTx.asset.findFirst).toHaveBeenCalledWith({
        where: { id: 'asset-123', userId },
      });
      expect(result).toEqual(mockAsset);
    });

    it('should throw NotFoundException when finding non-existent asset', async () => {
      mockTx.asset.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update an asset when it exists', async () => {
      const existing = {
        id: 'asset-123',
        name: 'Plazo Fijo',
        type: AssetType.FIXED_TERM,
        userId,
      };
      const updateDto = {
        name: 'Plazo Fijo Renovado',
        currentPrice: 150000,
      };
      const updated = {
        ...existing,
        ...updateDto,
      };

      mockTx.asset.findFirst.mockResolvedValue(existing);
      mockTx.asset.update.mockResolvedValue(updated);

      const result = await service.update(userId, 'asset-123', updateDto);

      expect(mockTx.asset.findFirst).toHaveBeenCalledWith({
        where: { id: 'asset-123', userId },
      });
      expect(mockTx.asset.update).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
        data: expect.objectContaining({
          name: 'Plazo Fijo Renovado',
          currentPrice: 150000,
        }),
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when updating non-existent asset', async () => {
      mockTx.asset.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove an asset when it exists', async () => {
      const existing = {
        id: 'asset-123',
        userId,
      };
      mockTx.asset.findFirst.mockResolvedValue(existing);
      mockTx.asset.delete.mockResolvedValue(existing);

      const result = await service.remove(userId, 'asset-123');

      expect(mockTx.asset.findFirst).toHaveBeenCalledWith({
        where: { id: 'asset-123', userId },
      });
      expect(mockTx.asset.delete).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
      });
      expect(result).toEqual({ success: true, id: 'asset-123' });
    });

    it('should throw NotFoundException when removing non-existent asset', async () => {
      mockTx.asset.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPortfolioSummary', () => {
    const userId = 'user-summary-test';

    it('should return empty summary with 0 values when user has no assets', async () => {
      mockTx.asset.findMany.mockResolvedValue([]);

      const summary = await service.getPortfolioSummary(userId);

      expect(summary.totalNetWorthArs).toBe(0);
      expect(summary.totalNetWorthUsd).toBe(0);
      expect(summary.totalInvestedArs).toBe(0);
      expect(summary.totalInvestedUsd).toBe(0);
      expect(summary.totalProfitLossArs).toBe(0);
      expect(summary.totalProfitLossUsd).toBe(0);
      expect(summary.profitLossPercentage).toBe(0);
      expect(summary.distribution).toEqual([]);
      expect(summary.rates.usdBlue).toBe(1180);
      expect(summary.rates.usdOficial).toBe(1050);
      expect(summary.rates.cryptoUsdt).toBe(1200);
    });

    it('should correctly calculate multi-asset summary, P&L and distribution', async () => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const mockAssets = [
        {
          id: '1',
          name: 'Efectivo Pesos',
          type: AssetType.CASH_ARS,
          quantity: 590000,
          purchasePrice: 1,
          currentPrice: 1,
          currency: 'ARS',
          userId,
          createdAt: now,
        },
        {
          id: '2',
          name: 'Dólar Billete',
          type: AssetType.CASH_USD,
          quantity: 1000,
          purchasePrice: 1,
          currentPrice: 1,
          currency: 'USD',
          userId,
          createdAt: now,
        },
        {
          id: '3',
          name: 'CEDEAR Apple',
          type: AssetType.CEDEAR,
          ticker: 'AAPL',
          quantity: 10,
          purchasePrice: 20000,
          currentPrice: 25000,
          currency: 'ARS',
          userId,
          createdAt: now,
        },
        {
          id: '4',
          name: 'Plazo Fijo',
          type: AssetType.FIXED_TERM,
          quantity: 100000,
          interestRate: 36.5,
          dueDate: dueDate,
          currency: 'ARS',
          userId,
          createdAt: now,
        },
      ];

      mockTx.asset.findMany.mockResolvedValue(mockAssets);

      const summary = await service.getPortfolioSummary(userId);

      // usdBlue: 1180
      // 1. CASH_ARS: 590,000 ARS (invested: 590,000) -> in USD: 500 USD
      // 2. CASH_USD: 1,000 USD -> in ARS: 1,180,000 ARS (invested: 1,180,000 ARS, 1,000 USD)
      // 3. CEDEAR: current 250,000 ARS (invested: 200,000 ARS) -> current USD: 250,000 / 1180 ≈ 211.86 USD
      // 4. FIXED_TERM: current 103,000 ARS (invested: 100,000 ARS) -> current USD: 103,000 / 1180 ≈ 87.29 USD
      // Total current ARS: 590,000 + 1,180,000 + 250,000 + 103,000 = 2,123,000 ARS
      // Total invested ARS: 590,000 + 1,180,000 + 200,000 + 100,000 = 2,070,000 ARS
      // Total profit ARS: 2,123,000 - 2,070,000 = 53,000 ARS

      expect(summary.totalNetWorthArs).toBe(2123000);
      expect(summary.totalInvestedArs).toBe(2070000);
      expect(summary.totalProfitLossArs).toBe(53000);
      expect(summary.totalProfitLossUsd).toBeGreaterThan(0);
      expect(summary.profitLossPercentage).toBeCloseTo((53000 / 2070000) * 100, 2);

      // Verify distribution has 4 asset types
      expect(summary.distribution).toHaveLength(4);
      const types = summary.distribution.map((d) => d.type);
      expect(types).toContain(AssetType.CASH_ARS);
      expect(types).toContain(AssetType.CASH_USD);
      expect(types).toContain(AssetType.CEDEAR);
      expect(types).toContain(AssetType.FIXED_TERM);

      // Check sum of distribution percentages is ~100%
      const totalPct = summary.distribution.reduce((acc, d) => acc + d.percentage, 0);
      expect(totalPct).toBeCloseTo(100, 0);
    });
  });
});

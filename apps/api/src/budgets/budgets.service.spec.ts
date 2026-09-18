import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  BudgetsService,
  calculateBudgetProgress,
} from './budgets.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TransactionType } from '@prisma/client';

describe('BudgetsService', () => {
  let service: BudgetsService;

  const mockCategory = {
    id: 'cat-1',
    name: 'Supermercado',
    icon: 'ShoppingCart',
    color: '#10B981',
    userId: 'user-123',
  };

  const mockBudget = {
    id: 'budget-1',
    amount: 100000,
    currency: 'ARS',
    month: 9,
    year: 2026,
    categoryId: 'cat-1',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
  };

  const mockTx = {
    budget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
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
        BudgetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateBudgetProgress', () => {
    it('should return status OK when percentage is below 80%', () => {
      const result = calculateBudgetProgress(1000, 500);
      expect(result.spentAmount).toBe(500);
      expect(result.percentage).toBe(50);
      expect(result.remaining).toBe(500);
      expect(result.status).toBe('OK');
    });

    it('should return status WARNING when percentage is exactly 80%', () => {
      const result = calculateBudgetProgress(1000, 800);
      expect(result.spentAmount).toBe(800);
      expect(result.percentage).toBe(80);
      expect(result.remaining).toBe(200);
      expect(result.status).toBe('WARNING');
    });

    it('should return status WARNING when percentage is between 80% and 100%', () => {
      const result = calculateBudgetProgress(1000, 950);
      expect(result.spentAmount).toBe(950);
      expect(result.percentage).toBe(95);
      expect(result.remaining).toBe(50);
      expect(result.status).toBe('WARNING');
    });

    it('should return status WARNING when percentage is exactly 100%', () => {
      const result = calculateBudgetProgress(1000, 1000);
      expect(result.spentAmount).toBe(1000);
      expect(result.percentage).toBe(100);
      expect(result.remaining).toBe(0);
      expect(result.status).toBe('WARNING');
    });

    it('should return status EXCEEDED when percentage is greater than 100%', () => {
      const result = calculateBudgetProgress(1000, 1200);
      expect(result.spentAmount).toBe(1200);
      expect(result.percentage).toBe(120);
      expect(result.remaining).toBe(-200);
      expect(result.status).toBe('EXCEEDED');
    });

    it('should handle budgetAmount <= 0 safely without division by zero', () => {
      const result = calculateBudgetProgress(0, 500);
      expect(result.percentage).toBe(0);
      expect(result.status).toBe('OK');
    });
  });

  describe('findAll', () => {
    it('should return enriched budgets with cross-calculated expenses for period', async () => {
      mockTx.budget.findMany.mockResolvedValue([mockBudget]);
      mockTx.expense.findMany.mockResolvedValue([
        { categoryId: 'cat-1', amount: 50000 },
        { categoryId: 'cat-1', amount: 25000 },
      ]);

      const result = await service.findAll('user-123', { month: 9, year: 2026 });

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
      );
      expect(mockTx.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          month: 9,
          year: 2026,
        },
        include: {
          category: true,
        },
        orderBy: {
          amount: 'desc',
        },
      });
      expect(mockTx.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          type: TransactionType.EXPENSE,
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        select: {
          categoryId: true,
          amount: true,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].spentAmount).toBe(75000);
      expect(result[0].percentage).toBe(75);
      expect(result[0].remaining).toBe(25000);
      expect(result[0].status).toBe('OK');
    });

    it('should default to current month and year when query parameters are omitted', async () => {
      mockTx.budget.findMany.mockResolvedValue([]);
      mockTx.expense.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(mockTx.budget.findMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should assign WARNING status when expenses reach 80% or more', async () => {
      mockTx.budget.findMany.mockResolvedValue([mockBudget]);
      mockTx.expense.findMany.mockResolvedValue([
        { categoryId: 'cat-1', amount: 85000 },
      ]);

      const result = await service.findAll('user-123', { month: 9, year: 2026 });

      expect(result[0].spentAmount).toBe(85000);
      expect(result[0].percentage).toBe(85);
      expect(result[0].status).toBe('WARNING');
    });

    it('should assign EXCEEDED status when expenses exceed 100%', async () => {
      mockTx.budget.findMany.mockResolvedValue([mockBudget]);
      mockTx.expense.findMany.mockResolvedValue([
        { categoryId: 'cat-1', amount: 110000 },
      ]);

      const result = await service.findAll('user-123', { month: 9, year: 2026 });

      expect(result[0].spentAmount).toBe(110000);
      expect(result[0].percentage).toBe(110);
      expect(result[0].remaining).toBe(-10000);
      expect(result[0].status).toBe('EXCEEDED');
    });
  });

  describe('findOne', () => {
    it('should return a single enriched budget when found', async () => {
      mockTx.budget.findFirst.mockResolvedValue(mockBudget);
      mockTx.expense.findMany.mockResolvedValue([
        { amount: 40000 },
      ]);

      const result = await service.findOne('user-123', 'budget-1');

      expect(mockTx.budget.findFirst).toHaveBeenCalledWith({
        where: { id: 'budget-1', userId: 'user-123' },
        include: { category: true },
      });
      expect(result.id).toBe('budget-1');
      expect(result.spentAmount).toBe(40000);
      expect(result.percentage).toBe(40);
      expect(result.remaining).toBe(60000);
      expect(result.status).toBe('OK');
    });

    it('should throw NotFoundException if budget is not found', async () => {
      mockTx.budget.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      categoryId: 'cat-1',
      amount: 150000,
      month: 9,
      year: 2026,
      currency: 'ARS',
    };

    it('should create or upsert a budget when category exists and belongs to user', async () => {
      mockTx.category.findFirst.mockResolvedValue(mockCategory);
      mockTx.budget.upsert.mockResolvedValue({
        ...mockBudget,
        amount: 150000,
      });
      mockTx.expense.findMany.mockResolvedValue([]);

      const result = await service.create('user-123', createDto);

      expect(mockTx.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId: 'user-123' },
      });
      expect(mockTx.budget.upsert).toHaveBeenCalledWith({
        where: {
          userId_categoryId_month_year: {
            userId: 'user-123',
            categoryId: 'cat-1',
            month: 9,
            year: 2026,
          },
        },
        create: {
          userId: 'user-123',
          categoryId: 'cat-1',
          amount: 150000,
          month: 9,
          year: 2026,
          currency: 'ARS',
        },
        update: {
          amount: 150000,
          currency: 'ARS',
        },
        include: {
          category: true,
        },
      });
      expect(result.amount).toBe(150000);
      expect(result.spentAmount).toBe(0);
      expect(result.status).toBe('OK');
    });

    it('should throw NotFoundException when category does not exist or belong to user', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);

      await expect(service.create('user-123', createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTx.budget.upsert).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update the budget amount and return enriched object', async () => {
      mockTx.budget.findFirst.mockResolvedValue(mockBudget);
      mockTx.budget.update.mockResolvedValue({
        ...mockBudget,
        amount: 120000,
      });
      mockTx.expense.findMany.mockResolvedValue([{ amount: 60000 }]);

      const result = await service.update('user-123', 'budget-1', {
        amount: 120000,
      });

      expect(mockTx.budget.update).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
        data: { amount: 120000 },
        include: { category: true },
      });
      expect(result.amount).toBe(120000);
      expect(result.spentAmount).toBe(60000);
      expect(result.percentage).toBe(50);
      expect(result.remaining).toBe(60000);
      expect(result.status).toBe('OK');
    });

    it('should throw NotFoundException when updating non-existent budget', async () => {
      mockTx.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'non-existent', { amount: 50000 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a budget successfully', async () => {
      mockTx.budget.findFirst.mockResolvedValue(mockBudget);
      mockTx.budget.delete.mockResolvedValue(mockBudget);

      const result = await service.remove('user-123', 'budget-1');

      expect(mockTx.budget.delete).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
      });
      expect(result).toEqual({
        message: 'Presupuesto eliminado con éxito',
        id: 'budget-1',
      });
    });

    it('should throw NotFoundException when removing non-existent budget', async () => {
      mockTx.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('user-123', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

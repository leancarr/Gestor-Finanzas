import { Test, TestingModule } from '@nestjs/testing';
import {
  ExpensesService,
  calculateDateRanges,
  calculatePercentageChange,
  toISODateString,
  normalizeTags,
} from './expenses.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';

describe('ExpensesService', () => {
  let service: ExpensesService;

  const mockCategory = {
    id: 'cat-1',
    name: 'Supermercado',
    icon: 'ShoppingCart',
    color: '#10B981',
    userId: 'user-123',
  };

  const mockExpense = {
    id: 'exp-1',
    amount: 15400.5,
    currency: 'ARS',
    type: TransactionType.EXPENSE,
    description: 'Compras del mes en Coto',
    date: new Date('2026-09-01T12:00:00.000Z'),
    categoryId: 'cat-1',
    userId: 'user-123',
    exchangeRate: null,
    isTaxable: false,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
  };

  const mockIncome = {
    id: 'inc-1',
    amount: 500000,
    currency: 'ARS',
    type: TransactionType.INCOME,
    description: 'Sueldo Agosto',
    date: new Date('2026-09-01T10:00:00.000Z'),
    categoryId: 'cat-inc',
    userId: 'user-123',
    exchangeRate: null,
    isTaxable: false,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-inc',
      name: 'Salario & Sueldo',
      icon: 'Banknote',
      color: '#10B981',
      userId: 'user-123',
    },
  };

  const mockTx = {
    expense: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
        ExpensesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an expense with category successfully', async () => {
      mockTx.category.findFirst.mockResolvedValue(mockCategory);
      mockTx.expense.create.mockResolvedValue(mockExpense);

      const dto = {
        amount: 15400.5,
        type: TransactionType.EXPENSE,
        description: 'Compras del mes en Coto',
        date: '2026-09-01T12:00:00.000Z',
        categoryId: 'cat-1',
      };

      const result = await service.create('user-123', dto);

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
      );
      expect(mockTx.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId: 'user-123' },
      });
      expect(mockTx.expense.create).toHaveBeenCalledWith({
        data: {
          amount: 15400.5,
          currency: 'ARS',
          exchangeRate: null,
          isTaxable: false,
          type: TransactionType.EXPENSE,
          description: 'Compras del mes en Coto',
          date: new Date('2026-09-01T12:00:00.000Z'),
          categoryId: 'cat-1',
          tags: [],
          userId: 'user-123',
        },
        include: { category: true },
      });
      expect(result).toEqual(mockExpense);
    });

    it('should create an income transaction successfully', async () => {
      mockTx.category.findFirst.mockResolvedValue(mockIncome.category);
      mockTx.expense.create.mockResolvedValue(mockIncome);

      const dto = {
        amount: 500000,
        type: TransactionType.INCOME,
        description: 'Sueldo Agosto',
        categoryId: 'cat-inc',
      };

      const result = await service.create('user-123', dto);

      expect(mockTx.expense.create).toHaveBeenCalledWith({
        data: {
          amount: 500000,
          currency: 'ARS',
          exchangeRate: null,
          isTaxable: false,
          type: TransactionType.INCOME,
          description: 'Sueldo Agosto',
          date: expect.any(Date),
          categoryId: 'cat-inc',
          tags: [],
          userId: 'user-123',
        },
        include: { category: true },
      });
      expect(result).toEqual(mockIncome);
    });

    it('should default to EXPENSE type if type is omitted', async () => {
      mockTx.expense.create.mockResolvedValue(mockExpense);

      const dto = {
        amount: 2500,
        description: 'Café al paso',
      };

      await service.create('user-123', dto);

      expect(mockTx.expense.create).toHaveBeenCalledWith({
        data: {
          amount: 2500,
          currency: 'ARS',
          exchangeRate: null,
          isTaxable: false,
          type: TransactionType.EXPENSE,
          description: 'Café al paso',
          date: expect.any(Date),
          categoryId: null,
          tags: [],
          userId: 'user-123',
        },
        include: { category: true },
      });
    });

    it('should throw NotFoundException if category does not belong to user', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);

      const dto = {
        amount: 5000,
        description: 'Test',
        categoryId: 'non-existent-cat',
      };

      await expect(service.create('user-123', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTx.expense.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all expenses for user', async () => {
      mockTx.expense.findMany.mockResolvedValue([mockExpense]);

      const result = await service.findAll('user-123');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
      );
      expect(mockTx.expense.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: undefined,
        skip: undefined,
        include: { category: true },
      });
      expect(result).toEqual([mockExpense]);
    });

    it('should apply filters for type, category, search and dates', async () => {
      mockTx.expense.findMany.mockResolvedValue([mockExpense]);

      const query = {
        type: TransactionType.EXPENSE,
        categoryId: 'cat-1',
        search: 'coto',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
        limit: 10,
        page: 2,
      };

      await service.findAll('user-123', query);

      expect(mockTx.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          type: TransactionType.EXPENSE,
          categoryId: 'cat-1',
          description: {
            contains: 'coto',
            mode: 'insensitive',
          },
          date: {
            gte: new Date('2026-09-01T00:00:00.000Z'),
            lte: new Date('2026-09-30T23:59:59.999Z'),
          },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        skip: 10,
        include: { category: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return expense by id', async () => {
      mockTx.expense.findFirst.mockResolvedValue(mockExpense);

      const result = await service.findOne('user-123', 'exp-1');

      expect(mockTx.expense.findFirst).toHaveBeenCalledWith({
        where: { id: 'exp-1', userId: 'user-123' },
        include: { category: true },
      });
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException if expense not found', async () => {
      mockTx.expense.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update expense successfully', async () => {
      mockTx.expense.findFirst.mockResolvedValue(mockExpense);
      mockTx.expense.update.mockResolvedValue({
        ...mockExpense,
        amount: 18000,
        type: TransactionType.INCOME,
        description: 'Supermercado Editado',
      });

      const result = await service.update('user-123', 'exp-1', {
        amount: 18000,
        type: TransactionType.INCOME,
        description: 'Supermercado Editado',
      });

      expect(mockTx.expense.update).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
        data: {
          amount: 18000,
          type: TransactionType.INCOME,
          description: 'Supermercado Editado',
        },
        include: { category: true },
      });
      expect(result.amount).toBe(18000);
    });

    it('should throw NotFoundException if updating non-existent expense', async () => {
      mockTx.expense.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'exp-999', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an expense', async () => {
      mockTx.expense.findFirst.mockResolvedValue(mockExpense);
      mockTx.expense.delete.mockResolvedValue(mockExpense);

      const result = await service.remove('user-123', 'exp-1');

      expect(mockTx.expense.delete).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
      });
      expect(result).toEqual({
        message: 'Gasto eliminado con éxito',
        id: 'exp-1',
      });
    });

    it('should throw NotFoundException if deleting non-existent expense', async () => {
      mockTx.expense.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-123', 'exp-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSummary', () => {
    it('should calculate summary with expenses, income, balance and category distribution', async () => {
      const transactionsInMonth = [
        {
          id: 'inc-1',
          amount: 50000,
          currency: 'ARS',
          type: TransactionType.INCOME,
          categoryId: 'cat-inc',
          category: {
            id: 'cat-inc',
            name: 'Salario & Sueldo',
            icon: 'Banknote',
            color: '#10B981',
            userId: 'user-123',
          },
          date: new Date('2026-09-01T12:00:00.000Z'),
        },
        {
          id: 'exp-1',
          amount: 10000,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
          categoryId: 'cat-1',
          category: mockCategory,
          date: new Date('2026-09-05T12:00:00.000Z'),
        },
        {
          id: 'exp-2',
          amount: 5000,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
          categoryId: 'cat-1',
          category: mockCategory,
          date: new Date('2026-09-10T12:00:00.000Z'),
        },
        {
          id: 'exp-3',
          amount: 5000,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
          categoryId: null,
          category: null,
          date: new Date('2026-09-15T12:00:00.000Z'),
        },
      ];

      mockTx.expense.findMany.mockResolvedValue(transactionsInMonth);

      const result = await service.getSummary('user-123', { month: 9, year: 2026 });

      expect(mockPrismaService.withUser).toHaveBeenCalledWith('user-123', expect.any(Function));
      expect(mockTx.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          date: {
            gte: new Date(Date.UTC(2026, 8, 1, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 9, 0, 23, 59, 59, 999)),
          },
        },
        include: { category: true },
        orderBy: { date: 'desc' },
      });

      expect(result.month).toBe(9);
      expect(result.year).toBe(2026);
      expect(result.totalIncome).toBe(50000);
      expect(result.totalExpenses).toBe(20000);
      expect(result.balance).toBe(30000);
      expect(result.totalAmount).toBe(20000);
      expect(result.count).toBe(4);
      expect(result.expensesCount).toBe(3);
      expect(result.incomeCount).toBe(1);
      expect(result.byCategory).toHaveLength(2);
      expect(result.byCategory[0]).toEqual({
        categoryId: 'cat-1',
        categoryName: 'Supermercado',
        icon: 'ShoppingCart',
        color: '#10B981',
        total: 15000,
        count: 2,
        percentage: 75,
      });
      expect(result.byCategory[1]).toEqual({
        categoryId: null,
        categoryName: 'Sin categoría',
        icon: null,
        color: '#64748B',
        total: 5000,
        count: 1,
        percentage: 25,
      });
    });

    it('should handle zero transactions gracefully', async () => {
      mockTx.expense.findMany.mockResolvedValue([]);

      const result = await service.getSummary('user-123', { month: 9, year: 2026 });

      expect(result.totalExpenses).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.count).toBe(0);
      expect(result.expensesCount).toBe(0);
      expect(result.incomeCount).toBe(0);
      expect(result.byCategory).toEqual([]);
    });
  });

  describe('getRecent', () => {
    it('should return recent expenses with default limit of 5', async () => {
      mockTx.expense.findMany.mockResolvedValue([mockExpense]);

      const result = await service.getRecent('user-123');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith('user-123', expect.any(Function));
      expect(mockTx.expense.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        include: { category: true },
      });
      expect(result).toEqual([mockExpense]);
    });

    it('should respect custom limit', async () => {
      mockTx.expense.findMany.mockResolvedValue([mockExpense]);

      await service.getRecent('user-123', 10);

      expect(mockTx.expense.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        include: { category: true },
      });
    });
  });

  describe('calculatePercentageChange', () => {
    it('should return 0 when both values are 0', () => {
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('should return 100 when previous is 0 and current is positive', () => {
      expect(calculatePercentageChange(150, 0)).toBe(100);
    });

    it('should return -100 when previous is 0 and current is negative', () => {
      expect(calculatePercentageChange(-50, 0)).toBe(-100);
    });

    it('should calculate positive percentage increase correctly', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
    });

    it('should calculate negative percentage decrease correctly', () => {
      expect(calculatePercentageChange(60, 100)).toBe(-40);
    });

    it('should handle negative previous balance turning positive safely', () => {
      expect(calculatePercentageChange(50, -100)).toBe(150);
    });

    it('should handle negative previous balance improving while still negative', () => {
      expect(calculatePercentageChange(-40, -100)).toBe(60);
    });

    it('should handle negative previous balance worsening', () => {
      expect(calculatePercentageChange(-150, -100)).toBe(-50);
    });
  });

  describe('calculateDateRanges', () => {
    const fixedNow = new Date('2026-09-18T15:30:00.000Z');

    it('should calculate 7d range correctly (7 days inclusive)', () => {
      const { currentStart, currentEnd, prevStart, prevEnd } = calculateDateRanges('7d', fixedNow);

      expect(toISODateString(currentStart)).toBe('2026-09-12');
      expect(toISODateString(currentEnd)).toBe('2026-09-18');
      expect(toISODateString(prevStart)).toBe('2026-09-05');
      expect(toISODateString(prevEnd)).toBe('2026-09-11');
    });

    it('should calculate 30d range correctly (30 days inclusive)', () => {
      const { currentStart, currentEnd, prevStart, prevEnd } = calculateDateRanges('30d', fixedNow);

      expect(toISODateString(currentStart)).toBe('2026-08-20');
      expect(toISODateString(currentEnd)).toBe('2026-09-18');
      expect(toISODateString(prevStart)).toBe('2026-07-21');
      expect(toISODateString(prevEnd)).toBe('2026-08-19');
    });

    it('should calculate month range correctly for current calendar month and previous', () => {
      const { currentStart, currentEnd, prevStart, prevEnd } = calculateDateRanges('month', fixedNow);

      expect(toISODateString(currentStart)).toBe('2026-09-01');
      expect(toISODateString(currentEnd)).toBe('2026-09-30');
      expect(toISODateString(prevStart)).toBe('2026-08-01');
      expect(toISODateString(prevEnd)).toBe('2026-08-31');
    });

    it('should handle January calendar month rollover to previous year', () => {
      const janDate = new Date('2026-01-15T12:00:00.000Z');
      const { currentStart, currentEnd, prevStart, prevEnd } = calculateDateRanges('month', janDate);

      expect(toISODateString(currentStart)).toBe('2026-01-01');
      expect(toISODateString(currentEnd)).toBe('2026-01-31');
      expect(toISODateString(prevStart)).toBe('2025-12-01');
      expect(toISODateString(prevEnd)).toBe('2025-12-31');
    });
  });

  describe('getAnalytics', () => {
    const fixedNow = new Date('2026-09-18T12:00:00.000Z');

    it('should isolate by userId under RLS context', async () => {
      mockTx.expense.findMany.mockResolvedValue([]);

      await service.getAnalytics('user-rls-test', { range: '7d', currency: 'ARS' }, fixedNow);

      expect(mockPrismaService.withUser).toHaveBeenCalledWith('user-rls-test', expect.any(Function));
    });

    it('should calculate KPIs, timeline and categories for 7d range', async () => {
      const currentExpenses = [
        {
          id: 'exp-1',
          amount: 1000,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
          date: new Date('2026-09-15T10:00:00.000Z'),
          categoryId: 'cat-1',
          category: mockCategory,
        },
        {
          id: 'exp-2',
          amount: 500,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
          date: new Date('2026-09-15T14:00:00.000Z'),
          categoryId: 'cat-2',
          category: {
            id: 'cat-2',
            name: 'Transporte',
            icon: 'Bus',
            color: '#3B82F6',
          },
        },
        {
          id: 'exp-3',
          amount: 600,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
          date: new Date('2026-09-18T09:00:00.000Z'),
          categoryId: null,
          category: null,
        },
        {
          id: 'inc-1',
          amount: 5000,
          currency: 'ARS',
          type: TransactionType.INCOME,
          date: new Date('2026-09-14T08:00:00.000Z'),
          categoryId: null,
          category: null,
        },
      ];

      const prevExpenses = [
        {
          id: 'prev-1',
          amount: 1500,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
        },
        {
          id: 'prev-2',
          amount: 3000,
          currency: 'ARS',
          type: TransactionType.INCOME,
        },
      ];

      mockTx.expense.findMany
        .mockResolvedValueOnce(currentExpenses)
        .mockResolvedValueOnce(prevExpenses);

      const result = await service.getAnalytics(
        'user-123',
        { range: '7d', currency: 'ARS' },
        fixedNow,
      );

      // Verify queries
      expect(mockTx.expense.findMany).toHaveBeenNthCalledWith(1, {
        where: {
          userId: 'user-123',
          currency: 'ARS',
          date: {
            gte: new Date(Date.UTC(2026, 8, 12, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 8, 18, 23, 59, 59, 999)),
          },
        },
        include: { category: true },
        orderBy: { date: 'asc' },
      });

      expect(mockTx.expense.findMany).toHaveBeenNthCalledWith(2, {
        where: {
          userId: 'user-123',
          currency: 'ARS',
          date: {
            gte: new Date(Date.UTC(2026, 8, 5, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 8, 11, 23, 59, 59, 999)),
          },
        },
      });

      // Verify response structure
      expect(result.range).toBe('7d');
      expect(result.currency).toBe('ARS');
      expect(result.startDate).toBe('2026-09-12');
      expect(result.endDate).toBe('2026-09-18');

      // KPIs
      expect(result.kpis.totalExpenses).toBe(2100);
      expect(result.kpis.totalIncome).toBe(5000);
      expect(result.kpis.netBalance).toBe(2900);
      // 2100 / 7 = 300
      expect(result.kpis.averageExpensePerDay).toBe(300);
      expect(result.kpis.transactionCount).toBe(4);

      // Previous period KPIs
      expect(result.kpis.prevTotalExpenses).toBe(1500);
      expect(result.kpis.prevTotalIncome).toBe(3000);
      expect(result.kpis.prevNetBalance).toBe(1500);

      // Variations:
      // expenses: (2100 - 1500) / 1500 * 100 = 40%
      expect(result.kpis.expensesChangePct).toBe(40);
      // income: (5000 - 3000) / 3000 * 100 = 66.67%
      expect(result.kpis.incomeChangePct).toBe(66.67);
      // balance: (2900 - 1500) / 1500 * 100 = 93.33%
      expect(result.kpis.balanceChangePct).toBe(93.33);

      // Timeline must have exactly 7 continuous days
      expect(result.timeline).toHaveLength(7);
      expect(result.timeline.map((t) => t.date)).toEqual([
        '2026-09-12',
        '2026-09-13',
        '2026-09-14',
        '2026-09-15',
        '2026-09-16',
        '2026-09-17',
        '2026-09-18',
      ]);

      // Day with income (2026-09-14)
      const day14 = result.timeline.find((t) => t.date === '2026-09-14');
      expect(day14).toEqual({
        date: '2026-09-14',
        expenses: 0,
        income: 5000,
        balance: 5000,
        count: 1,
      });

      // Day with 2 expenses (2026-09-15)
      const day15 = result.timeline.find((t) => t.date === '2026-09-15');
      expect(day15).toEqual({
        date: '2026-09-15',
        expenses: 1500,
        income: 0,
        balance: -1500,
        count: 2,
      });

      // Day with uncategorized expense (2026-09-18)
      const day18 = result.timeline.find((t) => t.date === '2026-09-18');
      expect(day18).toEqual({
        date: '2026-09-18',
        expenses: 600,
        income: 0,
        balance: -600,
        count: 1,
      });

      // Day with no activity (2026-09-12)
      const day12 = result.timeline.find((t) => t.date === '2026-09-12');
      expect(day12).toEqual({
        date: '2026-09-12',
        expenses: 0,
        income: 0,
        balance: 0,
        count: 0,
      });

      // Category distribution ranking (expenses only, sorted descending)
      expect(result.categoryDistribution).toHaveLength(3);
      // cat-1: 1000 / 2100 = 47.62%
      expect(result.categoryDistribution[0]).toEqual({
        categoryId: 'cat-1',
        categoryName: 'Supermercado',
        color: '#10B981',
        icon: 'ShoppingCart',
        total: 1000,
        percentage: 47.62,
      });
      // uncategorized: 600 / 2100 = 28.57%
      expect(result.categoryDistribution[1]).toEqual({
        categoryId: null,
        categoryName: 'Sin categoría',
        color: '#64748B',
        icon: null,
        total: 600,
        percentage: 28.57,
      });
      // cat-2: 500 / 2100 = 23.81%
      expect(result.categoryDistribution[2]).toEqual({
        categoryId: 'cat-2',
        categoryName: 'Transporte',
        color: '#3B82F6',
        icon: 'Bus',
        total: 500,
        percentage: 23.81,
      });
    });

    it('should handle zero transactions gracefully without NaN or Infinity', async () => {
      mockTx.expense.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getAnalytics(
        'user-123',
        { range: '30d' },
        fixedNow,
      );

      expect(result.range).toBe('30d');
      expect(result.kpis.totalExpenses).toBe(0);
      expect(result.kpis.totalIncome).toBe(0);
      expect(result.kpis.netBalance).toBe(0);
      expect(result.kpis.averageExpensePerDay).toBe(0);
      expect(result.kpis.transactionCount).toBe(0);
      expect(result.kpis.prevTotalExpenses).toBe(0);
      expect(result.kpis.prevTotalIncome).toBe(0);
      expect(result.kpis.prevNetBalance).toBe(0);
      expect(result.kpis.expensesChangePct).toBe(0);
      expect(result.kpis.incomeChangePct).toBe(0);
      expect(result.kpis.balanceChangePct).toBe(0);
      expect(result.timeline).toHaveLength(30);
      expect(result.categoryDistribution).toEqual([]);
    });

    it('should handle custom currency and currency ALL', async () => {
      mockTx.expense.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getAnalytics(
        'user-123',
        { range: 'month', currency: 'USD' },
        fixedNow,
      );

      expect(mockTx.expense.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: expect.objectContaining({
          currency: 'USD',
        }),
      }));

      // Test ALL currency
      mockTx.expense.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getAnalytics(
        'user-123',
        { range: 'month', currency: 'ALL' },
        fixedNow,
      );

      expect(mockTx.expense.findMany).toHaveBeenNthCalledWith(3, {
        where: {
          userId: 'user-123',
          date: {
            gte: new Date(Date.UTC(2026, 8, 1, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 8, 30, 23, 59, 59, 999)),
          },
        },
        include: { category: true },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('normalizeTags (SEI-41)', () => {
    it('should format tags with # prefix and lowercase', () => {
      const result = normalizeTags(['Vacaciones', ' #playa ', 'HOTEL']);
      expect(result).toEqual(['#vacaciones', '#playa', '#hotel']);
    });

    it('should extract hashtags from description and merge without duplicates', () => {
      const result = normalizeTags(['#cena'], 'Cena con amigos #Salidas #cena #FinDeSemana');
      expect(result).toEqual(['#cena', '#salidas', '#findesemana']);
    });

    it('should ignore empty, whitespace-only or single # tags', () => {
      const result = normalizeTags(['', '   ', '#', '#valido']);
      expect(result).toEqual(['#valido']);
    });

    it('should extract tags from description even if tags array is empty or undefined', () => {
      const result = normalizeTags(undefined, 'Gasto de viaje #Brasil #Rio');
      expect(result).toEqual(['#brasil', '#rio']);
    });
  });

  describe('Tags support in create and update (SEI-41)', () => {
    it('should normalize tags and include hashtags from description on create', async () => {
      mockTx.expense.create.mockResolvedValue(mockExpense);

      const dto = {
        amount: 3500,
        description: 'Cena de equipo #after #trabajo',
        tags: ['after', '#CenaEmpresa'],
      };

      await service.create('user-123', dto);

      expect(mockTx.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: ['#after', '#cenaempresa', '#trabajo'],
          }),
        }),
      );
    });

    it('should update tags when provided in update dto', async () => {
      mockTx.expense.findFirst.mockResolvedValue(mockExpense);
      mockTx.expense.update.mockResolvedValue(mockExpense);

      await service.update('user-123', 'exp-1', {
        tags: ['#vacaciones', 'Bariloche'],
      });

      expect(mockTx.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: ['#vacaciones', '#bariloche'],
          }),
        }),
      );
    });

    it('should extract hashtags from new description when updating without tags', async () => {
      mockTx.expense.findFirst.mockResolvedValue({
        ...mockExpense,
        tags: ['#original'],
      });
      mockTx.expense.update.mockResolvedValue(mockExpense);

      await service.update('user-123', 'exp-1', {
        description: 'Nuevo gasto con #evento y #fiesta',
      });

      expect(mockTx.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: ['#original', '#evento', '#fiesta'],
          }),
        }),
      );
    });
  });

  describe('findAll with tag filter (SEI-41)', () => {
    it('should filter by tag with has clause normalizing query tag', async () => {
      mockTx.expense.findMany.mockResolvedValue([mockExpense]);

      await service.findAll('user-123', { tag: 'vacaciones' });

      expect(mockTx.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            tags: {
              has: '#vacaciones',
            },
          }),
        }),
      );
    });

    it('should filter correctly when query tag already includes #', async () => {
      mockTx.expense.findMany.mockResolvedValue([mockExpense]);

      await service.findAll('user-123', { tag: '#viajes' });

      expect(mockTx.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            tags: {
              has: '#viajes',
            },
          }),
        }),
      );
    });
  });

  describe('getTagsSummary (SEI-41)', () => {
    it('should aggregate tagged expenses grouped by unique tags', async () => {
      const taggedExpenses = [
        {
          id: 'exp-1',
          amount: 10000,
          currency: 'ARS',
          tags: ['#viaje', '#bariloche'],
          date: new Date('2026-07-10T10:00:00.000Z'),
        },
        {
          id: 'exp-2',
          amount: 5000,
          currency: 'ARS',
          tags: ['#viaje'],
          date: new Date('2026-07-15T15:00:00.000Z'),
        },
        {
          id: 'exp-3',
          amount: 2000,
          currency: 'ARS',
          tags: ['#bariloche', '#chocolate'],
          date: new Date('2026-07-12T12:00:00.000Z'),
        },
      ];

      mockTx.expense.findMany.mockResolvedValue(taggedExpenses);

      const result = await service.getTagsSummary('user-123');

      expect(mockTx.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          tags: {
            isEmpty: false,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      expect(result).toEqual([
        {
          tag: '#viaje',
          totalAmount: 15000,
          currency: 'ARS',
          count: 2,
          firstDate: '2026-07-10T10:00:00.000Z',
          lastDate: '2026-07-15T15:00:00.000Z',
        },
        {
          tag: '#bariloche',
          totalAmount: 12000,
          currency: 'ARS',
          count: 2,
          firstDate: '2026-07-10T10:00:00.000Z',
          lastDate: '2026-07-12T12:00:00.000Z',
        },
        {
          tag: '#chocolate',
          totalAmount: 2000,
          currency: 'ARS',
          count: 1,
          firstDate: '2026-07-12T12:00:00.000Z',
          lastDate: '2026-07-12T12:00:00.000Z',
        },
      ]);
    });

    it('should return empty array if no expenses have tags', async () => {
      mockTx.expense.findMany.mockResolvedValue([]);

      const result = await service.getTagsSummary('user-123');

      expect(result).toEqual([]);
    });
  });
});


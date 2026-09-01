import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service.js';
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
          type: TransactionType.EXPENSE,
          description: 'Compras del mes en Coto',
          date: new Date('2026-09-01T12:00:00.000Z'),
          categoryId: 'cat-1',
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
          type: TransactionType.INCOME,
          description: 'Sueldo Agosto',
          date: expect.any(Date),
          categoryId: 'cat-inc',
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
          type: TransactionType.EXPENSE,
          description: 'Café al paso',
          date: expect.any(Date),
          categoryId: null,
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
});

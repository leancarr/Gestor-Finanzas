import { Test, TestingModule } from '@nestjs/testing';
import { RecurringService, calculateNextDueDate } from './recurring.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { RecurrenceFrequency, TransactionType } from '@prisma/client';

describe('RecurringService', () => {
  let service: RecurringService;

  const mockRecurring = {
    id: 'rec-1',
    name: 'Spotify Premium',
    amount: 5500.0,
    currency: 'ARS',
    type: TransactionType.EXPENSE,
    frequency: RecurrenceFrequency.MONTHLY,
    dayOfMonth: 15,
    nextDueDate: new Date('2026-09-15T00:00:00.000Z'),
    autoDebit: true,
    isActive: true,
    categoryId: 'cat-1',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      name: 'Entretenimiento',
      icon: 'Music',
      color: '#10B981',
    },
  };

  const mockTx = {
    recurringTransaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expense: {
      create: vi.fn(),
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
        RecurringService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RecurringService>(RecurringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateNextDueDate', () => {
    it('should correctly advance DAILY frequency by 1 day', () => {
      const current = new Date('2026-09-10T12:00:00.000Z');
      const next = calculateNextDueDate(current, RecurrenceFrequency.DAILY);
      expect(next.toISOString()).toBe('2026-09-11T12:00:00.000Z');
    });

    it('should correctly advance WEEKLY frequency by 7 days', () => {
      const current = new Date('2026-09-10T12:00:00.000Z');
      const next = calculateNextDueDate(current, RecurrenceFrequency.WEEKLY);
      expect(next.toISOString()).toBe('2026-09-17T12:00:00.000Z');
    });

    it('should correctly advance MONTHLY frequency by 1 month', () => {
      const current = new Date('2026-09-15T00:00:00.000Z');
      const next = calculateNextDueDate(current, RecurrenceFrequency.MONTHLY, 15);
      expect(next.getUTCFullYear()).toBe(2026);
      expect(next.getUTCMonth()).toBe(9); // October (0-indexed 9)
      expect(next.getUTCDate()).toBe(15);
    });

    it('should cap MONTHLY target day to month end when target month has fewer days (e.g. Jan 31 -> Feb 28)', () => {
      const current = new Date('2026-01-31T00:00:00.000Z');
      const next = calculateNextDueDate(current, RecurrenceFrequency.MONTHLY, 31);
      expect(next.getUTCFullYear()).toBe(2026);
      expect(next.getUTCMonth()).toBe(1); // February
      expect(next.getUTCDate()).toBe(28);
    });

    it('should correctly advance MONTHLY across year boundary (Dec -> Jan)', () => {
      const current = new Date('2026-12-10T00:00:00.000Z');
      const next = calculateNextDueDate(current, RecurrenceFrequency.MONTHLY, 10);
      expect(next.getUTCFullYear()).toBe(2027);
      expect(next.getUTCMonth()).toBe(0); // January
      expect(next.getUTCDate()).toBe(10);
    });

    it('should correctly advance YEARLY frequency by 1 year', () => {
      const current = new Date('2026-03-20T00:00:00.000Z');
      const next = calculateNextDueDate(current, RecurrenceFrequency.YEARLY);
      expect(next.getUTCFullYear()).toBe(2027);
      expect(next.getUTCMonth()).toBe(2); // March
      expect(next.getUTCDate()).toBe(20);
    });

    it('should cap YEARLY from leap day Feb 29 to Feb 28 on non-leap year', () => {
      const current = new Date('2024-02-29T00:00:00.000Z');
      const next = calculateNextDueDate(current, RecurrenceFrequency.YEARLY, 29);
      expect(next.getUTCFullYear()).toBe(2025);
      expect(next.getUTCMonth()).toBe(1); // February
      expect(next.getUTCDate()).toBe(28);
    });
  });

  describe('findAll', () => {
    it('should return active recurring transactions for authenticated user by default', async () => {
      mockTx.recurringTransaction.findMany.mockResolvedValue([mockRecurring]);

      const result = await service.findAll('user-123');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function),
      );
      expect(mockTx.recurringTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isActive: true },
        orderBy: { nextDueDate: 'asc' },
        include: { category: true },
      });
      expect(result).toEqual([mockRecurring]);
    });

    it('should return all recurring transactions including inactive when onlyActive is false', async () => {
      mockTx.recurringTransaction.findMany.mockResolvedValue([mockRecurring]);

      const result = await service.findAll('user-123', false);

      expect(mockTx.recurringTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { nextDueDate: 'asc' },
        include: { category: true },
      });
      expect(result).toEqual([mockRecurring]);
    });
  });

  describe('findOne', () => {
    it('should return a recurring transaction by id', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(mockRecurring);

      const result = await service.findOne('user-123', 'rec-1');

      expect(mockTx.recurringTransaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'rec-1', userId: 'user-123' },
        include: { category: true },
      });
      expect(result).toEqual(mockRecurring);
    });

    it('should throw NotFoundException when recurring transaction is not found', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a recurring transaction successfully', async () => {
      mockTx.category.findFirst.mockResolvedValue({ id: 'cat-1', userId: 'user-123' });
      mockTx.recurringTransaction.create.mockResolvedValue(mockRecurring);

      const dto = {
        name: 'Spotify Premium',
        amount: 5500,
        currency: 'ARS',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 15,
        nextDueDate: '2026-09-15T00:00:00.000Z',
        autoDebit: true,
        categoryId: 'cat-1',
      };

      const result = await service.create('user-123', dto);

      expect(mockTx.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId: 'user-123' },
      });
      expect(mockTx.recurringTransaction.create).toHaveBeenCalledWith({
        data: {
          name: 'Spotify Premium',
          amount: 5500,
          currency: 'ARS',
          type: TransactionType.EXPENSE,
          frequency: RecurrenceFrequency.MONTHLY,
          dayOfMonth: 15,
          nextDueDate: new Date('2026-09-15T00:00:00.000Z'),
          autoDebit: true,
          isActive: true,
          categoryId: 'cat-1',
          userId: 'user-123',
        },
        include: { category: true },
      });
      expect(result).toEqual(mockRecurring);
    });

    it('should throw NotFoundException if category does not belong to user', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);

      const dto = {
        name: 'Spotify Premium',
        amount: 5500,
        frequency: RecurrenceFrequency.MONTHLY,
        nextDueDate: '2026-09-15T00:00:00.000Z',
        categoryId: 'cat-other-user',
      };

      await expect(service.create('user-123', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a recurring transaction', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(mockRecurring);
      mockTx.recurringTransaction.update.mockResolvedValue({
        ...mockRecurring,
        amount: 6000,
        isActive: false,
      });

      const result = await service.update('user-123', 'rec-1', {
        amount: 6000,
        isActive: false,
      });

      expect(mockTx.recurringTransaction.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          amount: 6000,
          isActive: false,
        },
        include: { category: true },
      });
      expect(result.amount).toBe(6000);
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if recurring item not found during update', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'rec-999', { amount: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if updating with invalid categoryId', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(mockRecurring);
      mockTx.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'rec-1', { categoryId: 'invalid-cat' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a recurring transaction successfully', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(mockRecurring);
      mockTx.recurringTransaction.delete.mockResolvedValue(mockRecurring);

      const result = await service.remove('user-123', 'rec-1');

      expect(mockTx.recurringTransaction.delete).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
      });
      expect(result).toEqual({
        message: 'Transacción recurrente eliminada con éxito',
        id: 'rec-1',
      });
    });

    it('should throw NotFoundException if removing non-existent recurring transaction', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-123', 'rec-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('process', () => {
    it('should generate an Expense and advance nextDueDate for the recurring transaction', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(mockRecurring);
      const mockCreatedExpense = {
        id: 'exp-1',
        amount: mockRecurring.amount,
        currency: mockRecurring.currency,
        type: mockRecurring.type,
        description: mockRecurring.name,
        date: new Date(),
        categoryId: mockRecurring.categoryId,
        userId: 'user-123',
      };
      mockTx.expense.create.mockResolvedValue(mockCreatedExpense);

      const expectedNextDueDate = calculateNextDueDate(
        mockRecurring.nextDueDate,
        mockRecurring.frequency,
        mockRecurring.dayOfMonth,
      );

      mockTx.recurringTransaction.update.mockResolvedValue({
        ...mockRecurring,
        nextDueDate: expectedNextDueDate,
      });

      const result = await service.process('user-123', 'rec-1');

      expect(mockTx.expense.create).toHaveBeenCalledWith({
        data: {
          amount: mockRecurring.amount,
          currency: mockRecurring.currency,
          type: mockRecurring.type,
          description: mockRecurring.name,
          date: expect.any(Date),
          categoryId: mockRecurring.categoryId,
          userId: 'user-123',
        },
        include: { category: true },
      });

      expect(mockTx.recurringTransaction.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          nextDueDate: expectedNextDueDate,
        },
        include: { category: true },
      });

      expect(result.expense).toEqual(mockCreatedExpense);
      expect(result.recurring.nextDueDate).toEqual(expectedNextDueDate);
      expect(result.message).toBe('Gasto registrado y fecha de vencimiento actualizada');
    });

    it('should throw NotFoundException when recurring transaction is not found in process', async () => {
      mockTx.recurringTransaction.findFirst.mockResolvedValue(null);

      await expect(service.process('user-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processDue', () => {
    it('should find due recurring items with autoDebit: true and process them in batch', async () => {
      mockTx.recurringTransaction.findMany.mockResolvedValue([mockRecurring]);
      const mockCreatedExpense = {
        id: 'exp-batch-1',
        amount: mockRecurring.amount,
        currency: mockRecurring.currency,
        type: mockRecurring.type,
        description: mockRecurring.name,
        date: new Date(),
        categoryId: mockRecurring.categoryId,
        userId: 'user-123',
      };
      mockTx.expense.create.mockResolvedValue(mockCreatedExpense);

      const nextDate = calculateNextDueDate(
        mockRecurring.nextDueDate,
        mockRecurring.frequency,
        mockRecurring.dayOfMonth,
      );
      mockTx.recurringTransaction.update.mockResolvedValue({
        ...mockRecurring,
        nextDueDate: nextDate,
      });

      const result = await service.processDue('user-123');

      expect(mockTx.recurringTransaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          autoDebit: true,
          nextDueDate: {
            lte: expect.any(Date),
          },
        },
        include: { category: true },
      });

      expect(mockTx.expense.create).toHaveBeenCalled();
      expect(mockTx.recurringTransaction.update).toHaveBeenCalled();
      expect(result.processedCount).toBe(1);
      expect(result.processed[0].expense).toEqual(mockCreatedExpense);
    });

    it('should return 0 processed count when there are no due items', async () => {
      mockTx.recurringTransaction.findMany.mockResolvedValue([]);

      const result = await service.processDue('user-123');

      expect(result.processedCount).toBe(0);
      expect(result.processed).toEqual([]);
      expect(mockTx.expense.create).not.toHaveBeenCalled();
    });
  });
});

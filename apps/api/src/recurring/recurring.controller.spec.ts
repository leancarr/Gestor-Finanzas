import { Test, TestingModule } from '@nestjs/testing';
import { RecurringController } from './recurring.controller.js';
import { RecurringService } from './recurring.service.js';
import type { AuthUser } from '../auth/auth.interface.js';
import { RecurrenceFrequency, TransactionType } from '@prisma/client';

describe('RecurringController', () => {
  let controller: RecurringController;
  let service: RecurringService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    role: 'authenticated',
  };

  const mockRecurring = {
    id: 'rec-1',
    name: 'Netflix',
    amount: 12000,
    currency: 'ARS',
    type: TransactionType.EXPENSE,
    frequency: RecurrenceFrequency.MONTHLY,
    dayOfMonth: 10,
    nextDueDate: new Date('2026-09-10T00:00:00.000Z'),
    autoDebit: true,
    isActive: true,
    categoryId: 'cat-1',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      name: 'Entretenimiento',
      icon: 'Film',
      color: '#E11D48',
    },
  };

  const mockRecurringService = {
    findAll: vi.fn().mockResolvedValue([mockRecurring]),
    findOne: vi.fn().mockResolvedValue(mockRecurring),
    create: vi.fn().mockResolvedValue(mockRecurring),
    update: vi.fn().mockResolvedValue(mockRecurring),
    remove: vi.fn().mockResolvedValue({
      message: 'Transacción recurrente eliminada con éxito',
      id: 'rec-1',
    }),
    process: vi.fn().mockResolvedValue({
      message: 'Gasto registrado y fecha de vencimiento actualizada',
      expense: { id: 'exp-1', amount: 12000 },
      recurring: mockRecurring,
    }),
    processDue: vi.fn().mockResolvedValue({
      message: 'Se procesaron 1 transacciones recurrentes automáticas',
      processedCount: 1,
      processed: [{ expense: { id: 'exp-1' }, recurring: mockRecurring }],
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringController],
      providers: [
        {
          provide: RecurringService,
          useValue: mockRecurringService,
        },
      ],
    }).compile();

    controller = module.get<RecurringController>(RecurringController);
    service = module.get<RecurringService>(RecurringService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with onlyActive = true by default', async () => {
      const result = await controller.findAll(mockUser);

      expect(mockRecurringService.findAll).toHaveBeenCalledWith('user-123', true);
      expect(result).toEqual([mockRecurring]);
    });

    it('should call service.findAll with onlyActive = false when all=true query is passed', async () => {
      const result = await controller.findAll(mockUser, 'true');

      expect(mockRecurringService.findAll).toHaveBeenCalledWith('user-123', false);
      expect(result).toEqual([mockRecurring]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with user id and recurring id', async () => {
      const result = await controller.findOne(mockUser, 'rec-1');

      expect(mockRecurringService.findOne).toHaveBeenCalledWith('user-123', 'rec-1');
      expect(result).toEqual(mockRecurring);
    });
  });

  describe('create', () => {
    it('should call service.create with user id and dto', async () => {
      const dto = {
        name: 'Netflix',
        amount: 12000,
        frequency: RecurrenceFrequency.MONTHLY,
        nextDueDate: '2026-09-10T00:00:00.000Z',
      };

      const result = await controller.create(mockUser, dto as any);

      expect(mockRecurringService.create).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(mockRecurring);
    });
  });

  describe('update', () => {
    it('should call service.update with user id, recurring id and dto', async () => {
      const dto = {
        amount: 13500,
        isActive: false,
      };

      const result = await controller.update(mockUser, 'rec-1', dto);

      expect(mockRecurringService.update).toHaveBeenCalledWith('user-123', 'rec-1', dto);
      expect(result).toEqual(mockRecurring);
    });
  });

  describe('remove', () => {
    it('should call service.remove with user id and recurring id', async () => {
      const result = await controller.remove(mockUser, 'rec-1');

      expect(mockRecurringService.remove).toHaveBeenCalledWith('user-123', 'rec-1');
      expect(result).toEqual({
        message: 'Transacción recurrente eliminada con éxito',
        id: 'rec-1',
      });
    });
  });

  describe('process', () => {
    it('should call service.process with user id and recurring id', async () => {
      const result = await controller.process(mockUser, 'rec-1');

      expect(mockRecurringService.process).toHaveBeenCalledWith('user-123', 'rec-1');
      expect(result.message).toBe('Gasto registrado y fecha de vencimiento actualizada');
      expect(result.expense.id).toBe('exp-1');
    });
  });

  describe('processDue', () => {
    it('should call service.processDue with user id', async () => {
      const result = await controller.processDue(mockUser);

      expect(mockRecurringService.processDue).toHaveBeenCalledWith('user-123');
      expect(result.processedCount).toBe(1);
    });
  });
});

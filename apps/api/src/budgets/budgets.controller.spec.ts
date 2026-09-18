import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller.js';
import { BudgetsService } from './budgets.service.js';
import type { AuthUser } from '../auth/auth.interface.js';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let service: BudgetsService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockEnrichedBudget = {
    id: 'budget-1',
    amount: 100000,
    currency: 'ARS',
    month: 9,
    year: 2026,
    categoryId: 'cat-1',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      name: 'Supermercado',
    },
    spentAmount: 40000,
    percentage: 40,
    remaining: 60000,
    status: 'OK' as const,
  };

  const mockBudgetsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        {
          provide: BudgetsService,
          useValue: mockBudgetsService,
        },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with user id and query filters', async () => {
      mockBudgetsService.findAll.mockResolvedValue([mockEnrichedBudget]);

      const query = { month: 9, year: 2026 };
      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith('user-123', query);
      expect(result).toEqual([mockEnrichedBudget]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with user id and budget id', async () => {
      mockBudgetsService.findOne.mockResolvedValue(mockEnrichedBudget);

      const result = await controller.findOne(mockUser, 'budget-1');

      expect(service.findOne).toHaveBeenCalledWith('user-123', 'budget-1');
      expect(result).toEqual(mockEnrichedBudget);
    });
  });

  describe('create', () => {
    it('should call service.create with user id and dto', async () => {
      const dto = {
        categoryId: 'cat-1',
        amount: 100000,
        month: 9,
        year: 2026,
      };
      mockBudgetsService.create.mockResolvedValue(mockEnrichedBudget);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(mockEnrichedBudget);
    });
  });

  describe('update', () => {
    it('should call service.update with user id, budget id and update dto', async () => {
      const dto = { amount: 150000 };
      const updated = { ...mockEnrichedBudget, amount: 150000 };
      mockBudgetsService.update.mockResolvedValue(updated);

      const result = await controller.update(mockUser, 'budget-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-123', 'budget-1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call service.remove with user id and budget id', async () => {
      const response = { message: 'Presupuesto eliminado con éxito', id: 'budget-1' };
      mockBudgetsService.remove.mockResolvedValue(response);

      const result = await controller.remove(mockUser, 'budget-1');

      expect(service.remove).toHaveBeenCalledWith('user-123', 'budget-1');
      expect(result).toEqual(response);
    });
  });
});

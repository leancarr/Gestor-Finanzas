import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import type { AuthUser } from '../auth/auth.interface.js';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: ExpensesService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    role: 'authenticated',
  };

  const mockExpense = {
    id: 'exp-1',
    amount: 15400.5,
    currency: 'ARS',
    description: 'Compras en Coto',
    date: new Date('2026-09-01T12:00:00.000Z'),
    categoryId: 'cat-1',
    userId: 'user-123',
    exchangeRate: null,
    isTaxable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      name: 'Supermercado',
      icon: 'ShoppingCart',
      color: '#10B981',
      userId: 'user-123',
    },
  };

  const mockSummary = {
    month: 9,
    year: 2026,
    totalAmount: 15400.5,
    count: 1,
    byCategory: [
      {
        categoryId: 'cat-1',
        categoryName: 'Supermercado',
        icon: 'ShoppingCart',
        color: '#10B981',
        total: 15400.5,
        count: 1,
        percentage: 100,
      },
    ],
  };

  const mockExpensesService = {
    findAll: vi.fn().mockResolvedValue([mockExpense]),
    findOne: vi.fn().mockResolvedValue(mockExpense),
    create: vi.fn().mockResolvedValue(mockExpense),
    update: vi.fn().mockResolvedValue(mockExpense),
    remove: vi.fn().mockResolvedValue({ message: 'Gasto eliminado con éxito', id: 'exp-1' }),
    getSummary: vi.fn().mockResolvedValue(mockSummary),
    getRecent: vi.fn().mockResolvedValue([mockExpense]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: mockExpensesService,
        },
      ],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create an expense for authenticated user', async () => {
    const dto = {
      amount: 15400.5,
      description: 'Compras en Coto',
      date: '2026-09-01T12:00:00.000Z',
      categoryId: 'cat-1',
    };

    const result = await controller.create(mockUser, dto);

    expect(mockExpensesService.create).toHaveBeenCalledWith('user-123', dto);
    expect(result).toEqual(mockExpense);
  });

  it('should list all expenses with optional query params', async () => {
    const query = { categoryId: 'cat-1', search: 'coto' };
    const result = await controller.findAll(mockUser, query);

    expect(mockExpensesService.findAll).toHaveBeenCalledWith('user-123', query);
    expect(result).toEqual([mockExpense]);
  });

  it('should get a single expense by id', async () => {
    const result = await controller.findOne(mockUser, 'exp-1');

    expect(mockExpensesService.findOne).toHaveBeenCalledWith('user-123', 'exp-1');
    expect(result).toEqual(mockExpense);
  });

  it('should update an expense', async () => {
    const dto = { amount: 18000 };
    const result = await controller.update(mockUser, 'exp-1', dto);

    expect(mockExpensesService.update).toHaveBeenCalledWith('user-123', 'exp-1', dto);
    expect(result).toEqual(mockExpense);
  });

  it('should get summary for authenticated user', async () => {
    const query = { month: 9, year: 2026 };
    const result = await controller.getSummary(mockUser, query);

    expect(mockExpensesService.getSummary).toHaveBeenCalledWith('user-123', query);
    expect(result).toEqual(mockSummary);
  });

  it('should get recent expenses for authenticated user with default or custom limit', async () => {
    const result = await controller.getRecent(mockUser, '5');

    expect(mockExpensesService.getRecent).toHaveBeenCalledWith('user-123', 5);
    expect(result).toEqual([mockExpense]);
  });

  it('should remove an expense', async () => {
    const result = await controller.remove(mockUser, 'exp-1');

    expect(mockExpensesService.remove).toHaveBeenCalledWith('user-123', 'exp-1');
    expect(result).toEqual({ message: 'Gasto eliminado con éxito', id: 'exp-1' });
  });
});

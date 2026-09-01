import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import type { AuthUser } from '../auth/auth.interface.js';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    role: 'authenticated',
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Supermercado',
    icon: 'ShoppingCart',
    color: '#10B981',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { expenses: 0 },
  };

  const mockCategoriesService = {
    findAll: vi.fn().mockResolvedValue([mockCategory]),
    findOne: vi.fn().mockResolvedValue(mockCategory),
    create: vi.fn().mockResolvedValue(mockCategory),
    update: vi.fn().mockResolvedValue(mockCategory),
    remove: vi.fn().mockResolvedValue({ message: 'Categoría eliminada con éxito', id: 'cat-1' }),
    seedDefaultCategories: vi.fn().mockResolvedValue([mockCategory]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should list all categories for authenticated user', async () => {
    const result = await controller.findAll(mockUser);
    expect(mockCategoriesService.findAll).toHaveBeenCalledWith('user-123', undefined);
    expect(result).toEqual([mockCategory]);
  });

  it('should get a single category by id', async () => {
    const result = await controller.findOne(mockUser, 'cat-1');
    expect(mockCategoriesService.findOne).toHaveBeenCalledWith('user-123', 'cat-1');
    expect(result).toEqual(mockCategory);
  });

  it('should create a category', async () => {
    const dto = { name: 'Supermercado', icon: 'ShoppingCart', color: '#10B981' };
    const result = await controller.create(mockUser, dto);
    expect(mockCategoriesService.create).toHaveBeenCalledWith('user-123', dto);
    expect(result).toEqual(mockCategory);
  });

  it('should update a category', async () => {
    const dto = { name: 'Supermercado Editado' };
    const result = await controller.update(mockUser, 'cat-1', dto);
    expect(mockCategoriesService.update).toHaveBeenCalledWith('user-123', 'cat-1', dto);
    expect(result).toEqual(mockCategory);
  });

  it('should delete a category', async () => {
    const result = await controller.remove(mockUser, 'cat-1');
    expect(mockCategoriesService.remove).toHaveBeenCalledWith('user-123', 'cat-1');
    expect(result).toEqual({ message: 'Categoría eliminada con éxito', id: 'cat-1' });
  });

  it('should seed default categories', async () => {
    const result = await controller.seedDefaults(mockUser);
    expect(mockCategoriesService.seedDefaultCategories).toHaveBeenCalledWith('user-123');
    expect(result).toEqual([mockCategory]);
  });
});

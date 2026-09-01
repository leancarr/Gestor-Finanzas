import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;

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

  const mockTx = {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
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
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories for a user', async () => {
      mockTx.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll('user-123');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith('user-123', expect.any(Function));
      expect(mockTx.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { name: 'asc' },
        include: { _count: { select: { expenses: true } } },
      });
      expect(result).toEqual([mockCategory]);
    });

    it('should filter by search query if provided', async () => {
      mockTx.category.findMany.mockResolvedValue([mockCategory]);

      await service.findAll('user-123', 'super');

      expect(mockTx.category.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          name: {
            contains: 'super',
            mode: 'insensitive',
          },
        },
        orderBy: { name: 'asc' },
        include: { _count: { select: { expenses: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category if found', async () => {
      mockTx.category.findFirst.mockResolvedValue(mockCategory);

      const result = await service.findOne('user-123', 'cat-1');

      expect(mockTx.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId: 'user-123' },
        include: { _count: { select: { expenses: true } } },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new category when no duplicate exists', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);
      mockTx.category.create.mockResolvedValue(mockCategory);

      const dto = {
        name: 'Supermercado',
        icon: 'ShoppingCart',
        color: '#10B981',
      };

      const result = await service.create('user-123', dto);

      expect(mockTx.category.findFirst).toHaveBeenCalled();
      expect(mockTx.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Supermercado',
          icon: 'ShoppingCart',
          color: '#10B981',
          userId: 'user-123',
        },
        include: { _count: { select: { expenses: true } } },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException if duplicate category name exists', async () => {
      mockTx.category.findFirst.mockResolvedValue(mockCategory);

      const dto = {
        name: 'Supermercado',
      };

      await expect(service.create('user-123', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a category if valid', async () => {
      mockTx.category.findFirst
        .mockResolvedValueOnce(mockCategory) // Check existence
        .mockResolvedValueOnce(null); // Check duplicate name
      mockTx.category.update.mockResolvedValue({
        ...mockCategory,
        name: 'Supermercado Nuevo',
      });

      const result = await service.update('user-123', 'cat-1', {
        name: 'Supermercado Nuevo',
      });

      expect(mockTx.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { name: 'Supermercado Nuevo' },
        include: { _count: { select: { expenses: true } } },
      });
      expect(result.name).toBe('Supermercado Nuevo');
    });

    it('should throw NotFoundException if updating non-existent category', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'cat-1', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a category successfully', async () => {
      mockTx.category.findFirst.mockResolvedValue(mockCategory);
      mockTx.category.delete.mockResolvedValue(mockCategory);

      const result = await service.remove('user-123', 'cat-1');

      expect(mockTx.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(result).toEqual({
        message: 'Categoría eliminada con éxito',
        id: 'cat-1',
      });
    });

    it('should throw NotFoundException if removing non-existent category', async () => {
      mockTx.category.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-123', 'cat-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('seedDefaultCategories', () => {
    it('should seed default categories if none exist', async () => {
      mockTx.category.findMany
        .mockResolvedValueOnce([]) // existing categories check
        .mockResolvedValueOnce([mockCategory]); // return list after seeding

      const result = await service.seedDefaultCategories('user-123');

      expect(mockTx.category.createMany).toHaveBeenCalled();
      expect(result).toEqual([mockCategory]);
    });
  });
});

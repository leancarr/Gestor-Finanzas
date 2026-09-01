import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { DEFAULT_CATEGORIES } from './categories.constants.js';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todas las categorías del usuario autenticado bajo contexto RLS.
   */
  async findAll(userId: string, search?: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const whereClause: any = {
        userId,
      };

      if (search && search.trim().length > 0) {
        whereClause.name = {
          contains: search.trim(),
          mode: 'insensitive',
        };
      }

      return tx.category.findMany({
        where: whereClause,
        orderBy: {
          name: 'asc',
        },
        include: {
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });
    });
  }

  /**
   * Obtiene una categoría por su ID verificando la pertenencia al usuario.
   */
  async findOne(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const category = await tx.category.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
      }

      return category;
    });
  }

  /**
   * Crea una nueva categoría para el usuario autenticado.
   */
  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const trimmedName = createCategoryDto.name.trim();

    return this.prisma.withUser(userId, async (tx) => {
      // Verificar si ya existe una categoría con el mismo nombre para este usuario
      const existing = await tx.category.findFirst({
        where: {
          userId,
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${trimmedName}"`,
        );
      }

      return tx.category.create({
        data: {
          name: trimmedName,
          icon: createCategoryDto.icon?.trim() || null,
          color: createCategoryDto.color?.trim() || null,
          userId,
        },
        include: {
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });
    });
  }

  /**
   * Actualiza una categoría existente del usuario autenticado.
   */
  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      // Verificar existencia y propiedad
      const category = await tx.category.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!category) {
        throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
      }

      // Si se actualiza el nombre, verificar que no colisione con otra categoría del usuario
      if (updateCategoryDto.name !== undefined) {
        const trimmedName = updateCategoryDto.name.trim();
        const duplicate = await tx.category.findFirst({
          where: {
            userId,
            name: {
              equals: trimmedName,
              mode: 'insensitive',
            },
            NOT: {
              id,
            },
          },
        });

        if (duplicate) {
          throw new ConflictException(
            `Ya existe otra categoría con el nombre "${trimmedName}"`,
          );
        }
      }

      return tx.category.update({
        where: { id },
        data: {
          ...(updateCategoryDto.name !== undefined
            ? { name: updateCategoryDto.name.trim() }
            : {}),
          ...(updateCategoryDto.icon !== undefined
            ? { icon: updateCategoryDto.icon?.trim() || null }
            : {}),
          ...(updateCategoryDto.color !== undefined
            ? { color: updateCategoryDto.color?.trim() || null }
            : {}),
        },
        include: {
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });
    });
  }

  /**
   * Elimina una categoría del usuario.
   */
  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const category = await tx.category.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!category) {
        throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
      }

      await tx.category.delete({
        where: { id },
      });

      return {
        message: 'Categoría eliminada con éxito',
        id,
      };
    });
  }

  /**
   * Inserta las categorías por defecto para un usuario si aún no existen.
   */
  async seedDefaultCategories(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const existingCategories = await tx.category.findMany({
        where: { userId },
        select: { name: true },
      });

      const existingNames = new Set(
        existingCategories.map((c) => c.name.toLowerCase()),
      );

      const categoriesToCreate = DEFAULT_CATEGORIES.filter(
        (cat) => !existingNames.has(cat.name.toLowerCase()),
      ).map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        userId,
      }));

      if (categoriesToCreate.length > 0) {
        await tx.category.createMany({
          data: categoriesToCreate,
        });
      }

      return tx.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });
    });
  }
}

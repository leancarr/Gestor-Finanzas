import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { QueryExpenseDto } from './dto/query-expense.dto.js';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un nuevo gasto asociado al usuario autenticado bajo contexto RLS.
   */
  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    return this.prisma.withUser(userId, async (tx) => {
      // Si se indicó una categoría, verificar que pertenezca al usuario
      if (createExpenseDto.categoryId) {
        const category = await tx.category.findFirst({
          where: {
            id: createExpenseDto.categoryId,
            userId,
          },
        });

        if (!category) {
          throw new NotFoundException(
            `Categoría con ID ${createExpenseDto.categoryId} no encontrada o no pertenece al usuario`,
          );
        }
      }

      const expenseDate = createExpenseDto.date
        ? new Date(createExpenseDto.date)
        : new Date();

      return tx.expense.create({
        data: {
          amount: createExpenseDto.amount,
          currency: 'ARS',
          description: createExpenseDto.description.trim(),
          date: expenseDate,
          categoryId: createExpenseDto.categoryId || null,
          userId,
        },
        include: {
          category: true,
        },
      });
    });
  }

  /**
   * Obtiene la lista de gastos del usuario autenticado con filtros opcionales.
   */
  async findAll(userId: string, query?: QueryExpenseDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const whereClause: any = {
        userId,
      };

      if (query?.categoryId) {
        whereClause.categoryId = query.categoryId;
      }

      if (query?.search && query.search.trim().length > 0) {
        whereClause.description = {
          contains: query.search.trim(),
          mode: 'insensitive',
        };
      }

      if (query?.startDate || query?.endDate) {
        whereClause.date = {};
        if (query.startDate) {
          whereClause.date.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          whereClause.date.lte = new Date(query.endDate);
        }
      }

      const take = query?.limit ? Number(query.limit) : undefined;
      const skip =
        query?.page && query?.limit
          ? (Number(query.page) - 1) * Number(query.limit)
          : undefined;

      return tx.expense.findMany({
        where: whereClause,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
        include: {
          category: true,
        },
      });
    });
  }

  /**
   * Obtiene el detalle de un gasto específico por ID.
   */
  async findOne(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const expense = await tx.expense.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          category: true,
        },
      });

      if (!expense) {
        throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
      }

      return expense;
    });
  }

  /**
   * Actualiza un gasto existente.
   */
  async update(
    userId: string,
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.expense.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
      }

      if (updateExpenseDto.categoryId) {
        const category = await tx.category.findFirst({
          where: {
            id: updateExpenseDto.categoryId,
            userId,
          },
        });

        if (!category) {
          throw new NotFoundException(
            `Categoría con ID ${updateExpenseDto.categoryId} no encontrada o no pertenece al usuario`,
          );
        }
      }

      return tx.expense.update({
        where: { id },
        data: {
          ...(updateExpenseDto.amount !== undefined
            ? { amount: updateExpenseDto.amount }
            : {}),
          ...(updateExpenseDto.description !== undefined
            ? { description: updateExpenseDto.description.trim() }
            : {}),
          ...(updateExpenseDto.date !== undefined
            ? { date: new Date(updateExpenseDto.date) }
            : {}),
          ...(updateExpenseDto.categoryId !== undefined
            ? { categoryId: updateExpenseDto.categoryId || null }
            : {}),
        },
        include: {
          category: true,
        },
      });
    });
  }

  /**
   * Elimina un gasto del usuario.
   */
  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.expense.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
      }

      await tx.expense.delete({
        where: { id },
      });

      return {
        message: 'Gasto eliminado con éxito',
        id,
      };
    });
  }
}

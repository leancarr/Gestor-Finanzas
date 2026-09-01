import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { QueryExpenseDto } from './dto/query-expense.dto.js';
import { SummaryExpenseDto } from './dto/summary-expense.dto.js';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una nueva transacción (gasto o ingreso) asociada al usuario autenticado bajo contexto RLS.
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

      const transactionType = createExpenseDto.type || TransactionType.EXPENSE;

      return tx.expense.create({
        data: {
          amount: createExpenseDto.amount,
          currency: 'ARS',
          type: transactionType,
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
   * Obtiene la lista de transacciones del usuario autenticado con filtros opcionales.
   */
  async findAll(userId: string, query?: QueryExpenseDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const whereClause: any = {
        userId,
      };

      if (query?.type) {
        whereClause.type = query.type;
      }

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
   * Actualiza una transacción existente.
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
          ...(updateExpenseDto.type !== undefined
            ? { type: updateExpenseDto.type }
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

  /**
   * Obtiene el resumen mensual de finanzas: Total Gastos, Total Ingresos, Balance y distribución por categorías.
   */
  async getSummary(userId: string, query?: SummaryExpenseDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const now = new Date();
      const targetYear = query?.year ? Number(query.year) : now.getUTCFullYear();
      const targetMonth = query?.month ? Number(query.month) : now.getUTCMonth() + 1; // 1-12

      // Start & end dates in UTC
      const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

      const expenses = await tx.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      let totalExpenses = 0;
      let totalIncome = 0;
      let expensesCount = 0;
      let incomeCount = 0;

      // Group expenses by category
      const categoryMap = new Map<
        string,
        {
          categoryId: string | null;
          categoryName: string;
          icon: string | null;
          color: string | null;
          total: number;
          count: number;
        }
      >();

      for (const exp of expenses) {
        const amount = Number(exp.amount);
        const isIncome = exp.type === TransactionType.INCOME;

        if (isIncome) {
          totalIncome += amount;
          incomeCount += 1;
        } else {
          totalExpenses += amount;
          expensesCount += 1;

          const catKey = exp.categoryId || 'uncategorized';
          if (!categoryMap.has(catKey)) {
            categoryMap.set(catKey, {
              categoryId: exp.categoryId || null,
              categoryName: exp.category ? exp.category.name : 'Sin categoría',
              icon: exp.category ? exp.category.icon : null,
              color: exp.category ? exp.category.color : '#64748B',
              total: 0,
              count: 0,
            });
          }

          const catData = categoryMap.get(catKey)!;
          catData.total += amount;
          catData.count += 1;
        }
      }

      const balance = totalIncome - totalExpenses;

      const byCategory = Array.from(categoryMap.values())
        .map((cat) => ({
          ...cat,
          total: Math.round(cat.total * 100) / 100,
          percentage:
            totalExpenses > 0
              ? Math.round((cat.total / totalExpenses) * 10000) / 100
              : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return {
        month: targetMonth,
        year: targetYear,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        totalAmount: Math.round(totalExpenses * 100) / 100,
        count: expenses.length,
        expensesCount,
        incomeCount,
        byCategory,
      };
    });
  }

  /**
   * Obtiene los gastos más recientes del usuario.
   */
  async getRecent(userId: string, limit = 5) {
    return this.prisma.withUser(userId, async (tx) => {
      return tx.expense.findMany({
        where: {
          userId,
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        include: {
          category: true,
        },
      });
    });
  }
}

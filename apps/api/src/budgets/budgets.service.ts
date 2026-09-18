import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { UpdateBudgetDto } from './dto/update-budget.dto.js';
import { QueryBudgetDto } from './dto/query-budget.dto.js';

export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export interface BudgetEnriched {
  id: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  categoryId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  category: any;
  spentAmount: number;
  percentage: number;
  remaining: number;
  status: BudgetStatus;
}

/**
 * Calcula de manera centralizada el progreso y estado de un presupuesto.
 */
export function calculateBudgetProgress(
  budgetAmount: number,
  spentAmount: number,
): {
  spentAmount: number;
  percentage: number;
  remaining: number;
  status: BudgetStatus;
} {
  const roundedSpent = Math.round(spentAmount * 100) / 100;
  const percentage =
    budgetAmount > 0
      ? Math.round((roundedSpent / budgetAmount) * 10000) / 100
      : 0;
  const remaining = Math.round((budgetAmount - roundedSpent) * 100) / 100;

  let status: BudgetStatus = 'OK';
  if (percentage > 100) {
    status = 'EXCEEDED';
  } else if (percentage >= 80) {
    status = 'WARNING';
  }

  return {
    spentAmount: roundedSpent,
    percentage,
    remaining,
    status,
  };
}

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de presupuestos para un mes/año específico, con cálculo cruzado
   * de gastos reales del período para cada categoría asociada.
   */
  async findAll(
    userId: string,
    query?: QueryBudgetDto,
  ): Promise<BudgetEnriched[]> {
    const now = new Date();
    const targetMonth = query?.month ? Number(query.month) : now.getUTCMonth() + 1;
    const targetYear = query?.year ? Number(query.year) : now.getUTCFullYear();

    const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    return this.prisma.withUser(userId, async (tx) => {
      // 1. Obtener presupuestos fijados para el mes y año
      const budgets = await tx.budget.findMany({
        where: {
          userId,
          month: targetMonth,
          year: targetYear,
        },
        include: {
          category: true,
        },
        orderBy: {
          amount: 'desc',
        },
      });

      // 2. Obtener gastos del usuario en ese rango temporal
      const expenses = await tx.expense.findMany({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          categoryId: true,
          amount: true,
        },
      });

      // 3. Agrupar gastos acumulados por categoría
      const spentMap = new Map<string, number>();
      for (const exp of expenses) {
        if (exp.categoryId) {
          spentMap.set(
            exp.categoryId,
            (spentMap.get(exp.categoryId) || 0) + Number(exp.amount),
          );
        }
      }

      // 4. Enriquecer cada presupuesto con las métricas calculadas
      return budgets.map((b) => {
        const budgetAmount = Number(b.amount);
        const rawSpent = spentMap.get(b.categoryId) || 0;
        const progress = calculateBudgetProgress(budgetAmount, rawSpent);

        return {
          id: b.id,
          amount: budgetAmount,
          currency: b.currency,
          month: b.month,
          year: b.year,
          categoryId: b.categoryId,
          userId: b.userId,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          category: b.category,
          spentAmount: progress.spentAmount,
          percentage: progress.percentage,
          remaining: progress.remaining,
          status: progress.status,
        };
      });
    });
  }

  /**
   * Obtiene un presupuesto individual por su ID con su cálculo cruzado de gastos.
   */
  async findOne(userId: string, id: string): Promise<BudgetEnriched> {
    return this.prisma.withUser(userId, async (tx) => {
      const budget = await tx.budget.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          category: true,
        },
      });

      if (!budget) {
        throw new NotFoundException(`Presupuesto con ID ${id} no encontrado`);
      }

      const startDate = new Date(Date.UTC(budget.year, budget.month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(budget.year, budget.month, 0, 23, 59, 59, 999));

      const expenses = await tx.expense.findMany({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
        },
      });

      const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const budgetAmount = Number(budget.amount);
      const progress = calculateBudgetProgress(budgetAmount, totalSpent);

      return {
        id: budget.id,
        amount: budgetAmount,
        currency: budget.currency,
        month: budget.month,
        year: budget.year,
        categoryId: budget.categoryId,
        userId: budget.userId,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        category: budget.category,
        spentAmount: progress.spentAmount,
        percentage: progress.percentage,
        remaining: progress.remaining,
        status: progress.status,
      };
    });
  }

  /**
   * Crea o actualiza (upsert) un presupuesto para una categoría en determinado mes/año.
   */
  async create(userId: string, createBudgetDto: CreateBudgetDto): Promise<BudgetEnriched> {
    return this.prisma.withUser(userId, async (tx) => {
      // Verificar que la categoría exista y pertenezca al usuario
      const category = await tx.category.findFirst({
        where: {
          id: createBudgetDto.categoryId,
          userId,
        },
      });

      if (!category) {
        throw new NotFoundException(
          `Categoría con ID ${createBudgetDto.categoryId} no encontrada o no pertenece al usuario`,
        );
      }

      const currency = createBudgetDto.currency
        ? createBudgetDto.currency.toUpperCase().trim()
        : 'ARS';

      const budget = await tx.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId: createBudgetDto.categoryId,
            month: createBudgetDto.month,
            year: createBudgetDto.year,
          },
        },
        create: {
          userId,
          categoryId: createBudgetDto.categoryId,
          amount: createBudgetDto.amount,
          month: createBudgetDto.month,
          year: createBudgetDto.year,
          currency,
        },
        update: {
          amount: createBudgetDto.amount,
          currency,
        },
        include: {
          category: true,
        },
      });

      // Calcular consumo actual para retornar objeto enriquecido
      const startDate = new Date(Date.UTC(budget.year, budget.month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(budget.year, budget.month, 0, 23, 59, 59, 999));

      const expenses = await tx.expense.findMany({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
        },
      });

      const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const budgetAmount = Number(budget.amount);
      const progress = calculateBudgetProgress(budgetAmount, totalSpent);

      return {
        id: budget.id,
        amount: budgetAmount,
        currency: budget.currency,
        month: budget.month,
        year: budget.year,
        categoryId: budget.categoryId,
        userId: budget.userId,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        category: budget.category,
        spentAmount: progress.spentAmount,
        percentage: progress.percentage,
        remaining: progress.remaining,
        status: progress.status,
      };
    });
  }

  /**
   * Actualiza el monto presupuestado y/o moneda de un registro existente.
   */
  async update(
    userId: string,
    id: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<BudgetEnriched> {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.budget.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Presupuesto con ID ${id} no encontrado`);
      }

      const updated = await tx.budget.update({
        where: { id },
        data: {
          ...(updateBudgetDto.amount !== undefined
            ? { amount: updateBudgetDto.amount }
            : {}),
          ...(updateBudgetDto.currency !== undefined
            ? { currency: updateBudgetDto.currency.toUpperCase().trim() }
            : {}),
        },
        include: {
          category: true,
        },
      });

      const startDate = new Date(Date.UTC(updated.year, updated.month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(updated.year, updated.month, 0, 23, 59, 59, 999));

      const expenses = await tx.expense.findMany({
        where: {
          userId,
          categoryId: updated.categoryId,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
        },
      });

      const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const budgetAmount = Number(updated.amount);
      const progress = calculateBudgetProgress(budgetAmount, totalSpent);

      return {
        id: updated.id,
        amount: budgetAmount,
        currency: updated.currency,
        month: updated.month,
        year: updated.year,
        categoryId: updated.categoryId,
        userId: updated.userId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        category: updated.category,
        spentAmount: progress.spentAmount,
        percentage: progress.percentage,
        remaining: progress.remaining,
        status: progress.status,
      };
    });
  }

  /**
   * Elimina un presupuesto.
   */
  async remove(userId: string, id: string): Promise<{ message: string; id: string }> {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.budget.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Presupuesto con ID ${id} no encontrado`);
      }

      await tx.budget.delete({
        where: { id },
      });

      return {
        message: 'Presupuesto eliminado con éxito',
        id,
      };
    });
  }
}

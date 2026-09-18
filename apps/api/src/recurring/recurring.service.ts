import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { TransactionType, RecurrenceFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRecurringDto } from './dto/create-recurring.dto.js';
import { UpdateRecurringDto } from './dto/update-recurring.dto.js';

/**
 * Calcula la próxima fecha de vencimiento según la frecuencia y el día del mes especificado.
 */
export function calculateNextDueDate(
  currentDueDate: Date,
  frequency: RecurrenceFrequency,
  dayOfMonth?: number | null,
): Date {
  const next = new Date(currentDueDate);

  switch (frequency) {
    case RecurrenceFrequency.DAILY: {
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    }
    case RecurrenceFrequency.WEEKLY: {
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    }
    case RecurrenceFrequency.MONTHLY: {
      const currentYear = next.getUTCFullYear();
      const currentMonth = next.getUTCMonth();
      const targetMonth = currentMonth + 1;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;

      const targetDay =
        dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31
          ? dayOfMonth
          : next.getUTCDate();

      // Días totales del mes destino (día 0 del mes siguiente)
      const daysInTargetMonth = new Date(
        Date.UTC(targetYear, normalizedMonth + 1, 0),
      ).getUTCDate();
      const actualDay = Math.min(targetDay, daysInTargetMonth);

      next.setUTCFullYear(targetYear, normalizedMonth, actualDay);
      break;
    }
    case RecurrenceFrequency.YEARLY: {
      const targetYear = next.getUTCFullYear() + 1;
      const targetMonth = next.getUTCMonth();
      const targetDay =
        dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31
          ? dayOfMonth
          : next.getUTCDate();

      const daysInTargetMonth = new Date(
        Date.UTC(targetYear, targetMonth + 1, 0),
      ).getUTCDate();
      const actualDay = Math.min(targetDay, daysInTargetMonth);

      next.setUTCFullYear(targetYear, targetMonth, actualDay);
      break;
    }
  }

  return next;
}

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de transacciones recurrentes del usuario ordenadas por nextDueDate ascendente.
   * Por defecto filtra solo las activas a menos que onlyActive sea false.
   */
  async findAll(userId: string, onlyActive = true) {
    return this.prisma.withUser(userId, async (tx) => {
      return tx.recurringTransaction.findMany({
        where: {
          userId,
          ...(onlyActive ? { isActive: true } : {}),
        },
        orderBy: {
          nextDueDate: 'asc',
        },
        include: {
          category: true,
        },
      });
    });
  }

  /**
   * Obtiene el detalle de una recurrencia puntual por ID.
   */
  async findOne(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const recurring = await tx.recurringTransaction.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          category: true,
        },
      });

      if (!recurring) {
        throw new NotFoundException(
          `Transacción recurrente con ID ${id} no encontrada`,
        );
      }

      return recurring;
    });
  }

  /**
   * Registra una nueva transacción recurrente bajo contexto RLS.
   */
  async create(userId: string, dto: CreateRecurringDto) {
    return this.prisma.withUser(userId, async (tx) => {
      if (dto.categoryId) {
        const category = await tx.category.findFirst({
          where: {
            id: dto.categoryId,
            userId,
          },
        });

        if (!category) {
          throw new NotFoundException(
            `Categoría con ID ${dto.categoryId} no encontrada o no pertenece al usuario`,
          );
        }
      }

      const nextDueDate = new Date(dto.nextDueDate);
      const dayOfMonth =
        dto.dayOfMonth ??
        (dto.frequency === RecurrenceFrequency.MONTHLY
          ? nextDueDate.getUTCDate()
          : null);

      return tx.recurringTransaction.create({
        data: {
          name: dto.name.trim(),
          amount: dto.amount,
          currency: dto.currency ? dto.currency.toUpperCase() : 'ARS',
          type: dto.type || TransactionType.EXPENSE,
          frequency: dto.frequency,
          dayOfMonth,
          nextDueDate,
          autoDebit: dto.autoDebit !== undefined ? dto.autoDebit : true,
          isActive: true,
          categoryId: dto.categoryId || null,
          userId,
        },
        include: {
          category: true,
        },
      });
    });
  }

  /**
   * Actualiza datos o alterna el estado activo de una recurrencia.
   */
  async update(userId: string, id: string, dto: UpdateRecurringDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.recurringTransaction.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(
          `Transacción recurrente con ID ${id} no encontrada`,
        );
      }

      if (dto.categoryId) {
        const category = await tx.category.findFirst({
          where: {
            id: dto.categoryId,
            userId,
          },
        });

        if (!category) {
          throw new NotFoundException(
            `Categoría con ID ${dto.categoryId} no encontrada o no pertenece al usuario`,
          );
        }
      }

      return tx.recurringTransaction.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
          ...(dto.currency !== undefined
            ? { currency: dto.currency.toUpperCase() }
            : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
          ...(dto.dayOfMonth !== undefined
            ? { dayOfMonth: dto.dayOfMonth }
            : {}),
          ...(dto.nextDueDate !== undefined
            ? { nextDueDate: new Date(dto.nextDueDate) }
            : {}),
          ...(dto.autoDebit !== undefined ? { autoDebit: dto.autoDebit } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId || null }
            : {}),
        },
        include: {
          category: true,
        },
      });
    });
  }

  /**
   * Elimina una transacción recurrente del usuario.
   */
  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.recurringTransaction.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(
          `Transacción recurrente con ID ${id} no encontrada`,
        );
      }

      await tx.recurringTransaction.delete({
        where: { id },
      });

      return {
        message: 'Transacción recurrente eliminada con éxito',
        id,
      };
    });
  }

  /**
   * Genera un gasto Expense en la base de datos con los datos actuales y fecha de hoy,
   * y recalcula y avanza la nextDueDate según la frecuencia.
   */
  async process(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const recurring = await tx.recurringTransaction.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          category: true,
        },
      });

      if (!recurring) {
        throw new NotFoundException(
          `Transacción recurrente con ID ${id} no encontrada`,
        );
      }

      const now = new Date();

      // 1. Crear gasto asociado
      const expense = await tx.expense.create({
        data: {
          amount: recurring.amount,
          currency: recurring.currency,
          type: recurring.type,
          description: recurring.name,
          date: now,
          categoryId: recurring.categoryId,
          userId,
        },
        include: {
          category: true,
        },
      });

      // 2. Avanzar fecha de vencimiento según la frecuencia
      const newDueDate = calculateNextDueDate(
        recurring.nextDueDate,
        recurring.frequency,
        recurring.dayOfMonth,
      );

      const updatedRecurring = await tx.recurringTransaction.update({
        where: { id },
        data: {
          nextDueDate: newDueDate,
        },
        include: {
          category: true,
        },
      });

      this.logger.log(
        `Recurrencia ${id} (${recurring.name}) procesada. Gasto ${expense.id} creado. Próximo vencimiento: ${newDueDate.toISOString()}`,
      );

      return {
        message: 'Gasto registrado y fecha de vencimiento actualizada',
        expense,
        recurring: updatedRecurring,
      };
    });
  }

  /**
   * Busca todas las recurrencias del usuario con autoDebit: true y nextDueDate <= now,
   * genera los Expense correspondientes y actualiza las fechas de vencimiento.
   */
  async processDue(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const now = new Date();

      const dueItems = await tx.recurringTransaction.findMany({
        where: {
          userId,
          isActive: true,
          autoDebit: true,
          nextDueDate: {
            lte: now,
          },
        },
        include: {
          category: true,
        },
      });

      const processed: Array<{
        expense: any;
        recurring: any;
      }> = [];

      for (const item of dueItems) {
        const expense = await tx.expense.create({
          data: {
            amount: item.amount,
            currency: item.currency,
            type: item.type,
            description: item.name,
            date: now,
            categoryId: item.categoryId,
            userId,
          },
          include: {
            category: true,
          },
        });

        const nextDueDate = calculateNextDueDate(
          item.nextDueDate,
          item.frequency,
          item.dayOfMonth,
        );

        const updatedRecurring = await tx.recurringTransaction.update({
          where: { id: item.id },
          data: {
            nextDueDate,
          },
          include: {
            category: true,
          },
        });

        processed.push({
          expense,
          recurring: updatedRecurring,
        });
      }

      this.logger.log(
        `Se procesaron ${processed.length} débitos automáticos vencidos para el usuario ${userId}`,
      );

      return {
        message: `Se procesaron ${processed.length} transacciones recurrentes automáticas`,
        processedCount: processed.length,
        processed,
      };
    });
  }
}

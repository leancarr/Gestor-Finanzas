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
import { QueryAnalyticsDto } from './dto/query-analytics.dto.js';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * Formatea un objeto Date en cadena ISO 'YYYY-MM-DD' en tiempo UTC.
 */
export function toISODateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula la variación porcentual entre dos valores con protección ante división por cero
 * y tratamiento seguro para saldos negativos.
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(change * 100) / 100;
}

/**
 * Calcula los límites de fecha (actual y anterior equivalente) en UTC para '7d', '30d' o 'month'.
 */
export function calculateDateRanges(
  range: '7d' | '30d' | 'month',
  now: Date = new Date(),
): {
  currentStart: Date;
  currentEnd: Date;
  prevStart: Date;
  prevEnd: Date;
} {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  if (range === '7d') {
    const currentEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    const currentStart = new Date(Date.UTC(year, month, day - 6, 0, 0, 0, 0));
    const prevEnd = new Date(Date.UTC(year, month, day - 7, 23, 59, 59, 999));
    const prevStart = new Date(Date.UTC(year, month, day - 13, 0, 0, 0, 0));
    return { currentStart, currentEnd, prevStart, prevEnd };
  }

  if (range === 'month') {
    const currentStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const currentEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    const prevStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const prevEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { currentStart, currentEnd, prevStart, prevEnd };
  }

  // Default: '30d'
  const currentEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  const currentStart = new Date(Date.UTC(year, month, day - 29, 0, 0, 0, 0));
  const prevEnd = new Date(Date.UTC(year, month, day - 30, 23, 59, 59, 999));
  const prevStart = new Date(Date.UTC(year, month, day - 59, 0, 0, 0, 0));
  return { currentStart, currentEnd, prevStart, prevEnd };
}

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
          currency: createExpenseDto.currency ? createExpenseDto.currency.toUpperCase() : 'ARS',
          exchangeRate: createExpenseDto.exchangeRate ?? null,
          isTaxable: createExpenseDto.isTaxable ?? false,
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
          ...(updateExpenseDto.currency !== undefined
            ? { currency: updateExpenseDto.currency.toUpperCase() }
            : {}),
          ...(updateExpenseDto.exchangeRate !== undefined
            ? { exchangeRate: updateExpenseDto.exchangeRate }
            : {}),
          ...(updateExpenseDto.isTaxable !== undefined
            ? { isTaxable: updateExpenseDto.isTaxable }
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
   * Obtiene métricas analíticas avanzadas: KPIs con comparativa previa, timeline agrupada por día y ranking por categorías.
   */
  async getAnalytics(
    userId: string,
    query?: QueryAnalyticsDto,
    referenceDate: Date = new Date(),
  ) {
    const range = query?.range || '30d';
    const targetCurrency = query?.currency ? query.currency.toUpperCase().trim() : 'ARS';

    const { currentStart, currentEnd, prevStart, prevEnd } = calculateDateRanges(
      range,
      referenceDate,
    );

    return this.prisma.withUser(userId, async (tx) => {
      const currencyFilter =
        targetCurrency && targetCurrency !== 'ALL'
          ? { currency: targetCurrency }
          : {};

      const [currentExpenses, prevExpenses] = await Promise.all([
        tx.expense.findMany({
          where: {
            userId,
            ...currencyFilter,
            date: {
              gte: currentStart,
              lte: currentEnd,
            },
          },
          include: {
            category: true,
          },
          orderBy: {
            date: 'asc',
          },
        }),
        tx.expense.findMany({
          where: {
            userId,
            ...currencyFilter,
            date: {
              gte: prevStart,
              lte: prevEnd,
            },
          },
        }),
      ]);

      // 1. Inicializar timeline continuo para cada día del rango actual
      const timelineMap = new Map<
        string,
        {
          date: string;
          expenses: number;
          income: number;
          balance: number;
          count: number;
        }
      >();

      const iter = new Date(currentStart);
      while (iter <= currentEnd) {
        const dStr = toISODateString(iter);
        timelineMap.set(dStr, {
          date: dStr,
          expenses: 0,
          income: 0,
          balance: 0,
          count: 0,
        });
        iter.setUTCDate(iter.getUTCDate() + 1);
      }

      // 2. Procesar transacciones del período actual
      let totalExpenses = 0;
      let totalIncome = 0;

      const categoryMap = new Map<
        string,
        {
          categoryId: string | null;
          categoryName: string;
          icon: string | null;
          color: string | null;
          total: number;
        }
      >();

      for (const exp of currentExpenses) {
        const amount = Number(exp.amount);
        const dateKey = toISODateString(new Date(exp.date));
        const isIncome = exp.type === TransactionType.INCOME;

        let entry = timelineMap.get(dateKey);
        if (!entry) {
          entry = {
            date: dateKey,
            expenses: 0,
            income: 0,
            balance: 0,
            count: 0,
          };
          timelineMap.set(dateKey, entry);
        }

        entry.count += 1;

        if (isIncome) {
          totalIncome += amount;
          entry.income += amount;
        } else {
          totalExpenses += amount;
          entry.expenses += amount;

          const catKey = exp.categoryId || 'uncategorized';
          if (!categoryMap.has(catKey)) {
            categoryMap.set(catKey, {
              categoryId: exp.categoryId || null,
              categoryName: exp.category ? exp.category.name : 'Sin categoría',
              icon: exp.category ? exp.category.icon : null,
              color: exp.category ? exp.category.color : '#64748B',
              total: 0,
            });
          }
          categoryMap.get(catKey)!.total += amount;
        }
      }

      // 3. Formatear timeline ordenada cronológicamente
      const timeline = Array.from(timelineMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((p) => {
          const exp = Math.round(p.expenses * 100) / 100;
          const inc = Math.round(p.income * 100) / 100;
          const bal = Math.round((inc - exp) * 100) / 100;
          return {
            date: p.date,
            expenses: exp,
            income: inc,
            balance: bal,
            count: p.count,
          };
        });

      // 4. Ranking de categorías por gasto (orden descendente)
      const categoryDistribution = Array.from(categoryMap.values())
        .map((cat) => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          color: cat.color,
          icon: cat.icon,
          total: Math.round(cat.total * 100) / 100,
          percentage:
            totalExpenses > 0
              ? Math.round((cat.total / totalExpenses) * 10000) / 100
              : 0,
        }))
        .sort((a, b) => b.total - a.total);

      // 5. Procesar transacciones del período anterior
      let prevTotalExpenses = 0;
      let prevTotalIncome = 0;

      for (const exp of prevExpenses) {
        const amount = Number(exp.amount);
        if (exp.type === TransactionType.INCOME) {
          prevTotalIncome += amount;
        } else {
          prevTotalExpenses += amount;
        }
      }

      // 6. Cálculo de KPIs y variaciones porcentuales seguras
      const roundedTotalExpenses = Math.round(totalExpenses * 100) / 100;
      const roundedTotalIncome = Math.round(totalIncome * 100) / 100;
      const netBalance = Math.round((roundedTotalIncome - roundedTotalExpenses) * 100) / 100;

      const roundedPrevExpenses = Math.round(prevTotalExpenses * 100) / 100;
      const roundedPrevIncome = Math.round(prevTotalIncome * 100) / 100;
      const prevNetBalance = Math.round((roundedPrevIncome - roundedPrevExpenses) * 100) / 100;

      const daysCount = timeline.length;
      const averageExpensePerDay =
        daysCount > 0 ? Math.round((roundedTotalExpenses / daysCount) * 100) / 100 : 0;

      const transactionCount = currentExpenses.length;

      const expensesChangePct = calculatePercentageChange(
        roundedTotalExpenses,
        roundedPrevExpenses,
      );
      const incomeChangePct = calculatePercentageChange(
        roundedTotalIncome,
        roundedPrevIncome,
      );
      const balanceChangePct = calculatePercentageChange(
        netBalance,
        prevNetBalance,
      );

      return {
        range,
        currency: targetCurrency,
        startDate: toISODateString(currentStart),
        endDate: toISODateString(currentEnd),
        kpis: {
          totalExpenses: roundedTotalExpenses,
          totalIncome: roundedTotalIncome,
          netBalance,
          averageExpensePerDay,
          averageDailyExpense: averageExpensePerDay,
          transactionCount,
          daysCount,
          prevTotalExpenses: roundedPrevExpenses,
          prevTotalIncome: roundedPrevIncome,
          prevNetBalance,
          expensesChangePct,
          expensesChangePercent: expensesChangePct,
          incomeChangePct,
          incomeChangePercent: incomeChangePct,
          balanceChangePct,
          balanceChangePercent: balanceChangePct,
          balanceHealth: (netBalance >= 0 ? 'surplus' : 'deficit') as 'surplus' | 'deficit',
        },
        timeline,
        categoryDistribution,
        byCategory: categoryDistribution,
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

  /**
   * Parse a natural language string into structured expense data using Gemini.
   */
  async parseWithAI(userId: string, text: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Fetch categories
    const categories = await this.prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    
    const categoriesContext = categories.length > 0 
      ? categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')
      : 'El usuario no tiene categorías creadas todavía.';

    const systemInstruction = `
Eres un asistente financiero que analiza entradas de texto y extrae información sobre gastos o ingresos.
Devuelve un objeto JSON que coincida exactamente con el esquema requerido.
Usa la siguiente lista de categorías del usuario para asignar categoryId si aplica, o null si no aplica:
${categoriesContext}

Si el usuario no especifica año o mes en fechas relativas ("ayer", "hace 2 dias"), asume que hoy es ${new Date().toISOString()}.
No uses IDs inventados para categoryId, solo usa los provistos en la lista.
Si es un gasto usa tipo 'EXPENSE', si es un ingreso usa 'INCOME'.
El amount siempre debe ser positivo.
`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        amount: {
          type: Type.NUMBER,
          description: 'El monto de la transacción. Siempre positivo.'
        },
        description: {
          type: Type.STRING,
          description: 'La descripción corta de la transacción.'
        },
        categoryId: {
          type: Type.STRING,
          description: 'El ID de la categoría correspondiente, si se encontró una coincidencia en el prompt del sistema. De lo contrario, null o string vacío.',
          nullable: true,
        },
        date: {
          type: Type.STRING,
          description: 'La fecha de la transacción en formato ISO 8601.'
        },
        type: {
          type: Type.STRING,
          enum: ['INCOME', 'EXPENSE'],
          description: 'El tipo de transacción.'
        }
      },
      required: ['amount', 'description', 'date', 'type']
    };

    // dynamically get the best models
    const modelNames: string[] = [];
    try {
      const modelsIterable = await ai.models.list();
      for await (const m of modelsIterable as any) {
        if (m.name && m.name.includes("gemini-") && m.name.includes("flash") && !m.name.includes("preview") && !m.name.includes("-lite") && !m.name.includes("-image") && !m.name.includes("-tts") && !m.name.includes("-transcribe") && !m.name.includes("-live")) {
          modelNames.push(m.name.replace('models/', ''));
        }
      }
    } catch (err) {
      this.logger.warn(`Error fetching models: ${(err as Error).message}`);
    }
    
    // fallback static models if api fails
    const fallbackModels = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'];
    const candidates = modelNames.length > 0 ? modelNames.sort().reverse() : fallbackModels;

    let lastError = null;
    
    for (const modelId of candidates) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: text,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.1,
          },
        });
        
        if (response.text) {
          const parsed = JSON.parse(response.text);
          return {
            amount: Number(parsed.amount),
            description: parsed.description,
            categoryId: parsed.categoryId && parsed.categoryId.trim() !== '' ? parsed.categoryId : undefined,
            date: parsed.date,
            type: parsed.type,
          };
        }
      } catch (e: any) {
        lastError = e;
        this.logger.warn(`El modelo ${modelId} falló para ai-parse: ${e.message}`);
        // If it's a 429 quota error or similar, we try the next one in the loop
      }
    }
    
    throw new Error(`Fallaron todos los modelos al procesar con IA. Último error: ${lastError?.message}`);
  }
}

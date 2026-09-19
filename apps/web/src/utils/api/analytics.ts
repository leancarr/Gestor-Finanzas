import { createClient } from '@/utils/supabase/client';
import { getExpenses, ExpenseItem } from './expenses';
import {
  SupportedCurrency,
  FALLBACK_RATES,
  convertCurrencyLocal,
} from './rates';

export type AnalyticsRange = '7d' | '30d' | 'month';

export interface AnalyticsKpis {
  totalExpenses: number;
  prevTotalExpenses: number;
  expensesChangePercent: number; // Negativo = gasto menor (positivo/verde), Positivo = gasto mayor (negativo/rojo)
  totalIncome: number;
  prevTotalIncome: number;
  incomeChangePercent: number; // Positivo = más ingresos (verde), Negativo = menos ingresos (rojo)
  netBalance: number;
  prevNetBalance: number;
  balanceChangePercent: number;
  balanceHealth: 'surplus' | 'deficit';
  averageDailyExpense: number;
  daysCount: number;
}

export interface AnalyticsTimelinePoint {
  date: string; // 'YYYY-MM-DD'
  displayDate: string; // '18 sep'
  expenses: number;
  income: number;
  net: number;
}

export interface AnalyticsCategoryItem {
  categoryId: string | null;
  categoryName: string;
  icon: string | null;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  currency: SupportedCurrency;
  startDate: string;
  endDate: string;
  kpis: AnalyticsKpis;
  timeline: AnalyticsTimelinePoint[];
  byCategory: AnalyticsCategoryItem[];
  isFallback: boolean;
}

export interface GetAnalyticsOptions {
  range?: AnalyticsRange;
  currency?: SupportedCurrency;
  expenses?: ExpenseItem[];
  rates?: Record<SupportedCurrency, number>;
}

import { DYNAMIC_API_URL } from './config';
const API_URL = DYNAMIC_API_URL;

/**
 * Obtiene las cabeceras de autorización con el JWT de Supabase si existe una sesión activa.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Formatea una fecha a 'YYYY-MM-DD' en hora local para consistencia.
 */
function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha para visualización amigable en el gráfico (ej. '18 sep' o '18/09').
 */
function toDisplayDate(d: Date): string {
  const day = d.getDate();
  const monthNames = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${day} ${monthNames[d.getMonth()]}`;
}

/**
 * Calcula los límites de fechas para el período actual y el período previo de comparación.
 */
function getDateRanges(range: AnalyticsRange): {
  currentStart: Date;
  currentEnd: Date;
  prevStart: Date;
  prevEnd: Date;
  daysCount: number;
} {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === '7d') {
    const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const prevEnd = new Date(currentStart.getTime() - 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
    return {
      currentStart,
      currentEnd: todayEnd,
      prevStart,
      prevEnd,
      daysCount: 7,
    };
  }

  if (range === '30d') {
    const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    const prevEnd = new Date(currentStart.getTime() - 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59, 0, 0, 0, 0);
    return {
      currentStart,
      currentEnd: todayEnd,
      prevStart,
      prevEnd,
      daysCount: 30,
    };
  }

  // 'month' (Mes actual vs Mes anterior completo)
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const currentMonthDaysCount = Math.max(1, now.getDate()); // Días transcurridos hasta hoy para el promedio diario realista

  const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevStart = new Date(prevMonthYear, prevMonthIndex, 1, 0, 0, 0, 0);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  return {
    currentStart,
    currentEnd: todayEnd,
    prevStart,
    prevEnd,
    daysCount: currentMonthDaysCount,
  };
}

/**
 * Realiza el cálculo analítico local a partir de una lista de transacciones.
 */
export function calculateLocalAnalytics(
  expensesList: ExpenseItem[],
  range: AnalyticsRange = '30d',
  targetCurrency: SupportedCurrency = 'ARS',
  rates: Record<SupportedCurrency, number> = FALLBACK_RATES,
): AnalyticsData {
  const { currentStart, currentEnd, prevStart, prevEnd, daysCount } = getDateRanges(range);

  let currentExpenses = 0;
  let currentIncome = 0;
  let prevExpenses = 0;
  let prevIncome = 0;

  // Mapa de días del período actual para armar la línea temporal completa (sin días vacíos)
  const timelineMap = new Map<string, { date: string; displayDate: string; expenses: number; income: number }>();

  // Inicializar todos los días del período en el timeline
  const cursorDate = new Date(currentStart);
  while (cursorDate <= currentEnd) {
    const key = toDateKey(cursorDate);
    timelineMap.set(key, {
      date: key,
      displayDate: toDisplayDate(cursorDate),
      expenses: 0,
      income: 0,
    });
    cursorDate.setDate(cursorDate.getDate() + 1);
  }

  // Acumulador de categorías para el período actual
  const categoryMap = new Map<
    string,
    {
      categoryId: string | null;
      categoryName: string;
      icon: string | null;
      color: string;
      total: number;
      count: number;
    }
  >();

  for (const item of expensesList) {
    const itemDate = new Date(item.date);
    if (isNaN(itemDate.getTime())) continue;

    // Normalización de monto a la moneda de visualización
    const rawAmount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 0;
    const itemCurrency = (item.currency || 'ARS').toUpperCase() as SupportedCurrency;
    
    let amountInTarget = rawAmount;
    if (itemCurrency !== targetCurrency) {
      amountInTarget = convertCurrencyLocal(rawAmount, itemCurrency, targetCurrency, rates);
    }

    const isExpense = (item.type || 'EXPENSE') === 'EXPENSE';
    const isIncome = item.type === 'INCOME';

    // Verificar si cae en el período actual
    if (itemDate >= currentStart && itemDate <= currentEnd) {
      const dayKey = toDateKey(itemDate);
      const dayPoint = timelineMap.get(dayKey);

      if (isExpense) {
        currentExpenses += amountInTarget;
        if (dayPoint) dayPoint.expenses += amountInTarget;

        // Desglose por categoría
        const catKey = item.categoryId || 'sin-categoria';
        if (!categoryMap.has(catKey)) {
          categoryMap.set(catKey, {
            categoryId: item.categoryId || null,
            categoryName: item.category?.name || 'Sin categoría',
            icon: item.category?.icon || null,
            color: item.category?.color || '#64748B',
            total: 0,
            count: 0,
          });
        }
        const catData = categoryMap.get(catKey)!;
        catData.total += amountInTarget;
        catData.count += 1;
      } else if (isIncome) {
        currentIncome += amountInTarget;
        if (dayPoint) dayPoint.income += amountInTarget;
      }
    }
    // Verificar si cae en el período previo de comparación
    else if (itemDate >= prevStart && itemDate <= prevEnd) {
      if (isExpense) {
        prevExpenses += amountInTarget;
      } else if (isIncome) {
        prevIncome += amountInTarget;
      }
    }
  }

  // Redondeos de métricas
  currentExpenses = Math.round(currentExpenses * 100) / 100;
  currentIncome = Math.round(currentIncome * 100) / 100;
  prevExpenses = Math.round(prevExpenses * 100) / 100;
  prevIncome = Math.round(prevIncome * 100) / 100;

  const currentNet = Math.round((currentIncome - currentExpenses) * 100) / 100;
  const prevNet = Math.round((prevIncome - prevExpenses) * 100) / 100;

  // Cálculo de variaciones porcentuales
  const calculateChangePercent = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10;
  };

  const expensesChangePercent = calculateChangePercent(currentExpenses, prevExpenses);
  const incomeChangePercent = calculateChangePercent(currentIncome, prevIncome);
  const balanceChangePercent = calculateChangePercent(currentNet, prevNet);

  const averageDailyExpense = daysCount > 0 ? Math.round((currentExpenses / daysCount) * 100) / 100 : 0;

  // Formar la línea temporal ordenada
  const timeline: AnalyticsTimelinePoint[] = Array.from(timelineMap.values()).map((p) => ({
    date: p.date,
    displayDate: p.displayDate,
    expenses: Math.round(p.expenses * 100) / 100,
    income: Math.round(p.income * 100) / 100,
    net: Math.round((p.income - p.expenses) * 100) / 100,
  }));

  // Formar la lista de categorías
  const byCategory: AnalyticsCategoryItem[] = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      total: Math.round(c.total * 100) / 100,
      percentage:
        currentExpenses > 0
          ? Math.round((c.total / currentExpenses) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    range,
    currency: targetCurrency,
    startDate: toDateKey(currentStart),
    endDate: toDateKey(currentEnd),
    kpis: {
      totalExpenses: currentExpenses,
      prevTotalExpenses: prevExpenses,
      expensesChangePercent,
      totalIncome: currentIncome,
      prevTotalIncome: prevIncome,
      incomeChangePercent,
      netBalance: currentNet,
      prevNetBalance: prevNet,
      balanceChangePercent,
      balanceHealth: currentNet >= 0 ? 'surplus' : 'deficit',
      averageDailyExpense,
      daysCount,
    },
    timeline,
    byCategory,
    isFallback: true,
  };
}

/**
 * Invoca el endpoint GET /expenses/analytics?range=... con Supabase Auth.
 * Si la API falla, no está disponible o el cliente está offline, ejecuta el cálculo fallback local.
 */
export async function getAnalytics(
  options: GetAnalyticsOptions = {},
): Promise<AnalyticsData> {
  const range = options.range || '30d';
  const currency = options.currency || 'ARS';
  const rates = options.rates || FALLBACK_RATES;

  // Intento de consulta a la API remota si estamos en navegador y online
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const headers = await getAuthHeaders();
      const url = new URL(`${API_URL}/expenses/analytics`);
      url.searchParams.set('range', range);
      url.searchParams.set('currency', currency);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(15000), // Timeout prudente para DB remota en Neon
      });

      if (res.ok) {
        const raw = await res.json();
        if (raw && raw.kpis && Array.isArray(raw.timeline)) {
          // 1. Normalizar KPIs
          const kpis: AnalyticsKpis = {
            totalExpenses: Number(raw.kpis.totalExpenses) || 0,
            prevTotalExpenses: Number(raw.kpis.prevTotalExpenses) || 0,
            expensesChangePercent:
              typeof raw.kpis.expensesChangePercent === 'number'
                ? raw.kpis.expensesChangePercent
                : typeof raw.kpis.expensesChangePct === 'number'
                  ? raw.kpis.expensesChangePct
                  : 0,
            totalIncome: Number(raw.kpis.totalIncome) || 0,
            prevTotalIncome: Number(raw.kpis.prevTotalIncome) || 0,
            incomeChangePercent:
              typeof raw.kpis.incomeChangePercent === 'number'
                ? raw.kpis.incomeChangePercent
                : typeof raw.kpis.incomeChangePct === 'number'
                  ? raw.kpis.incomeChangePct
                  : 0,
            netBalance: Number(raw.kpis.netBalance) || 0,
            prevNetBalance: Number(raw.kpis.prevNetBalance) || 0,
            balanceChangePercent:
              typeof raw.kpis.balanceChangePercent === 'number'
                ? raw.kpis.balanceChangePercent
                : typeof raw.kpis.balanceChangePct === 'number'
                  ? raw.kpis.balanceChangePct
                  : 0,
            balanceHealth:
              raw.kpis.balanceHealth ||
              ((Number(raw.kpis.netBalance) || 0) >= 0 ? 'surplus' : 'deficit'),
            averageDailyExpense:
              Number(raw.kpis.averageDailyExpense) ||
              Number(raw.kpis.averageExpensePerDay) ||
              0,
            daysCount:
              Number(raw.kpis.daysCount) ||
              (range === '7d' ? 7 : range === '30d' ? 30 : new Date().getDate()),
          };

          // 2. Normalizar Línea Temporal con displayDate garantizado
          const timeline: AnalyticsTimelinePoint[] = raw.timeline.map(
            (item: any) => {
              let displayDate = item.displayDate;
              if (!displayDate && item.date) {
                const parts = item.date.split('-');
                if (parts.length === 3) {
                  const m = parseInt(parts[1], 10);
                  const d = parseInt(parts[2], 10);
                  const monthNames = [
                    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
                  ];
                  displayDate = `${d} ${monthNames[(m || 1) - 1]}`;
                } else {
                  displayDate = item.date;
                }
              }
              const expenses = Number(item.expenses) || 0;
              const income = Number(item.income) || 0;
              const net =
                typeof item.net === 'number'
                  ? item.net
                  : typeof item.balance === 'number'
                    ? item.balance
                    : income - expenses;

              return {
                date: item.date,
                displayDate: displayDate || item.date,
                expenses,
                income,
                net,
              };
            },
          );

          // 3. Normalizar Categorías (backend devuelve categoryDistribution)
          const rawCats = raw.byCategory || raw.categoryDistribution || [];
          const byCategory: AnalyticsCategoryItem[] = rawCats.map((c: any) => ({
            categoryId: c.categoryId ?? null,
            categoryName: c.categoryName ?? 'Sin categoría',
            icon: c.icon ?? null,
            color: c.color ?? '#64748B',
            total: Number(c.total) || 0,
            count: Number(c.count) || 0,
            percentage: Number(c.percentage) || 0,
          }));

          return {
            range: raw.range || range,
            currency: raw.currency || currency,
            startDate: raw.startDate || '',
            endDate: raw.endDate || '',
            kpis,
            timeline,
            byCategory,
            isFallback: false,
          };
        }
      }
    } catch {
      // API no disponible o endpoint aún no implementado; continúa al fallback
    }
  }

  // Fallback local: obtener transacciones existentes y procesar localmente
  let expensesList = options.expenses;
  if (!expensesList) {
    try {
      expensesList = await getExpenses({ limit: 1000 });
    } catch {
      expensesList = [];
    }
  }

  return calculateLocalAnalytics(expensesList, range, currency, rates);
}

import { createExpense } from './expenses';
import { getCategories, createCategory } from './categories';

export type GoalCurrency = 'ARS' | 'USD';

export interface GoalDeposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: GoalCurrency;
  color: string;
  icon: string;
  deadline: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  deposits?: GoalDeposit[];
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  currency?: GoalCurrency;
  color?: string;
  icon?: string;
  deadline: string;
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  currency?: GoalCurrency;
  color?: string;
  icon?: string;
  deadline?: string;
}

export const STORAGE_KEY_GOALS = 'gestor_guita_goals';

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-emergency-fund',
    name: 'Fondo de Emergencia (6 meses)',
    targetAmount: 2500000,
    currentAmount: 1100000,
    currency: 'ARS',
    color: '#10B981', // Esmeralda
    icon: 'Shield',
    deadline: '2026-12-31',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-09-15T14:30:00.000Z',
    deposits: [
      { id: 'dep-1', amount: 500000, date: '2026-08-10T11:00:00.000Z', note: 'Aporte inicial' },
      { id: 'dep-2', amount: 300000, date: '2026-08-25T16:00:00.000Z', note: 'Sueldo Agosto' },
      { id: 'dep-3', amount: 300000, date: '2026-09-10T12:00:00.000Z', note: 'Sueldo Septiembre' },
    ],
  },
  {
    id: 'goal-vacations',
    name: 'Vacaciones en Bariloche',
    targetAmount: 850000,
    currentAmount: 480000,
    currency: 'ARS',
    color: '#0EA5E9', // Cielo
    icon: 'Plane',
    deadline: '2026-11-20',
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: '2026-09-20T09:15:00.000Z',
    deposits: [
      { id: 'dep-4', amount: 250000, date: '2026-08-18T10:00:00.000Z', note: 'Reserva cabaña' },
      { id: 'dep-5', amount: 230000, date: '2026-09-15T15:00:00.000Z', note: 'Pasajes aéreos' },
    ],
  },
  {
    id: 'goal-macbook',
    name: 'Upgrade MacBook Pro M4',
    targetAmount: 2200,
    currentAmount: 1450,
    currency: 'USD',
    color: '#8B5CF6', // Violeta
    icon: 'Laptop',
    deadline: '2027-03-31',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-21T18:45:00.000Z',
    deposits: [
      { id: 'dep-6', amount: 1000, date: '2026-09-05T14:00:00.000Z', note: 'Ahorro MEP inicial' },
      { id: 'dep-7', amount: 450, date: '2026-09-21T18:45:00.000Z', note: 'Rendimiento freelancing' },
    ],
  },
  {
    id: 'goal-car-service',
    name: 'Mantenimiento & Seguro Anual Auto',
    targetAmount: 450000,
    currentAmount: 380000,
    currency: 'ARS',
    color: '#F59E0B', // Ámbar
    icon: 'Car',
    deadline: '2026-10-15',
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: '2026-09-18T16:20:00.000Z',
    deposits: [
      { id: 'dep-8', amount: 200000, date: '2026-08-22T09:00:00.000Z', note: 'Ahorro cubiertas' },
      { id: 'dep-9', amount: 180000, date: '2026-09-18T16:20:00.000Z', note: 'Service 50k km' },
    ],
  },
];

function notifyGoalsUpdated(goals: Goal[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('goals_updated', { detail: goals }));
  }
}

/**
 * Obtiene el listado de metas almacenadas en localStorage con fallback a defaults realistas.
 */
export async function getGoals(): Promise<Goal[]> {
  if (typeof window === 'undefined') {
    return [...DEFAULT_GOALS];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(DEFAULT_GOALS));
      return [...DEFAULT_GOALS];
    }

    const parsed: Goal[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(DEFAULT_GOALS));
      return [...DEFAULT_GOALS];
    }

    return parsed;
  } catch (err) {
    console.error('Error al leer metas de ahorro:', err);
    return [...DEFAULT_GOALS];
  }
}

/**
 * Crea una nueva meta de ahorro y persiste en localStorage.
 */
export async function createGoal(data: CreateGoalInput): Promise<Goal> {
  const currentGoals = await getGoals();
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const now = new Date().toISOString();
  const targetAmount = Math.max(0, Number(data.targetAmount) || 0);
  const currentAmount = Math.max(0, Number(data.currentAmount) || 0);

  const initialDeposits: GoalDeposit[] = [];
  if (currentAmount > 0) {
    initialDeposits.push({
      id: `dep-${Date.now()}`,
      amount: currentAmount,
      date: now,
      note: 'Monto inicial al crear la meta',
    });
  }

  const newGoal: Goal = {
    id,
    name: data.name.trim(),
    targetAmount,
    currentAmount,
    currency: data.currency || 'ARS',
    color: data.color || '#10B981',
    icon: data.icon || 'Target',
    deadline: data.deadline,
    createdAt: now,
    updatedAt: now,
    deposits: initialDeposits,
  };

  const updatedList = [newGoal, ...currentGoals];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(updatedList));
  }
  notifyGoalsUpdated(updatedList);

  return newGoal;
}

/**
 * Actualiza los datos de una meta existente.
 */
export async function updateGoal(
  id: string,
  data: UpdateGoalInput,
): Promise<Goal> {
  const currentGoals = await getGoals();
  const index = currentGoals.findIndex((g) => g.id === id);

  if (index === -1) {
    throw new Error(`Meta con ID ${id} no encontrada`);
  }

  const target = currentGoals[index];
  const now = new Date().toISOString();

  const updatedGoal: Goal = {
    ...target,
    name: data.name !== undefined ? data.name.trim() : target.name,
    targetAmount:
      data.targetAmount !== undefined
        ? Math.max(0, Number(data.targetAmount) || 0)
        : target.targetAmount,
    currentAmount:
      data.currentAmount !== undefined
        ? Math.max(0, Number(data.currentAmount) || 0)
        : target.currentAmount,
    currency: data.currency !== undefined ? data.currency : target.currency,
    color: data.color !== undefined ? data.color : target.color,
    icon: data.icon !== undefined ? data.icon : target.icon,
    deadline: data.deadline !== undefined ? data.deadline : target.deadline,
    updatedAt: now,
  };

  currentGoals[index] = updatedGoal;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(currentGoals));
  }
  notifyGoalsUpdated(currentGoals);

  return updatedGoal;
}

/**
 * Elimina una meta de ahorro por su ID.
 */
export async function deleteGoal(id: string): Promise<void> {
  const currentGoals = await getGoals();
  const filtered = currentGoals.filter((g) => g.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(filtered));
  }
  notifyGoalsUpdated(filtered);
}

/**
 * Inyecta un depósito de fondos a una meta de ahorro específica.
 */
export async function addGoalDeposit(
  id: string,
  amount: number,
  note?: string,
): Promise<Goal> {
  const depositAmount = Number(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    throw new Error('El monto a aportar debe ser mayor a 0');
  }

  const currentGoals = await getGoals();
  const index = currentGoals.findIndex((g) => g.id === id);

  if (index === -1) {
    throw new Error(`Meta con ID ${id} no encontrada`);
  }

  const target = currentGoals[index];
  const now = new Date().toISOString();
  const updatedAmount = Math.round((target.currentAmount + depositAmount) * 100) / 100;

  const newDeposit: GoalDeposit = {
    id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    amount: depositAmount,
    date: now,
    note: note || `Aporte rápido de fondos`,
  };

  const updatedDeposits = [newDeposit, ...(target.deposits || [])];

  const updatedGoal: Goal = {
    ...target,
    currentAmount: updatedAmount,
    updatedAt: now,
    deposits: updatedDeposits,
  };

  currentGoals[index] = updatedGoal;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(currentGoals));
  }
  notifyGoalsUpdated(currentGoals);

  // Crear egreso automático en Gastos / Transacciones en categoría 'Ahorro & Metas'
  try {
    let categoryId: string | null = null;
    try {
      const categories = await getCategories();
      let cat = categories.find(
        (c) =>
          c.name.toLowerCase() === 'ahorro & metas' ||
          c.name.toLowerCase() === 'ahorro y metas' ||
          c.name.toLowerCase() === 'inversiones & ahorro',
      );
      if (!cat) {
        cat = categories.find((c) => c.name.toLowerCase().includes('ahorro'));
      }
      if (!cat) {
        try {
          cat = await createCategory({
            name: 'Ahorro & Metas',
            icon: 'Target',
            color: '#10B981',
          });
        } catch {
          // Ignorar si no se pudo crear la categoría
        }
      }
      if (cat) {
        categoryId = cat.id;
      }
    } catch {
      // Ignorar fallo al buscar/crear categoría
    }

    await createExpense({
      amount: depositAmount,
      description: note || `Aporte a meta: ${target.name}`,
      type: 'EXPENSE',
      currency: target.currency || 'ARS',
      categoryId,
      date: now.split('T')[0],
      tags: ['#ahorro', '#metas'],
    });
  } catch (expenseErr) {
    console.warn('Aviso: no se pudo registrar el gasto automático para la meta:', expenseErr);
  }

  return updatedGoal;
}

/**
 * Helpers para cálculo de progreso y días restantes de una meta.
 */
export function calculateGoalMetrics(goal: Goal) {
  const percentage =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 1000) / 10)
      : 0;

  const rawPercentage =
    goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  // Cálculo de días restantes contra deadline (UTC/Local seguro)
  let daysRemaining = 0;
  let isOverdue = false;

  if (goal.deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(goal.deadline + 'T00:00:00');
    if (!isNaN(deadlineDate.getTime())) {
      const diffTime = deadlineDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0 && !isCompleted) {
        isOverdue = true;
      }
    }
  }

  return {
    percentage,
    rawPercentage,
    remainingAmount,
    isCompleted,
    daysRemaining,
    isOverdue,
  };
}

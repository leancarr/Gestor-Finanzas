import { createClient } from '@/utils/supabase/client';

export type TransactionType = 'EXPENSE' | 'INCOME';

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface ExpenseItemUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface ExpenseItem {
  id: string;
  amount: number | string;
  currency: string;
  type: TransactionType;
  description: string;
  date: string;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory | null;
  exchangeRate?: number | string | null;
  isTaxable?: boolean;
  tags?: string[];
  vaultId?: string | null;
  user?: ExpenseItemUser | null;
}

export type Expense = ExpenseItem;

export interface CreateExpenseInput {
  amount: number;
  description: string;
  type?: TransactionType;
  date?: string;
  categoryId?: string | null;
  currency?: string;
  exchangeRate?: number | null;
  isTaxable?: boolean;
  tags?: string[];
  vaultId?: string | null;
}

export interface UpdateExpenseInput {
  amount?: number;
  description?: string;
  type?: TransactionType;
  date?: string;
  categoryId?: string | null;
  currency?: string;
  exchangeRate?: number | null;
  isTaxable?: boolean;
  tags?: string[];
  vaultId?: string | null;
}

export interface CategorySummaryItem {
  categoryId: string | null;
  categoryName: string;
  icon: string | null;
  color: string | null;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpensesSummary {
  month: number;
  year: number;
  currency?: string;
  totalAmount: number;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  count: number;
  expensesCount?: number;
  incomeCount?: number;
  byCategory: CategorySummaryItem[];
}

export interface ExpenseFilterQuery {
  categoryId?: string;
  type?: TransactionType;
  search?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
  vaultId?: string | null;
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
 * Obtiene la lista de gastos del usuario autenticado con filtros opcionales.
 */
export async function getExpenses(
  query?: ExpenseFilterQuery,
): Promise<ExpenseItem[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/expenses`);

  if (query?.categoryId) {
    url.searchParams.set('categoryId', query.categoryId);
  }
  if (query?.type) {
    url.searchParams.set('type', query.type);
  }
  if (query?.search && query.search.trim()) {
    url.searchParams.set('search', query.search.trim());
  }
  if (query?.tag && query.tag.trim()) {
    url.searchParams.set('tag', query.tag.trim());
  }
  if (query?.startDate) {
    url.searchParams.set('startDate', query.startDate);
  }
  if (query?.endDate) {
    url.searchParams.set('endDate', query.endDate);
  }
  if (query?.limit) {
    url.searchParams.set('limit', String(query.limit));
  }
  if (query?.page) {
    url.searchParams.set('page', String(query.page));
  }
  if (query?.vaultId) {
    url.searchParams.set('vaultId', query.vaultId);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al obtener gastos (${res.status})`);
  }

  return res.json();
}

/**
 * Obtiene un gasto por su ID.
 */
export async function getExpense(id: string): Promise<ExpenseItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al obtener gasto (${res.status})`);
  }

  return res.json();
}

/**
 * Registra un nuevo gasto.
 */
export async function createExpense(
  data: CreateExpenseInput,
): Promise<ExpenseItem> {
  const headers = await getAuthHeaders();
  
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const { addOfflineRequest } = await import('../offline-sync-db');
    await addOfflineRequest({
      url: `${API_URL}/expenses`,
      method: 'POST',
      headers: headers as Record<string, string>,
      body: data,
    });
    return {
      ...data,
      id: 'temp-' + Date.now(),
      currency: data.currency || 'ARS',
      exchangeRate: data.exchangeRate || null,
      isTaxable: data.isTaxable || false,
      userId: '',
      vaultId: data.vaultId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ExpenseItem;
  }

  try {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al registrar gasto (${res.status})`);
    }

    return res.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TypeError' && err.message.includes('fetch')) {
      const { addOfflineRequest } = await import('../offline-sync-db');
      await addOfflineRequest({
        url: `${API_URL}/expenses`,
        method: 'POST',
        headers: headers as Record<string, string>,
        body: data,
      });
      return {
        ...data,
        id: 'temp-' + Date.now(),
        currency: data.currency || 'ARS',
        exchangeRate: data.exchangeRate || null,
        isTaxable: data.isTaxable || false,
        userId: '',
        vaultId: data.vaultId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ExpenseItem;
    }
    throw err;
  }
}

/**
 * Actualiza un gasto existente.
 */
export async function updateExpense(
  id: string,
  data: UpdateExpenseInput,
): Promise<ExpenseItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al actualizar gasto (${res.status})`);
  }

  return res.json();
}

/**
 * Elimina un gasto.
 */
export async function deleteExpense(
  id: string,
): Promise<{ message: string; id: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al eliminar gasto (${res.status})`);
  }

  return res.json();
}

/**
 * Obtiene el resumen mensual y por categorías de los gastos del usuario autenticado.
 */
export async function getExpensesSummary(params?: {
  month?: number;
  year?: number;
  currency?: string;
  vaultId?: string | null;
}): Promise<ExpensesSummary>;
export async function getExpensesSummary(
  month?: number,
  year?: number,
  currency?: string,
  vaultId?: string | null,
): Promise<ExpensesSummary>;
export async function getExpensesSummary(
  monthOrParams?:
    | number
    | {
        month?: number;
        year?: number;
        currency?: string;
        vaultId?: string | null;
      },
  year?: number,
  currency?: string,
  vaultId?: string | null,
): Promise<ExpensesSummary> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/expenses/summary`);

  let m: number | undefined;
  let y: number | undefined;
  let c: string | undefined;
  let v: string | null | undefined;

  if (typeof monthOrParams === 'object' && monthOrParams !== null) {
    m = monthOrParams.month;
    y = monthOrParams.year;
    c = monthOrParams.currency;
    v = monthOrParams.vaultId;
  } else {
    m = monthOrParams;
    y = year;
    c = currency;
    v = vaultId;
  }

  if (m) {
    url.searchParams.set('month', String(m));
  }
  if (y) {
    url.searchParams.set('year', String(y));
  }
  if (c) {
    url.searchParams.set('currency', c);
  }
  if (v) {
    url.searchParams.set('vaultId', v);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al obtener resumen de gastos (${res.status})`,
    );
  }

  return res.json();
}

/**
 * Obtiene los últimos gastos del usuario autenticado.
 */
export async function getRecentExpenses(
  limit: number = 5,
  vaultId?: string | null,
): Promise<ExpenseItem[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/expenses/recent`);
  if (limit) {
    url.searchParams.set('limit', String(limit));
  }
  if (vaultId) {
    url.searchParams.set('vaultId', vaultId);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al obtener gastos recientes (${res.status})`,
    );
  }

  return res.json();
}


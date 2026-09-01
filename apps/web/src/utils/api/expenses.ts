import { createClient } from '@/utils/supabase/client';

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface ExpenseItem {
  id: string;
  amount: number | string;
  currency: string;
  description: string;
  date: string;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory | null;
}

export interface CreateExpenseInput {
  amount: number;
  description: string;
  date?: string;
  categoryId?: string | null;
}

export interface UpdateExpenseInput {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string | null;
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
  totalAmount: number;
  count: number;
  byCategory: CategorySummaryItem[];
}

export interface ExpenseFilterQuery {
  categoryId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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
  if (query?.search && query.search.trim()) {
    url.searchParams.set('search', query.search.trim());
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
}): Promise<ExpensesSummary> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/expenses/summary`);
  if (params?.month) {
    url.searchParams.set('month', String(params.month));
  }
  if (params?.year) {
    url.searchParams.set('year', String(params.year));
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
export async function getRecentExpenses(limit: number = 5): Promise<ExpenseItem[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/expenses/recent`);
  if (limit) {
    url.searchParams.set('limit', String(limit));
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


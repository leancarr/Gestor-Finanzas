import { createClient } from '@/utils/supabase/client';

export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface BudgetItem {
  id: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category: BudgetCategory;
  spentAmount: number;
  percentage: number;
  remaining: number;
  status: BudgetStatus;
}

export interface CreateBudgetInput {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  currency?: string;
}

export interface UpdateBudgetInput {
  amount?: number;
  currency?: string;
}

export interface QueryBudgetsParams {
  month?: number;
  year?: number;
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
 * Obtiene la lista de presupuestos con cálculo cruzado de consumo para el mes y año solicitados.
 */
export async function getBudgets(params?: QueryBudgetsParams): Promise<BudgetItem[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/budgets`);

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
    throw new Error(err.message || `Error al obtener presupuestos (${res.status})`);
  }

  return res.json();
}

/**
 * Obtiene un presupuesto individual por su ID.
 */
export async function getBudget(id: string): Promise<BudgetItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al obtener presupuesto (${res.status})`);
  }

  return res.json();
}

/**
 * Crea o actualiza (upsert) un presupuesto para una categoría y mes/año.
 */
export async function createOrUpsertBudget(
  data: CreateBudgetInput,
): Promise<BudgetItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al guardar presupuesto (${res.status})`);
  }

  return res.json();
}

/**
 * Actualiza el monto o moneda de un presupuesto existente.
 */
export async function updateBudget(
  id: string,
  data: UpdateBudgetInput,
): Promise<BudgetItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al actualizar presupuesto (${res.status})`);
  }

  return res.json();
}

/**
 * Elimina un presupuesto.
 */
export async function deleteBudget(
  id: string,
): Promise<{ message: string; id: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al eliminar presupuesto (${res.status})`);
  }

  return res.json();
}

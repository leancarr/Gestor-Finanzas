import { createClient } from '@/utils/supabase/client';

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type TransactionType = 'EXPENSE' | 'INCOME';

export interface RecurringCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface RecurringItem {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  dayOfMonth: number | null;
  nextDueDate: string;
  autoDebit: boolean;
  isActive: boolean;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: RecurringCategory | null;
}

export interface CreateRecurringInput {
  name: string;
  amount: number;
  currency?: string;
  type?: TransactionType;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number | null;
  nextDueDate: string;
  autoDebit?: boolean;
  categoryId?: string | null;
}

export interface UpdateRecurringInput {
  name?: string;
  amount?: number;
  currency?: string;
  type?: TransactionType;
  frequency?: RecurrenceFrequency;
  dayOfMonth?: number | null;
  nextDueDate?: string;
  autoDebit?: boolean;
  isActive?: boolean;
  categoryId?: string | null;
}

export interface ProcessRecurringResponse {
  message: string;
  expense: Record<string, unknown>;
  recurring: RecurringItem;
}

export interface ProcessDueResponse {
  message: string;
  processedCount: number;
  processed: Array<{
    expense: Record<string, unknown>;
    recurring: RecurringItem;
  }>;
}

import { DYNAMIC_API_URL } from './config';
const API_URL = DYNAMIC_API_URL;

/**
 * Obtiene las cabeceras de autorización con el JWT de Supabase Auth si existe una sesión activa.
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
 * Obtiene la lista de transacciones recurrentes del usuario.
 * @param all Si es true, incluye también las pausadas/inactivas.
 */
export async function getRecurring(all = false): Promise<RecurringItem[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/recurring`);
  if (all) {
    url.searchParams.set('all', 'true');
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al obtener transacciones recurrentes (${res.status})`,
    );
  }

  return res.json();
}

/**
 * Obtiene el detalle de una transacción recurrente por ID.
 */
export async function getRecurringById(id: string): Promise<RecurringItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/recurring/${id}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al obtener transacción recurrente (${res.status})`,
    );
  }

  return res.json();
}

/**
 * Crea una nueva suscripción o gasto recurrente.
 */
export async function createRecurring(
  data: CreateRecurringInput,
): Promise<RecurringItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/recurring`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al crear transacción recurrente (${res.status})`,
    );
  }

  return res.json();
}

/**
 * Actualiza una suscripción o gasto recurrente.
 */
export async function updateRecurring(
  id: string,
  data: UpdateRecurringInput,
): Promise<RecurringItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/recurring/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al actualizar transacción recurrente (${res.status})`,
    );
  }

  return res.json();
}

/**
 * Elimina una transacción recurrente.
 */
export async function deleteRecurring(
  id: string,
): Promise<{ message: string; id: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/recurring/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al eliminar transacción recurrente (${res.status})`,
    );
  }

  return res.json();
}

/**
 * Procesa inmediatamente el vencimiento de una recurrencia, creando el Expense y avanzando nextDueDate.
 */
export async function processRecurring(
  id: string,
): Promise<ProcessRecurringResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/recurring/${id}/process`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al registrar el pago de la recurrencia (${res.status})`,
    );
  }

  return res.json();
}

/**
 * Procesa en lote todos los débitos automáticos vencidos hasta la fecha actual.
 */
export async function processDueRecurring(): Promise<ProcessDueResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/recurring/process-due`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al procesar débitos automáticos pendientes (${res.status})`,
    );
  }

  return res.json();
}

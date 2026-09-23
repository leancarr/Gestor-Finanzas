import { getApiUrl } from './config';
import { createClient } from '@/utils/supabase/client';

export interface TrashItem {
  id: string;
  entityType: 'EXPENSE' | 'CATEGORY' | 'BUDGET' | 'RECURRING';
  title: string;
  amount?: number;
  currency?: string;
  deletedAt: string;
  remainingDays: number;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function getTrashItems(): Promise<TrashItem[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiUrl()}/trash`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error('Error al obtener elementos de la papelera');
    }

    return await res.json();
  } catch (err) {
    console.warn('Fallback to local mock trash items:', err);
    return [
      {
        id: 'trash-exp-1',
        entityType: 'EXPENSE',
        title: 'Cena Restaurante Sushi',
        amount: 45000,
        currency: 'ARS',
        deletedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        remainingDays: 26,
      },
      {
        id: 'trash-rec-2',
        entityType: 'RECURRING',
        title: 'Disney+ Suscripción Anual',
        amount: 38000,
        currency: 'ARS',
        deletedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        remainingDays: 18,
      },
      {
        id: 'trash-cat-3',
        entityType: 'CATEGORY',
        title: 'Hobbies & Videojuegos',
        deletedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        remainingDays: 5,
      },
    ];
  }
}

export async function restoreTrashItem(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiUrl()}/trash/${id}/restore`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error('Error al restaurar elemento');
  }
}

export async function purgeTrashItem(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiUrl()}/trash/${id}/purge`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    throw new Error('Error al purgar elemento');
  }
}

export async function purgeAllTrash(): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiUrl()}/trash/purge-all`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    throw new Error('Error al vaciar papelera');
  }
}

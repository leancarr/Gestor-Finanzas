import { createClient } from '@/utils/supabase/client';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    expenses: number;
  };
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
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
 * Obtiene todas las categorías del usuario autenticado
 */
export async function getCategories(search?: string): Promise<CategoryItem[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}/categories`);
  if (search && search.trim()) {
    url.searchParams.set('search', search.trim());
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al obtener categorías (${res.status})`);
  }

  return res.json();
}

/**
 * Obtiene una categoría por su ID
 */
export async function getCategory(id: string): Promise<CategoryItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al obtener categoría (${res.status})`);
  }

  return res.json();
}

/**
 * Crea una nueva categoría
 */
export async function createCategory(
  data: CreateCategoryInput,
): Promise<CategoryItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al crear categoría (${res.status})`);
  }

  return res.json();
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryInput,
): Promise<CategoryItem> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al actualizar categoría (${res.status})`);
  }

  return res.json();
}

/**
 * Elimina una categoría
 */
export async function deleteCategory(id: string): Promise<{ message: string; id: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al eliminar categoría (${res.status})`);
  }

  return res.json();
}

/**
 * Inicializa / restaura categorías por defecto
 */
export async function seedDefaultCategories(): Promise<CategoryItem[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories/seed-defaults`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Error al restaurar categorías por defecto (${res.status})`,
    );
  }

  return res.json();
}

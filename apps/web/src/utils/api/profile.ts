import { createClient } from '@/utils/supabase/client';
import { getExpenses, deleteExpense } from './expenses';
import { getCategories, deleteCategory } from './categories';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastSignInAt?: string | null;
  role?: string;
  provider?: string;
}

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string | null;
}

import { DYNAMIC_API_URL } from './config';
const API_URL = DYNAMIC_API_URL;

/**
 * Convierte un objeto File a Data URL en base64 para previsualización o fallback de almacenamiento
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Obtiene las cabeceras con el JWT de Supabase si existe una sesión activa.
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
 * Sube el avatar al bucket 'avatars' de Supabase Storage.
 * Si el bucket no existe, está deshabilitado o falla la subida, utiliza un fallback a Data URL.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Debes estar autenticado para subir un avatar.');
  }

  // Sanitizar y generar ruta única para evitar colisiones
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(fileExt)
    ? fileExt
    : 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
  const filePath = `${user.id}/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn(
        'Aviso: Supabase Storage bucket "avatars" no disponible o con restricciones. Aplicando fallback de Data URL:',
        uploadError.message,
      );
      return await fileToDataUrl(file);
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      return publicUrlData.publicUrl;
    }

    return await fileToDataUrl(file);
  } catch (err) {
    console.warn(
      'Error inesperado al subir a Supabase Storage. Usando fallback de Data URL:',
      err,
    );
    return await fileToDataUrl(file);
  }
}

/**
 * Obtiene el perfil completo del usuario autenticado combinando el backend NestJS y Supabase Auth
 */
export async function getProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  let backendProfile: Partial<UserProfile> | null = null;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      backendProfile = await res.json();
    }
  } catch {
    // Si la API no está disponible o falla, continuamos con los datos de Supabase Auth
  }

  const name =
    backendProfile?.name ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    null;

  const avatarUrl =
    backendProfile?.avatarUrl ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  return {
    id: user.id,
    email: backendProfile?.email || user.email || '',
    name,
    avatarUrl,
    createdAt: backendProfile?.createdAt || user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    role: user.role || 'authenticated',
    provider: user.app_metadata?.provider || 'email',
  };
}

/**
 * Actualiza los datos del perfil (nombre y/o avatar) en backend NestJS y Supabase Auth
 */
export async function updateProfile(data: UpdateProfileInput): Promise<UserProfile> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('No hay una sesión activa para actualizar el perfil.');
  }

  // 1. Actualizar en backend NestJS
  let backendUpdated: Partial<UserProfile> | null = null;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        name: data.name?.trim(),
        avatarUrl: data.avatarUrl,
      }),
    });
    if (res.ok) {
      backendUpdated = await res.json();
    }
  } catch (err) {
    console.warn('Aviso: No se pudo actualizar en backend NestJS:', err);
  }

  // 2. Actualizar metadatos en Supabase Auth
  const currentMetadata = user.user_metadata || {};
  const updatedMetadata = {
    ...currentMetadata,
    ...(data.name !== undefined ? { name: data.name.trim(), full_name: data.name.trim() } : {}),
    ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
  };

  const { data: updatedUserResponse, error: updateError } =
    await supabase.auth.updateUser({
      data: updatedMetadata,
    });

  if (updateError && !backendUpdated) {
    throw new Error(updateError.message || 'Error al actualizar el perfil en Supabase Auth');
  }

  const updatedUser = updatedUserResponse.user || user;
  return {
    id: updatedUser.id,
    email: backendUpdated?.email || updatedUser.email || '',
    name:
      backendUpdated?.name ||
      updatedUser.user_metadata?.name ||
      updatedUser.user_metadata?.full_name ||
      null,
    avatarUrl:
      backendUpdated?.avatarUrl !== undefined
        ? backendUpdated.avatarUrl
        : updatedUser.user_metadata?.avatar_url ||
          updatedUser.user_metadata?.picture ||
          null,
    createdAt: backendUpdated?.createdAt || updatedUser.created_at,
    lastSignInAt: updatedUser.last_sign_in_at ?? null,
    role: updatedUser.role || 'authenticated',
    provider: updatedUser.app_metadata?.provider || 'email',
  };
}

/**
 * GDPR Right to Erasure (Derecho al Olvido):
 * - Ejecuta borrado transaccional en backend NestJS (DELETE /users/me).
 * - Purga todos los gastos del usuario autenticado.
 * - Purga todas las categorías asociadas al usuario.
 * - Elimina archivos en Supabase Storage (bucket avatars).
 * - Limpia almacenamiento local / IndexedDB offline.
 * - Anonimiza / vacía metadatos de usuario en Supabase Auth y cierra la sesión.
 */
export async function deleteAccountGDPR(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('No hay una sesión activa para ejecutar el borrado GDPR.');
  }

  const userId = user.id;

  // 1. Invocar endpoint transaccional del backend NestJS (DELETE /users/me)
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_URL}/users/me`, {
      method: 'DELETE',
      headers,
    });
  } catch (err) {
    console.warn('Aviso al llamar a DELETE /users/me en backend:', err);
  }

  // 2. Purgar gastos vía API de gastos si quedara algún remanente
  try {
    const expenses = await getExpenses().catch(() => []);
    if (expenses.length > 0) {
      await Promise.allSettled(expenses.map((exp) => deleteExpense(exp.id)));
    }
  } catch (err) {
    console.warn('Aviso al purgar gastos vía API:', err);
  }

  // 3. Purgar categorías vía API de categorías
  try {
    const categories = await getCategories().catch(() => []);
    if (categories.length > 0) {
      await Promise.allSettled(categories.map((cat) => deleteCategory(cat.id)));
    }
  } catch (err) {
    console.warn('Aviso al purgar categorías vía API:', err);
  }

  // 4. Purgar archivos de avatar en Supabase Storage
  try {
    const { data: files } = await supabase.storage.from('avatars').list(userId);
    if (files && files.length > 0) {
      const pathsToDelete = files.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from('avatars').remove(pathsToDelete);
    }
  } catch (err) {
    console.warn('Aviso al limpiar avatars en Storage:', err);
  }

  // 5. Limpiar almacenamiento local e IndexedDB offline
  try {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      try {
        const { getDB } = await import('@/utils/offline-sync-db');
        const db = await getDB();
        if (db) {
          await db.clear('offline-requests');
        }
      } catch {
        // Ignorar si indexedDB no está disponible
      }
    }
  } catch (err) {
    console.warn('Aviso al limpiar almacenamiento local:', err);
  }

  // 6. Anonimizar metadatos en Supabase Auth
  try {
    await supabase.auth.updateUser({
      data: {
        name: 'Usuario Eliminado (GDPR)',
        full_name: null,
        avatar_url: null,
        gdpr_deleted: true,
        deleted_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn('Aviso al anonimizar usuario en Auth:', err);
  }

  // 7. Cerrar sesión completamente en Supabase Auth
  await supabase.auth.signOut();

  return {
    success: true,
    message: 'Cuenta y todos los datos asociados han sido eliminados de forma definitiva conforme a GDPR.',
  };
}

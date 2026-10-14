import { createBrowserClient } from '@supabase/ssr';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';

const DEV_SESSION_KEY = 'gestor_guita_dev_session';
const DEV_COOKIE_NAME = 'gestor_guita_dev_token';

export interface DevAuthSession {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  user: User;
}

export function getDevSession(): DevAuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DevAuthSession;
  } catch {
    return null;
  }
}

export function setDevSession(session: DevAuthSession | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(DEV_SESSION_KEY);
    document.cookie = `${DEV_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    window.dispatchEvent(
      new CustomEvent('gestor_guita_auth_change', {
        detail: { event: 'SIGNED_OUT', session: null },
      }),
    );
    return;
  }

  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  document.cookie = `${DEV_COOKIE_NAME}=${session.access_token}; path=/; max-age=2592000; SameSite=Lax`;
  window.dispatchEvent(
    new CustomEvent('gestor_guita_auth_change', {
      detail: { event: 'SIGNED_IN', session },
    }),
  );
}

import { getApiUrl } from '../api/config';

export async function loginWithDevAccount(email?: string, name?: string): Promise<DevAuthSession> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/auth/dev-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email || undefined,
      name: name || undefined,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al autenticar en modo desarrollo');
  }

  const data = await response.json();
  const session: DevAuthSession = {
    access_token: data.accessToken,
    token_type: 'bearer',
    user: {
      id: data.user.id,
      app_metadata: {},
      user_metadata: data.user.user_metadata || {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: data.user.email,
      role: 'authenticated',
    } as unknown as User,
  };

  setDevSession(session);
  return session;
}

let cachedBrowserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // Si no está en el navegador, devolvemos el cliente estándar
  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  if (cachedBrowserClient) {
    return cachedBrowserClient;
  }

  const realClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project-id');

  // Interceptar auth para soportar el modo Dev/Mock con Neon
  const wrappedAuth = new Proxy(realClient.auth, {
    get(target, prop, receiver) {
      if (prop === 'getUser') {
        return async () => {
          const devSession = getDevSession();
          if (devSession) {
            return { data: { user: devSession.user }, error: null };
          }
          if (!isSupabaseConfigured) {
            return { data: { user: null }, error: null };
          }
          try {
            return await target.getUser();
          } catch (err) {
            return { data: { user: null }, error: err as any };
          }
        };
      }

      if (prop === 'getSession') {
        return async () => {
          const devSession = getDevSession();
          if (devSession) {
            return { data: { session: devSession as unknown as Session }, error: null };
          }
          if (!isSupabaseConfigured) {
            return { data: { session: null }, error: null };
          }
          try {
            return await target.getSession();
          } catch (err) {
            return { data: { session: null }, error: err as any };
          }
        };
      }

      if (prop === 'signOut') {
        return async () => {
          setDevSession(null);
          try {
            if (isSupabaseConfigured) {
              await target.signOut();
            }
          } catch {
            // Ignorar errores de red en signOut
          }
          return { error: null };
        };
      }

      if (prop === 'signInWithPassword') {
        return async (credentials: { email?: string; password?: string }) => {
          if (!isSupabaseConfigured) {
            try {
              const session = await loginWithDevAccount(credentials.email);
              return { data: { user: session.user, session: session as unknown as Session }, error: null };
            } catch (err: any) {
              return { data: { user: null, session: null }, error: err };
            }
          }
          return await target.signInWithPassword(credentials as any);
        };
      }

      if (prop === 'signUp') {
        return async (credentials: { email?: string; password?: string; options?: any }) => {
          if (!isSupabaseConfigured) {
            try {
              const session = await loginWithDevAccount(
                credentials.email,
                credentials.options?.data?.name || credentials.options?.data?.full_name,
              );
              return { data: { user: session.user, session: session as unknown as Session }, error: null };
            } catch (err: any) {
              return { data: { user: null, session: null }, error: err };
            }
          }
          return await target.signUp(credentials as any);
        };
      }

      if (prop === 'updateUser') {
        return async (attributes: any, options?: any) => {
          const devSession = getDevSession();
          if (devSession || !isSupabaseConfigured) {
            if (devSession) {
              const updatedMetadata = {
                ...(devSession.user.user_metadata || {}),
                ...(attributes?.data || {}),
              };
              const updatedUser: User = {
                ...devSession.user,
                user_metadata: updatedMetadata,
                ...(attributes?.email ? { email: attributes.email } : {}),
              };
              const updatedSession: DevAuthSession = {
                ...devSession,
                user: updatedUser,
              };
              setDevSession(updatedSession);
              return { data: { user: updatedUser }, error: null };
            }
            return { data: { user: null }, error: new Error('No hay sesión de usuario activa en modo dev') as any };
          }
          try {
            return await target.updateUser(attributes, options);
          } catch (err) {
            return { data: { user: null }, error: err as any };
          }
        };
      }

      if (prop === 'onAuthStateChange') {
        return (callback: (event: any, session: any) => void) => {
          const devSession = getDevSession();
          if (devSession) {
            setTimeout(() => {
              callback('SIGNED_IN', devSession);
            }, 0);
          }

          const handleCustom = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            callback(detail.event, detail.session);
          };

          window.addEventListener('gestor_guita_auth_change', handleCustom);

          let realSub: { subscription: { unsubscribe: () => void } } | null = null;
          if (isSupabaseConfigured) {
            const { data } = target.onAuthStateChange((event, session) => {
              if (!getDevSession()) {
                callback(event, session);
              }
            });
            realSub = data;
          }

          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  window.removeEventListener('gestor_guita_auth_change', handleCustom);
                  if (realSub?.subscription) {
                    realSub.subscription.unsubscribe();
                  }
                },
              },
            },
          };
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });

  cachedBrowserClient = new Proxy(realClient, {
    get(target, prop, receiver) {
      if (prop === 'auth') {
        return wrappedAuth;
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as unknown as SupabaseClient;

  return cachedBrowserClient;
}

import { createBrowserClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';

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

export async function loginWithDevAccount(email?: string, name?: string): Promise<DevAuthSession> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
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

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const realClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project-id');

  // Si no está en el navegador, devolvemos el cliente estándar
  if (typeof window === 'undefined') {
    return realClient;
  }

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

          const { data: sub } = target.onAuthStateChange((event, session) => {
            if (!getDevSession()) {
              callback(event, session);
            }
          });

          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  window.removeEventListener('gestor_guita_auth_change', handleCustom);
                  sub.subscription.unsubscribe();
                },
              },
            },
          };
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });

  return new Proxy(realClient, {
    get(target, prop, receiver) {
      if (prop === 'auth') {
        return wrappedAuth;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

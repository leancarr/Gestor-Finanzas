'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { LogoutButton } from '@/components/auth/LogoutButton';


export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const supabase = createClient();
  const isEnvConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoadingInitial(false);
    }).catch(() => {
      setUser(null);
      setLoadingInitial(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoadingInitial(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    startTransition(async () => {
      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: fullName || undefined,
              },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            setErrorMessage(error.message);
            return;
          }

          if (data.session) {
            setSuccessMessage('¡Cuenta creada y sesión iniciada exitosamente!');
            router.push('/');
          } else {
            setSuccessMessage(
              '¡Registro exitoso! Revisa tu bandeja de correo para confirmar tu cuenta.'
            );
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            setErrorMessage(
              error.message === 'Invalid login credentials'
                ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
                : error.message
            );
            return;
          }

          setSuccessMessage('¡Inicio de sesión exitoso!');
          router.push('/');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Ocurrió un error inesperado');
      }
    });
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al iniciar con proveedor social');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 mb-6 transition-colors px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 backdrop-blur w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al Inicio
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl font-bold text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-950/50">
            💰
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Gestor Guita
            </h2>
            <p className="text-xs text-slate-400">
              Autenticación & Perfil con Supabase
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {/* Supabase Configuration Banner if using placeholders */}
        {!isEnvConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200/90 backdrop-blur">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">
                  Modo Placeholder Detectado:
                </span>
                <p className="mt-1 text-amber-200/80 leading-relaxed">
                  Para conectar con tu proyecto real de Supabase, agrega tus credenciales en{' '}
                  <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded font-mono">
                    .env
                  </code>{' '}
                  o{' '}
                  <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded font-mono">
                    apps/web/.env.local
                  </code>{' '}
                  (variables <code className="text-amber-300">NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
                  <code className="text-amber-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>).
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
              <span className="text-xs">Verificando estado de sesión...</span>
            </div>
          ) : user ? (
            /* Logged in state view */
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {user.user_metadata?.name || 'Sesión Activa'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[240px]">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-slate-950/60 p-4 text-xs border border-slate-800/80 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>User ID:</span>
                  <span className="text-slate-200 truncate max-w-[180px]">{user.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rol:</span>
                  <span className="text-emerald-400 font-semibold">{user.role || 'authenticated'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Proveedor:</span>
                  <span className="text-slate-300 capitalize">{user.app_metadata?.provider || 'email'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Último acceso:</span>
                  <span className="text-slate-300">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-AR') : 'Reciente'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Ir al Dashboard
                </Link>
                <LogoutButton variant="danger" onLoggedOut={() => setUser(null)} />
              </div>
            </div>
          ) : (
            /* Login / Signup form view */
            <div>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    !isSignUp
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isSignUp
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Nombre completo (opcional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Juan Pérez"
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu-email@ejemplo.com"
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium text-slate-300"
                    >
                      Contraseña
                    </label>
                    {!isSignUp && (
                      <span className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer">
                        ¿Olvidaste tu clave?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition-all duration-200 disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : isSignUp ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Crear Cuenta
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </form>

              {/* Social Login Separator */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-900 px-3 text-slate-500">
                      O continuar con
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('google')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.4 0 10.1 0 12s.6 3.6 1.6 5.6l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('github')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Security & RLS Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Shield className="h-3.5 w-3.5 text-emerald-500/60" />
          <span>Protegido con Supabase Auth & Row Level Security (RLS)</span>
        </div>
      </div>
    </div>
  );
}

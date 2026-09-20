'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  Trash2,
  Fingerprint,
  Check,
  Copy,
  BarChart3,
  DollarSign,
  Layers,
  Repeat,
  Target,
  Users,
  Bot,
  TrendingUp,
} from 'lucide-react';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { UserStatus } from '@/components/auth/UserStatus';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import {
  getProfile,
  updateProfile,
  UserProfile,
} from '@/utils/api/profile';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Status feedback
  const [isSaving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal de zona de peligro
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const supabase = createClient();

  // Escuchar estado de sesión
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setIsAuthLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Cargar perfil del usuario
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getProfile()
      .then((data) => {
        if (isMounted && data) {
          setProfile(data);
          setName(data.name || '');
          setAvatarUrl(data.avatarUrl);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Error al recuperar los datos del perfil.';
          setFeedback({ type: 'error', message: msg });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Auto-ocultar feedback después de 5 segundos
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Manejar guardado de datos personales
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const updated = await updateProfile({
          name: name.trim(),
          avatarUrl,
        });

        setProfile(updated);
        setName(updated.name || '');
        setAvatarUrl(updated.avatarUrl);
        setFeedback({
          type: 'success',
          message: '¡Tu perfil ha sido actualizado con éxito!',
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Ocurrió un fallo al guardar las modificaciones.';
        setFeedback({ type: 'error', message: msg });
      }
    });
  };

  // Manejar cambio de avatar
  const handleAvatarChange = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
    // Guardar inmediatamente la actualización del avatar
    startTransition(async () => {
      try {
        const updated = await updateProfile({
          name: name.trim(),
          avatarUrl: newAvatarUrl,
        });
        setProfile(updated);
        setFeedback({
          type: 'success',
          message: newAvatarUrl
            ? '¡Foto de perfil actualizada correctamente!'
            : 'Foto de perfil eliminada.',
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Error al actualizar el avatar.';
        setFeedback({ type: 'error', message: msg });
      }
    });
  };

  // Copiar UUID al portapapeles
  const handleCopyId = () => {
    if (!profile?.id) return;
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedRegisterDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No disponible';

  const formattedLastSignIn = profile?.lastSignInAt
    ? new Date(profile.lastSignInAt).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Reciente';

  const hasNameChanged = (profile?.name || '') !== name.trim();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* ========================================================================= */}
        {/* HEADER & NAVEGACIÓN                                                       */}
        {/* ========================================================================= */}
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                title="Volver al Inicio"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <UserIcon className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Configuración de Perfil
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 ml-12 sm:ml-0">
              Administra tu identidad, preferencias y derechos de privacidad GDPR
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <VaultSelector />
            <Link
              href="/gastos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Gastos
            </Link>
            <Link
              href="/bovedas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              Bóvedas
            </Link>
            <Link
              href="/suscripciones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Repeat className="h-3.5 w-3.5 text-emerald-400" />
              Suscripciones
            </Link>
            <Link
              href="/categorias"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Categorías
            </Link>
            <Link
              href="/presupuestos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Presupuestos
            </Link>
            <Link
              href="/inversiones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Inversiones
            </Link>
            <Link
              href="/analiticas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              Analíticas
            </Link>
            <Link
              href="/asistente"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer shadow-sm"
            >
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              Asistente
            </Link>
            <UserStatus />
          </div>
        </header>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`flex items-center justify-between rounded-2xl p-4 text-xs shadow-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 underline cursor-pointer ml-4"
            >
              Descartar
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ESTADO NO AUTENTICADO                                                     */}
        {/* ========================================================================= */}
        {!isAuthLoading && !user && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center space-y-4 backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 ring-1 ring-slate-700">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Sesión Requerida</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Debes iniciar sesión para consultar y modificar la información de tu perfil o gestionar tus derechos GDPR.
            </p>
            <div className="pt-2">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              >
                Iniciar Sesión en Gestor Guita
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA PRINCIPAL DE PERFIL (AUTENTICADO)                                   */}
        {/* ========================================================================= */}
        {user && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Sección 1: Avatar Interactivo */}
            <section>
              <AvatarUpload
                avatarUrl={avatarUrl}
                name={name || profile?.name}
                onAvatarChange={handleAvatarChange}
                disabled={isSaving || isDataLoading}
              />
            </section>

            {/* Sección 2: Formulario de Datos Personales */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-emerald-400" />
                    Datos Personales
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica cómo te identificas dentro del ecosistema de la app
                  </p>
                </div>
                {isDataLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>Cargando datos...</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Nombre de Visualización */}
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="display-name"
                      className="block text-xs font-semibold text-slate-300"
                    >
                      Nombre de Visualización
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <input
                        id="display-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        disabled={isSaving || isDataLoading}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Este nombre se mostrará en los saludos del dashboard y encabezados de la aplicación.
                    </p>
                  </div>

                  {/* Correo Electrónico (Solo Lectura) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="user-email"
                        className="block text-xs font-semibold text-slate-300"
                      >
                        Correo Electrónico
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <Lock className="h-3 w-3 text-slate-500" />
                        Solo lectura
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        id="user-email"
                        type="email"
                        value={profile?.email || user.email || ''}
                        disabled
                        className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-slate-400 cursor-not-allowed select-none font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Gestionado de forma segura por Supabase Auth.
                    </p>
                  </div>

                  {/* Fecha de Registro (Solo Lectura) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="created-at"
                        className="block text-xs font-semibold text-slate-300"
                      >
                        Fecha de Registro
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        Inmutable
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <input
                        id="created-at"
                        type="text"
                        value={formattedRegisterDate}
                        disabled
                        className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-slate-400 cursor-not-allowed select-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Fecha en que se creó la cuenta en el sistema.
                    </p>
                  </div>
                </div>

                {/* Botón Guardar Cambios */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || isDataLoading || !hasNameChanged}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition transform hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando Cambios...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Sección 3: Seguridad, Auditoría y Aislamiento RLS */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    Seguridad & Metadatos de Sesión
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Información técnica de protección criptográfica y acceso
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Identificador UUID */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Fingerprint className="h-3 w-3 text-slate-400" />
                    ID de Usuario (UUID)
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-300 truncate">
                      {profile?.id || user.id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                      title="Copiar ID"
                    >
                      {copiedId ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Proveedor y Rol */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-1.5">
                  <span className="text-[11px] text-slate-500">Proveedor / Rol</span>
                  <p className="font-semibold text-xs text-white capitalize flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    {profile?.provider || user.app_metadata?.provider || 'email'}
                    <span className="text-[10px] font-normal text-slate-400">
                      ({profile?.role || user.role || 'authenticated'})
                    </span>
                  </p>
                </div>

                {/* Último Acceso */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-1.5">
                  <span className="text-[11px] text-slate-500">Último Acceso Registrado</span>
                  <p className="font-semibold text-xs text-slate-200">
                    {formattedLastSignIn}
                  </p>
                </div>
              </div>

              {/* Banner de RLS */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300 leading-relaxed">
                  <strong className="font-semibold text-white">Row Level Security (RLS) Activo:</strong> Todas tus transacciones, categorías y balances están blindados con aislamiento estricto en el motor PostgreSQL vinculado exclusivamente a tu UUID.
                </p>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECCIÓN 4: ZONA DE PELIGRO (GDPR COMPLIANCE)                              */}
            {/* ========================================================================= */}
            <section className="rounded-3xl border border-rose-500/30 bg-rose-950/10 p-6 sm:p-8 backdrop-blur-md space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white sm:text-lg">
                    Zona de Peligro (GDPR Compliance)
                  </h2>
                  <p className="text-xs text-rose-300/80 leading-relaxed">
                    Ejercicio del <strong>Derecho al Olvido</strong> estipulado en el Artículo 17 del Reglamento General de Protección de Datos (GDPR).
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 sm:p-5 text-xs text-slate-300 space-y-3 leading-relaxed">
                <p className="text-rose-200 font-semibold">
                  ⚠️ Aviso importante sobre la destrucción de datos:
                </p>
                <p>
                  Al ejecutar la eliminación de tu cuenta, la operación es <strong>totalmente irreversible</strong>. Se destruirán de forma inmediata y definitiva:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                  <li>Todos los registros de gastos, compras e ingresos.</li>
                  <li>Todas las categorías personalizadas y sus clasificaciones asociadas.</li>
                  <li>Archivos y avatares almacenados en Supabase Storage.</li>
                  <li>Caché sin conexión e historial encolado en IndexedDB.</li>
                  <li>Credenciales de acceso, sesiones activas y metadatos de usuario.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <div className="text-xs text-slate-400">
                  Una vez confirmada, no será posible recuperar ningún historial financiero.
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600/90 hover:bg-rose-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-rose-950/60 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar mi cuenta y todos mis datos
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Modal de confirmación estricta GDPR */}
        {user && (
          <DeleteAccountModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            userEmail={user.email || 'tu cuenta'}
          />
        )}
      </div>
    </main>
  );
}

'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
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
  Globe,
} from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import {
  getProfile,
  updateProfile,
  UserProfile,
} from '@/utils/api/profile';
import {
  SUPPORTED_COUNTRIES,
  SupportedCountryCode,
  getActiveCountry,
  setActiveCountry,
} from '@/utils/api/rates';
import { usePrefs } from '@/lib/prefs';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function PerfilPage() {
  const { t, lang } = usePrefs();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [country, setCountry] = useState<SupportedCountryCode>('AR');

  // Status feedback
  const [isSaving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal de zona de peligro
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Inicializar país desde rates / localStorage
  useEffect(() => {
    const current = getActiveCountry();
    setCountry(current.code);

    const handleCountryChange = () => {
      const active = getActiveCountry();
      setCountry(active.code);
    };
    window.addEventListener('gestorguita_country_updated', handleCountryChange);
    return () => {
      window.removeEventListener('gestorguita_country_updated', handleCountryChange);
    };
  }, []);

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
    if (!user) {
      setIsDataLoading(false);
      return;
    }
    let isMounted = true;
    setIsDataLoading(true);

    getProfile()
      .then((data) => {
        if (isMounted && data) {
          setProfile(data);
          setName(data.name || '');
          setAvatarUrl(data.avatarUrl);
          if (data.country && SUPPORTED_COUNTRIES[data.country as SupportedCountryCode]) {
            setCountry(data.country as SupportedCountryCode);
            setActiveCountry(data.country as SupportedCountryCode);
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : t.profile.feedbackError;
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
  }, [user, t.profile.feedbackError]);

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
          country,
        });

        setProfile(updated);
        setName(updated.name || '');
        setAvatarUrl(updated.avatarUrl);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gestorguita_avatar_updated', {
              detail: { avatarUrl },
            })
          );
        }
        setFeedback({
          type: 'success',
          message: t.profile.feedbackSuccess,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : t.profile.feedbackError;
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
          country,
        });
        setProfile(updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gestorguita_avatar_updated', {
              detail: { avatarUrl: newAvatarUrl },
            })
          );
        }
        setFeedback({
          type: 'success',
          message: newAvatarUrl
            ? t.profile.avatarUpdated
            : t.profile.avatarRemoved,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : t.profile.avatarError;
        setFeedback({ type: 'error', message: msg });
      }
    });
  };

  // Manejar cambio de país y régimen fiscal
  const handleCountryChange = (code: SupportedCountryCode) => {
    setCountry(code);
    const updated = setActiveCountry(code);

    startTransition(async () => {
      try {
        await updateProfile({
          name: name.trim(),
          avatarUrl,
          country: code,
        });
        setFeedback({
          type: 'success',
          message: `${t.profile.countrySaved} ${updated.name} (${updated.currency})`,
        });
      } catch {
        // En caso de fallo en backend, el localStorage y evento ya adaptan la sesión local
      }
    });
  };

  const formattedRegisterDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t.profile.notAvailable;

  const formattedLastSignIn = profile?.lastSignInAt
    ? new Date(profile.lastSignInAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t.profile.recent;

  const hasNameChanged = (profile?.name || '') !== name.trim();

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* HEADER */}
        <header className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border transition cursor-pointer"
                title={t.profile.backToDashboard}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <UserIcon className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t.profile.title}
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground ml-12 sm:ml-0">
              {t.profile.subtitle}
            </p>
          </div>
        </header>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`flex items-center justify-between rounded-2xl p-4 text-xs shadow-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
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
              {t.profile.discard}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ESTADO NO AUTENTICADO                                                     */}
        {/* ========================================================================= */}
        {!isAuthLoading && !user && (
          <div className="rounded-3xl border border-hairline bg-card p-8 text-center space-y-4 backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t.profile.sessionRequired}</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t.profile.sessionRequiredDesc}
            </p>
            <div className="pt-2">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              >
                {t.profile.signIn}
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

            {/* Sección 2: Selector de País y Moneda Base */}
            <section className="rounded-3xl border border-hairline bg-card p-6 sm:p-8 backdrop-blur-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    {t.profile.countryRegion}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.profile.countryRegionDesc}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold self-start sm:self-auto">
                  <span>{SUPPORTED_COUNTRIES[country]?.flag}</span>
                  <span>{SUPPORTED_COUNTRIES[country]?.currency}</span>
                  <span className="opacity-70 font-normal">({SUPPORTED_COUNTRIES[country]?.name})</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-foreground">
                  {t.profile.accountCountry}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {Object.values(SUPPORTED_COUNTRIES).map((c) => {
                    const isSelected = country === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountryChange(c.code)}
                        disabled={isSaving}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition cursor-pointer disabled:opacity-50 ${
                          isSelected
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                            : 'border-border/60 bg-surface/50 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        <span className="text-2xl shrink-0" role="img" aria-label={c.name}>
                          {c.flag}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{c.currency}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Sección 3: Formulario de Datos Personales */}
            <section className="rounded-3xl border border-hairline bg-card p-6 sm:p-8 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-emerald-400" />
                    {t.profile.personalData}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.profile.personalDataDesc}
                  </p>
                </div>
                {isDataLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>{t.profile.loadingData}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Nombre de Visualización */}
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="display-name"
                      className="block text-xs font-semibold text-foreground"
                    >
                      {t.profile.displayName}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <input
                        id="display-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.profile.displayNamePlaceholder}
                        disabled={isSaving || isDataLoading}
                        className="w-full rounded-2xl border border-border/80 bg-surface/50 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {t.profile.displayNameHint}
                    </p>
                  </div>

                  {/* Correo Electrónico (Solo Lectura) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="user-email"
                        className="block text-xs font-semibold text-foreground"
                      >
                        {t.profile.email}
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        {t.profile.readOnly}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        id="user-email"
                        type="email"
                        value={profile?.email || user.email || ''}
                        disabled
                        className="w-full rounded-2xl border border-border/60 bg-muted/40 pl-10 pr-4 py-3 text-sm text-muted-foreground cursor-not-allowed select-none font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {t.profile.emailHint}
                    </p>
                  </div>

                  {/* Fecha de Registro (Solo Lectura) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="created-at"
                        className="block text-xs font-semibold text-foreground"
                      >
                        {t.profile.registerDate}
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {t.profile.immutable}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <input
                        id="created-at"
                        type="text"
                        value={formattedRegisterDate}
                        disabled
                        className="w-full rounded-2xl border border-border/60 bg-muted/40 pl-10 pr-4 py-3 text-sm text-muted-foreground cursor-not-allowed select-none"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {t.profile.registerDateHint}
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
                        {t.profile.saving}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t.profile.saveChanges}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Sección 4: Seguridad y Privacidad */}
            <section className="rounded-3xl border border-hairline bg-card p-6 sm:p-8 backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    {t.profile.securityTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.profile.securitySubtitle}
                  </p>
                </div>
              </div>

              {/* Badge sobrio y profesional: Cuenta protegida y blindada */}
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 sm:p-5 flex items-start sm:items-center gap-4 backdrop-blur-sm shadow-inner">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 shadow-md">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-foreground tracking-wide">
                      {t.profile.accountShielded}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      {t.profile.active}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.profile.accountShieldedDesc}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                {/* Estado de Protección */}
                <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 space-y-1.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t.profile.protectionStatus}
                  </span>
                  <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <span className="text-emerald-400">{t.profile.privacyShield}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.profile.strictIsolation}
                  </p>
                </div>

                {/* Proveedor y Sesión */}
                <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 space-y-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">{t.profile.authMethod}</span>
                  <p className="font-semibold text-xs text-foreground capitalize flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    {profile?.provider || user.app_metadata?.provider || t.session.secureEmail}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.profile.encryptedSession}
                  </p>
                </div>

                {/* Último Acceso */}
                <div className="rounded-2xl border border-border/70 bg-surface/50 p-4 space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <span className="text-[11px] text-muted-foreground font-medium">{t.profile.lastSignIn}</span>
                  <p className="font-semibold text-xs text-foreground">
                    {formattedLastSignIn}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.profile.recentActivity}
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECCIÓN 5: ZONA DE PELIGRO (GDPR COMPLIANCE)                              */}
            {/* ========================================================================= */}
            <section className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6 sm:p-8 backdrop-blur-md space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-foreground sm:text-lg">
                    {t.profile.dangerZone}
                  </h2>
                  <p className="text-xs text-rose-400/90 leading-relaxed">
                    {t.profile.rightToErasure}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 sm:p-5 text-xs text-foreground space-y-3 leading-relaxed">
                <p className="text-rose-400 font-semibold">
                  {t.profile.warningDestruction}
                </p>
                <p>
                  {t.profile.warningIrreversible}
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  {t.profile.destructionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <div className="text-xs text-muted-foreground">
                  {t.profile.irreversibleNotice}
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-rose-950/60 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.profile.deleteAccount}
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

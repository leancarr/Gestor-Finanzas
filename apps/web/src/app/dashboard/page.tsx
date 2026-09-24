'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ExpensesSummaryCards } from '@/components/dashboard/ExpensesSummaryCards';
import { ExpensesDonutChart } from '@/components/dashboard/ExpensesDonutChart';
import { RecentExpensesList } from '@/components/dashboard/RecentExpensesList';
import {
  getExpensesSummary,
  getRecentExpenses,
  ExpensesSummary,
  ExpenseItem,
} from '@/utils/api/expenses';
import { MagicInput } from '@/components/dashboard/MagicInput';
import { UpcomingDuesWidget } from '@/components/dashboard/UpcomingDuesWidget';
import { DolarRatesModal } from '@/components/rates/DolarRatesModal';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shield,
  Sparkles,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Users,
  Coins,
} from 'lucide-react';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { useVaultStore } from '@/stores/useVaultStore';
import { getApiUrl } from '@/utils/api/config';
import {
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  CURRENCY_LIST,
  FALLBACK_RATES,
  getRates,
} from '@/utils/api/rates';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface HealthResponse {
  status: string;
  uptime: number;
  database: {
    status: string;
    latencyMs: number;
    error?: string;
  };
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Multi-tenant vault context (SEI-46)
  const { activeVault, activeVaultId, clearActiveVault } = useVaultStore();

  // User role in active vault
  const userVaultRole = useMemo(() => {
    if (!activeVault || !user) return null;
    if (activeVault.ownerId === user.id) return 'OWNER';
    const member = activeVault.members?.find(
      (m) =>
        m.userId === user.id ||
        (m.user?.email && m.user.email.toLowerCase() === user.email?.toLowerCase()),
    );
    return member?.role || null;
  }, [activeVault, user]);

  const roleBadgeConfig = useMemo(() => {
    if (!userVaultRole) {
      return {
        label: 'Miembro',
        className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      };
    }
    switch (userVaultRole) {
      case 'OWNER':
        return {
          label: '👑 Propietario',
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'ADMIN':
        return {
          label: '⚡ Administrador',
          className: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'VIEWER':
        return {
          label: '👁️ Observador',
          className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        };
      case 'MEMBER':
      default:
        return {
          label: '👥 Miembro',
          className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
    }
  }, [userVaultRole]);

  // Month navigation state
  const currentDate = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  // Dashboard data state
  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Multi-currency preferences (SEI-25)
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gestor_preferred_currency');
        if (saved && (SUPPORTED_CURRENCIES as readonly string[]).includes(saved)) {
          return saved as SupportedCurrency;
        }
      } catch {}
    }
    return 'ARS';
  });
  const [rates, setRates] = useState<Record<SupportedCurrency, number>>(FALLBACK_RATES);

  // Load real-time exchange rates
  useEffect(() => {
    getRates().then((res) => {
      if (res && res.rates) {
        setRates(res.rates);
      }
    });
  }, []);

  const [isDolarModalOpen, setIsDolarModalOpen] = useState(false);
  const [selectedUsdRateType, setSelectedUsdRateType] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('preferred_usd_rate_type') || 'blue';
      } catch {}
    }
    return 'blue';
  });

  const handleSelectRateType = (rateType: string, rateValue: number) => {
    setSelectedUsdRateType(rateType);
    setRates((prev) => ({
      ...prev,
      USD: rateValue,
    }));
    try {
      localStorage.setItem('preferred_usd_rate_type', rateType);
    } catch {}
  };

  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setPreferredCurrency(newCurrency);
    try {
      localStorage.setItem('gestor_preferred_currency', newCurrency);
    } catch {}
  };

  // Health check state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const apiUrl = getApiUrl();
  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  const supabase = useMemo(() => createClient(), []);

  // Listen to auth user state
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

  // Load dashboard data on mount and whenever user, date, currency, activeVault or reloadKey changes
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    Promise.all([
      getExpensesSummary(
        selectedMonth,
        selectedYear,
        preferredCurrency,
        activeVaultId || undefined,
      ),
      getRecentExpenses(5, activeVaultId || undefined),
    ])
      .then(([summaryData, recentData]) => {
        if (isMounted) {
          setSummary(summaryData);
          setRecentExpenses(recentData);
          setError(null);
          setIsDataLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Error al sincronizar los datos del dashboard.';
          setError(msg);
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, selectedMonth, selectedYear, preferredCurrency, activeVaultId, reloadKey]);

  const handleRefresh = () => {
    setIsDataLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setIsDataLoading(true);
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setIsDataLoading(true);
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    setIsDataLoading(true);
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
  };

  const isCurrentMonthSelected =
    selectedMonth === currentDate.getMonth() + 1 &&
    selectedYear === currentDate.getFullYear();

  // Health check fetcher
  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${apiUrl}/health`);
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Usuario';

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Navigation & Header */}
        <header className="flex flex-col items-center justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl font-bold text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-950/40">
              💰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Gestor Guita
                </h1>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistema de tracking financiero personal multi-moneda con IA
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user && (
              <>
                <VaultSelector />
                <Link
                  href="/gastos/nuevo"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Gasto
                </Link>
              </>
            )}
          </div>
        </header>

        {/* ========================================================================= */}
        {/* UNAUTHENTICATED HERO VIEW                                                */}
        {/* ========================================================================= */}
        {!isAuthLoading && !user && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-8 sm:p-12 shadow-2xl backdrop-blur">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gestión Inteligente de Finanzas Personales
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Toma el control total de tu guita en pesos y dólares
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Registra gastos de forma ágil, visualiza gráficos interactivos de distribución por categoría y resguarda toda tu información con seguridad multi-inquilino de nivel bancario (Row Level Security).
                </p>
                <div className="pt-2 flex flex-wrap gap-4">
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-950/50 transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    Comenzar Ahora — Iniciar Sesión
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Dashboard en Tiempo Real
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gráficos interactivos de donut y resúmenes analíticos mensuales automáticos calculados al instante.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Categorías Personalizadas
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Crea y clasifica tus gastos con paletas de color vibrantes e íconos intuitivos adaptados a tu estilo de vida.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Privacidad & Aislamiento RLS
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tus registros financieros quedan 100% aislados a nivel motor PostgreSQL con Supabase Auth.
                </p>
              </div>
            </div>

            {/* System Status Inspector */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Live System & Health Check
                  </h3>
                  <p className="text-xs text-slate-400">
                    Estado de la infraestructura conectada
                  </p>
                </div>
                <button
                  onClick={checkHealth}
                  disabled={healthLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${healthLoading ? 'animate-spin' : ''}`}
                  />
                  {healthLoading ? 'Verificando...' : 'Comprobar Estado'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                  <span className="text-slate-500">Frontend</span>
                  <p className="font-semibold text-emerald-400">Next.js 16</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                  <span className="text-slate-500">Backend API</span>
                  <p className="font-semibold text-emerald-400">NestJS v12</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                  <span className="text-slate-500">Base de Datos</span>
                  <p className="font-semibold text-emerald-400">PostgreSQL (RLS)</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                  <span className="text-slate-500">Auth Service</span>
                  <p className="font-semibold text-emerald-400">
                    {isSupabaseConfigured ? 'Supabase SSR' : 'Configurado'}
                  </p>
                </div>
              </div>

              {health && (
                <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs font-mono text-emerald-300 border border-slate-800">
                  {JSON.stringify(health, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AUTHENTICATED DASHBOARD VIEW                                             */}
        {/* ========================================================================= */}
        {user && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Period Navigator & User Greeting */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Hola, <span className="text-emerald-400">{displayName}</span> 👋
                </h2>
                <p className="text-xs text-slate-400">
                  Resumen de actividad financiera en{' '}
                  <span className="font-semibold text-slate-200">
                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </span>
                </p>
                {preferredCurrency !== 'ARS' && (
                  <button
                    type="button"
                    onClick={() => setIsDolarModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-[11px] text-amber-300 font-medium transition cursor-pointer"
                    title="Click para ver todas las cotizaciones de dólares"
                  >
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>
                      Visualizando en {preferredCurrency} (1 {preferredCurrency} ≈ ${rates[preferredCurrency]?.toLocaleString('es-AR')} ARS)
                    </span>
                    <span className="underline ml-1 text-amber-200">Ver cotizaciones</span>
                  </button>
                )}
              </div>

              {/* Controls: Currency Selector & Month Selector */}
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                {/* Preferred Currency Selector (SEI-25) */}
                <div className="flex items-center gap-1.5">
                  <span className="hidden md:flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    Moneda:
                  </span>
                  <div className="flex items-center p-1 rounded-2xl border border-slate-800 bg-slate-950/80 shadow-inner text-xs">
                    {SUPPORTED_CURRENCIES.map((code) => {
                      const isSelected = preferredCurrency === code;
                      const info = CURRENCY_LIST[code];
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleCurrencyChange(code)}
                          className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title={`Ver Dashboard en ${info.name}`}
                        >
                          <span>{info.flag}</span>
                          <span>{code}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDolarModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition cursor-pointer shadow-sm"
                    title="Ver cotizaciones de todos los dólares (Blue, MEP, Oficial, Tarjeta, Cripto)"
                  >
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Dólares</span>
                  </button>
                </div>

                {/* Month Selector Controls */}
                <div className="flex items-center rounded-2xl border border-slate-800 bg-slate-950/80 p-1 shadow-inner">
                  <button
                    onClick={handlePrevMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="px-3 text-xs font-bold text-white min-w-[130px] text-center">
                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {!isCurrentMonthSelected && (
                  <button
                    onClick={handleCurrentMonth}
                    className="flex items-center gap-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                    title="Ir al mes actual"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Hoy
                  </button>
                )}

                <button
                  onClick={handleRefresh}
                  disabled={isDataLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer disabled:opacity-50"
                  title="Recargar datos"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isDataLoading ? 'animate-spin text-emerald-400' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* AI Magic Input Bar */}
            <MagicInput onSuccess={handleRefresh} />

            {/* Upcoming Recurring Dues Alert Banner */}
            <UpcomingDuesWidget onRefreshParent={handleRefresh} />

            {/* Error Notification */}
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-1 text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Reintentar conexión &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ACTIVE WORKSPACE / SHARED VAULT BANNER (SEI-46)                           */}
            {/* ========================================================================= */}
            {activeVault && (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-950/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-emerald-950/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] animate-in fade-in duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Vault Identity & Meta Badges */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xl" role="img" aria-label="Espacio de Trabajo">
                        🏛️
                      </span>
                      <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                        Espacio de Trabajo: {activeVault.name}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        Bóveda Compartida
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeConfig.className}`}
                      >
                        {roleBadgeConfig.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                        <Users className="h-3.5 w-3.5 text-emerald-400" />
                        {activeVault.members?.length || 1}{' '}
                        {(activeVault.members?.length || 1) === 1
                          ? 'integrante'
                          : 'integrantes'}
                      </span>
                      {activeVault.description && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="truncate max-w-md text-slate-400">
                            {activeVault.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Navigation & Context Management Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
                    <Link
                      href="/bovedas"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Gestionar Integrantes</span>
                    </Link>
                    <button
                      type="button"
                      onClick={clearActiveVault}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-600 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white shadow-sm transition cursor-pointer"
                      title="Volver a la vista de cuenta personal"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                      <span>Volver a Mi Cuenta Personal</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Summary Cards */}
            <ExpensesSummaryCards
              summary={summary}
              loading={isDataLoading}
              currency={preferredCurrency}
              rates={rates}
            />

            {/* Main Visuals Grid: Chart + Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Donut Chart (7 cols on large screens) */}
              <div className="lg:col-span-7">
                <ExpensesDonutChart
                  categories={summary?.byCategory || []}
                  totalAmount={summary?.totalAmount || 0}
                  loading={isDataLoading}
                  currency={preferredCurrency}
                  rates={rates}
                  summaryCurrency={summary?.currency}
                />
              </div>

              {/* Recent 5 Expenses (5 cols on large screens) */}
              <div className="lg:col-span-5">
                <RecentExpensesList
                  expenses={recentExpenses}
                  loading={isDataLoading}
                  preferredCurrency={preferredCurrency}
                  rates={rates}
                />
              </div>
            </div>

            {/* Quick Actions Footer Banner */}
            <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-900/60 p-6 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-bold text-white">
                  ¿Registraste un nuevo movimiento hoy?
                </h3>
                <p className="text-xs text-slate-400">
                  Mantén al día tu balance financiero registrando cada compra o servicio en segundos.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/gastos/nuevo"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Gasto
                </Link>
                <Link
                  href="/gastos"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  Ver Historial Completo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <DolarRatesModal
        isOpen={isDolarModalOpen}
        onClose={() => setIsDolarModalOpen(false)}
        selectedRateType={selectedUsdRateType}
        onSelectRateType={handleSelectRateType}
      />
    </main>
  );
}

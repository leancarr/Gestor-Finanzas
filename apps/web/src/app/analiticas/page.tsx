'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  Coins,
  ShieldCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Repeat,
  Target,
  Users,
  Bot,
} from 'lucide-react';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { UserStatus } from '@/components/auth/UserStatus';
import {
  getAnalytics,
  AnalyticsData,
  AnalyticsRange,
} from '@/utils/api/analytics';
import { AnalyticsKpiCards } from '@/components/analytics/AnalyticsKpiCards';
import { ExpenseTimelineChart } from '@/components/analytics/ExpenseTimelineChart';
import { AnalyticsCategoryBreakdown } from '@/components/analytics/AnalyticsCategoryBreakdown';
import {
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  CURRENCY_LIST,
  FALLBACK_RATES,
  getRates,
} from '@/utils/api/rates';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const RANGE_OPTIONS: Array<{
  id: AnalyticsRange;
  label: string;
  description: string;
}> = [
  { id: '7d', label: '7 Días', description: 'Últimos 7 días' },
  { id: '30d', label: '30 Días', description: 'Últimos 30 días' },
  { id: 'month', label: 'Mes Actual', description: 'Desde el día 1' },
];

export default function AnaliticasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Filtros de analíticas
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [currency, setCurrency] = useState<SupportedCurrency>('ARS');
  const [rates, setRates] = useState<Record<SupportedCurrency, number>>(FALLBACK_RATES);

  // Datos
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Escuchar sesión de Supabase Auth
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

  // Cargar tasas de cambio
  useEffect(() => {
    getRates().then((res) => {
      if (res && res.rates) {
        setRates(res.rates);
      }
    });
  }, []);

  // Control de recarga manual
  const [reloadKey, setReloadKey] = useState(0);

  const handleRefresh = () => {
    setIsDataLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const handleRangeChange = (newRange: AnalyticsRange) => {
    setIsDataLoading(true);
    setRange(newRange);
  };

  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setIsDataLoading(true);
    setCurrency(newCurrency);
  };

  // Cargar métricas analíticas
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getAnalytics({
      range,
      currency,
      rates,
    })
      .then((analyticsData) => {
        if (isMounted) {
          setData(analyticsData);
          setError(null);
          setIsDataLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Error al calcular los datos analíticos.';
          setError(msg);
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, range, currency, rates, reloadKey]);

  const activeRangeOption = RANGE_OPTIONS.find((r) => r.id === range);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ========================================================================= */}
        {/* HEADER & NAVEGACIÓN SUPERIOR                                             */}
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
                <BarChart3 className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Tableros Analíticos
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 ml-12 sm:ml-0">
              Análisis comparativo de KPIs mes a mes, curva de gastos vs ingresos y concentración de presupuesto
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <VaultSelector />
            <Link
              href="/gastos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              Movimientos
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
              href="/categorias"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Categorías
            </Link>
            <Link
              href="/asistente"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer shadow-sm"
            >
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              Asistente
            </Link>
            <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-800 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SEI-30: Analytics
            </div>
            <UserStatus />
          </div>
        </header>

        {/* ========================================================================= */}
        {/* ESTADO NO AUTENTICADO                                                     */}
        {/* ========================================================================= */}
        {!isAuthLoading && !user && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-8 sm:p-12 shadow-2xl backdrop-blur text-center max-w-xl mx-auto space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-white">
              Inicia sesión para ver tus Analíticas
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Accede a métricas detalladas, curvas temporales con Recharts y variaciones periódicas protegidas por Supabase Auth.
            </p>
            <div className="pt-2">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-950/50 transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA PRINCIPAL CON DATOS AUTENTICADOS                                    */}
        {/* ========================================================================= */}
        {user && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Toolbar: Selector de Rango + Selector de Moneda */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              {/* Range Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span>Período:</span>
                </div>
                <div className="flex items-center p-1 rounded-2xl border border-white/10 bg-slate-950/70 shadow-inner">
                  {RANGE_OPTIONS.map((opt) => {
                    const isSelected = range === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleRangeChange(opt.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={opt.description}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <span className="hidden sm:inline text-xs text-slate-500">
                  ({activeRangeOption?.description})
                </span>
              </div>

              {/* Currency Selector & Reload */}
              <div className="flex items-center gap-3 self-start lg:self-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    Moneda:
                  </span>
                  <div className="flex items-center p-1 rounded-2xl border border-white/10 bg-slate-950/70 shadow-inner text-xs">
                    {SUPPORTED_CURRENCIES.map((code) => {
                      const isSelected = currency === code;
                      const info = CURRENCY_LIST[code];
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleCurrencyChange(code)}
                          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title={info.name}
                        >
                          <span>{info.flag}</span>
                          <span>{code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isDataLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer disabled:opacity-50"
                  title="Recargar análisis"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isDataLoading ? 'animate-spin text-emerald-400' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Reintentar sincronización &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* 1. SECCIÓN DE TARJETAS KPIS CON GLASSMORPHISM */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Indicadores Clave de Rendimiento (KPIs)
                  </h2>
                </div>
                {data?.isFallback && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Cálculo local reactivo
                  </span>
                )}
              </div>

              <AnalyticsKpiCards
                kpis={data?.kpis ?? null}
                currency={currency}
                loading={isDataLoading}
                range={range}
              />
            </section>

            {/* 2. SECCIÓN DE LÍNEA TEMPORAL: GASTOS VS INGRESOS (RECHARTS) */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Evolución y Curva Temporal
                </h2>
              </div>

              <ExpenseTimelineChart
                data={data?.timeline ?? []}
                currency={currency}
                loading={isDataLoading}
              />
            </section>

            {/* 3. SECCIÓN DE DESGLOSE POR CATEGORÍAS */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Distribución de Presupuesto
                </h2>
              </div>

              <AnalyticsCategoryBreakdown
                categories={data?.byCategory ?? []}
                totalExpenses={data?.kpis.totalExpenses ?? 0}
                currency={currency}
                loading={isDataLoading}
              />
            </section>

            {/* Footer de navegación rápida */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 via-white/[0.02] to-white/5 p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Optimiza tus decisiones financieras
                </h3>
                <p className="text-xs text-slate-400">
                  Compara períodos anteriores para identificar tendencias de consumo y mantener balances positivos.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/gastos/nuevo"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Gasto
                </Link>
                <Link
                  href="/gastos"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  Ver Todos los Gastos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

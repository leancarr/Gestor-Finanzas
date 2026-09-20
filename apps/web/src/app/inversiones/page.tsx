'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Plus,
  ArrowLeft,
  DollarSign,
  Repeat,
  Target,
  Layers,
  BarChart3,
  User as UserNavIcon,
  Users,
  Bot,
  Search,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Coins,
  Clock,
  Wallet,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { NetWorthHero } from '@/components/investments/NetWorthHero';
import { AssetCard } from '@/components/investments/AssetCard';
import { PortfolioDistributionChart } from '@/components/investments/PortfolioDistributionChart';
import { AssetModal } from '@/components/investments/AssetModal';
import { AssetDeleteModal } from '@/components/investments/AssetDeleteModal';
import {
  Asset,
  PortfolioSummary,
  getAssets,
  getPortfolioSummary,
  deleteAsset,
} from '@/utils/api/investments';
import { formatCurrency } from '@/utils/api/rates';

type FilterCategory = 'ALL' | 'CASH' | 'FIXED_TERM' | 'CEDEAR' | 'CRYPTO' | 'OTHER';

interface FilterTab {
  id: FilterCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'ALL', label: 'Todos', icon: Layers },
  { id: 'CASH', label: 'Efectivo', icon: Wallet },
  { id: 'FIXED_TERM', label: 'Plazos Fijos', icon: Clock },
  { id: 'CEDEAR', label: 'CEDEARs / Acciones', icon: TrendingUp },
  { id: 'CRYPTO', label: 'Cripto', icon: Coins },
  { id: 'OTHER', label: 'Otros', icon: HelpCircle },
];

export default function InversionesPage() {
  // Datos
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Moneda activa para la vista (ARS o USD)
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD'>('ARS');

  // Filtro y Búsqueda
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  // Carga de datos para mutaciones manuales y refresco
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assetsData, summaryData] = await Promise.all([
        getAssets(),
        getPortfolioSummary(),
      ]);
      setAssets(assetsData);
      setSummary(summaryData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar los datos del portafolio.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial asíncrona conforme a React 19
  useEffect(() => {
    let isMounted = true;
    Promise.all([getAssets(), getPortfolioSummary()])
      .then(([assetsData, summaryData]) => {
        if (isMounted) {
          setAssets(assetsData);
          setSummary(summaryData);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Ocurrió un error al cargar los datos del portafolio.';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers de Modales
  const handleOpenCreate = () => {
    setAssetToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (asset: Asset) => {
    setAssetToDelete(asset);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAsset(assetToDelete.id);
      showToast('success', `Activo "${assetToDelete.name}" eliminado del portafolio.`);
      setAssetToDelete(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el activo.';
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssetSaved = async (savedAsset: Asset) => {
    showToast(
      'success',
      assetToEdit
        ? `Activo "${savedAsset.name}" actualizado con éxito.`
        : `Activo "${savedAsset.name}" agregado a tu portafolio.`
    );
    await loadData();
  };

  // Filtrado de activos
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Filtro por categoría
      if (activeFilter === 'CASH') {
        if (asset.type !== 'CASH_ARS' && asset.type !== 'CASH_USD') return false;
      } else if (activeFilter !== 'ALL') {
        if (asset.type !== activeFilter) return false;
      }

      // Búsqueda por texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = asset.name.toLowerCase().includes(query);
        const matchesTicker = asset.ticker?.toLowerCase().includes(query);
        const matchesInstitution = asset.institution?.toLowerCase().includes(query);
        const matchesNotes = asset.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesTicker && !matchesInstitution && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [assets, activeFilter, searchQuery]);

interface PortfolioInsights {
  biggestAsset: Asset | null;
  biggestAssetValArs: number;
  bestPerfAsset: Asset | null;
  bestPerfPercent: number;
  nextDueDate: { asset: Asset; days: number } | null;
  usdExposurePercent: number;
}

  // Estadísticas clave de la cartera para la tarjeta de Insights
  const insights: PortfolioInsights | null = useMemo(() => {
    if (!assets.length || !summary) return null;

    const usdRate = summary.rates?.usdArs || 1180;

    let biggestAsset: Asset | null = null;
    let maxValArs = 0;

    let bestPerfAsset: Asset | null = null;
    let maxPerfPercent = -Infinity;

    let nextDueDate: { asset: Asset; days: number } | null = null;

    let totalUsdExposureArs = 0;

    assets.forEach((asset) => {
      const qty = Number(asset.quantity) || 0;
      const curPrice = Number(asset.currentPrice) || Number(asset.purchasePrice) || 0;
      const purPrice = Number(asset.purchasePrice) || curPrice;
      const isUsd = (asset.currency || 'ARS').toUpperCase() === 'USD';

      const valArs = isUsd ? qty * curPrice * usdRate : qty * curPrice;

      if (valArs > maxValArs) {
        maxValArs = valArs;
        biggestAsset = asset;
      }

      // Desempeño
      if (asset.type !== 'CASH_ARS' && asset.type !== 'CASH_USD' && purPrice > 0) {
        const perf = ((curPrice - purPrice) / purPrice) * 100;
        if (perf > maxPerfPercent) {
          maxPerfPercent = perf;
          bestPerfAsset = asset;
        }
      }

      // Plazo fijo más próximo
      if (asset.type === 'FIXED_TERM' && asset.dueDate) {
        const dueTime = new Date(asset.dueDate).getTime();
        const now = new Date().setHours(0, 0, 0, 0);
        const days = Math.ceil((dueTime - now) / 86400000);
        if (days >= 0 && (!nextDueDate || days < nextDueDate.days)) {
          nextDueDate = { asset, days };
        }
      }

      // Exposición a moneda dura (USD, CEDEARs, CRYPTO)
      if (isUsd || asset.type === 'CEDEAR' || asset.type === 'CRYPTO' || asset.type === 'CASH_USD') {
        totalUsdExposureArs += valArs;
      }
    });

    const totalNetWorthArs = summary.totalNetWorthArs || 1;
    const usdExposurePercent = Math.min(
      100,
      Math.round((totalUsdExposureArs / totalNetWorthArs) * 1000) / 10
    );

    return {
      biggestAsset,
      biggestAssetValArs: maxValArs,
      bestPerfAsset,
      bestPerfPercent: maxPerfPercent > -Infinity ? maxPerfPercent : 0,
      nextDueDate,
      usdExposurePercent,
    };
  }, [assets, summary]);

  const biggestAsset = insights?.biggestAsset;
  const bestPerfAsset = insights?.bestPerfAsset;
  const nextDueDate = insights?.nextDueDate;

  const usdRate = summary?.rates?.usdArs || 1180;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Navigation & Header */}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl flex items-center gap-2">
                  <span>Modo Inversiones</span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Patrimonio & Riqueza
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Control consolidado de CEDEARs, Criptomonedas, Plazos Fijos y Liquidez
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Selector de Contexto Global */}
            <VaultSelector />
            <StreakBadge />

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
              href="/inversiones"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold text-emerald-400 shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Inversiones
            </Link>
            <Link
              href="/retos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Retos
            </Link>
            <Link
              href="/presupuestos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Presupuestos
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
            <Link
              href="/perfil"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <UserNavIcon className="h-3.5 w-3.5 text-emerald-400" />
              Perfil
            </Link>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + Nuevo Activo
            </button>
            <UserStatus />
          </div>
        </header>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="rounded-lg bg-rose-500/20 px-3 py-1 font-semibold hover:bg-rose-500/30 transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div
            className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-medium transition-all ${
              toastMessage.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-950/50 text-emerald-300'
                : 'border border-rose-500/30 bg-rose-950/50 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. HERO NET WORTH BANNER                                                 */}
        {/* ========================================================================= */}
        <NetWorthHero
          summary={summary}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          loading={isLoading}
          onRefresh={loadData}
        />

        {/* ========================================================================= */}
        {/* 2. ANALYTICS: DISTRIBUTION CHART & KEY PORTFOLIO INSIGHTS                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Gráfico de dona (7 cols) */}
          <div className="lg:col-span-7">
            <PortfolioDistributionChart
              distribution={summary?.distribution || []}
              totalNetWorthArs={summary?.totalNetWorthArs || 0}
              totalNetWorthUsd={summary?.totalNetWorthUsd || 0}
              selectedCurrency={selectedCurrency}
              loading={isLoading}
            />
          </div>

          {/* Tarjeta de Métricas e Insights Clave (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Métricas Clave de la Cartera
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Posiciones dominantes y cobertura patrimonial
                  </p>
                </div>
              </div>
            </div>

            {insights ? (
              <div className="my-4 space-y-3.5">
                {/* Mayor Posición */}
                {biggestAsset && (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Mayor Posición
                      </span>
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Top 1
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {biggestAsset.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {biggestAsset.quantity} u.{' '}
                          {biggestAsset.ticker ? `(${biggestAsset.ticker})` : ''}
                        </p>
                      </div>
                      <p className="text-sm font-black text-white font-mono">
                        {formatCurrency(
                          selectedCurrency === 'USD'
                            ? insights.biggestAssetValArs / usdRate
                            : insights.biggestAssetValArs,
                          selectedCurrency
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mejor Rendimiento P&L */}
                {bestPerfAsset && (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Mejor Rendimiento
                      </span>
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        +{insights.bestPerfPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <p className="text-sm font-bold text-white">
                        {bestPerfAsset.name}
                      </p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">
                        {bestPerfAsset.ticker || bestPerfAsset.type}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cobertura en Moneda Dura */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      Cobertura en Moneda Dura / USD:
                    </span>
                    <span className="font-bold text-white font-mono">
                      {insights.usdExposurePercent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${insights.usdExposurePercent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{insights.usdExposurePercent}% Dólar/Activos Globales</span>
                    <span>{(100 - insights.usdExposurePercent).toFixed(1)}% Pesos/Tasa</span>
                  </div>
                </div>

                {/* Próximo Vencimiento Plazo Fijo */}
                {nextDueDate && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">
                          {nextDueDate.asset.name}
                        </p>
                        <p className="text-[11px] text-amber-300/80">
                          Vence en {nextDueDate.days} días (
                          {new Date(nextDueDate.asset.dueDate!).toLocaleDateString('es-AR')})
                        </p>
                      </div>
                    </div>
                    {nextDueDate.asset.interestRate && (
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {nextDueDate.asset.interestRate}% TNA
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Cargando métricas de la cartera...
              </div>
            )}

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Total de posiciones:</span>
              <span className="font-bold text-white font-mono">{assets.length} activos</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CATALOG & FILTERS SECTION                                             */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-900/80 p-1.5 border border-white/10">
              {FILTER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFilter === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Add Button */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar activo, ticker o broker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Nuevo Activo</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-3xl border border-white/5 bg-white/[0.02] animate-pulse p-6"
                />
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/30 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 mb-4 shadow-inner">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white">
                {searchQuery || activeFilter !== 'ALL'
                  ? 'No se encontraron activos con ese filtro'
                  : 'Aún no registraste activos en tu portafolio'}
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md">
                {searchQuery || activeFilter !== 'ALL'
                  ? 'Intenta buscar con otros términos o cambia la categoría de filtro seleccionada.'
                  : 'Comienza agregando tus tenencias de efectivo, plazos fijos, CEDEARs o criptomonedas para monitorear tu patrimonio neto en tiempo real.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Registrar mi primer activo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  usdRate={usdRate}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modales */}
        <AssetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAssetSaved}
          assetToEdit={assetToEdit}
        />

        <AssetDeleteModal
          isOpen={!!assetToDelete}
          onClose={() => setAssetToDelete(null)}
          onConfirm={handleConfirmDelete}
          asset={assetToDelete}
          isDeleting={isDeleting}
        />
      </div>
    </main>
  );
}

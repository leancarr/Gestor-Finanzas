'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Layers,
  Percent,
  Banknote,
} from 'lucide-react';
import { PortfolioSummary } from '@/utils/api/investments';
import { formatCurrency } from '@/utils/api/rates';

export interface NetWorthHeroProps {
  summary: PortfolioSummary | null;
  selectedCurrency: 'ARS' | 'USD';
  onCurrencyChange: (currency: 'ARS' | 'USD') => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export function NetWorthHero({
  summary,
  selectedCurrency,
  onCurrencyChange,
  loading = false,
  onRefresh,
}: NetWorthHeroProps) {
  const isUsd = selectedCurrency === 'USD';

  const totalNetWorth = summary
    ? isUsd
      ? summary.totalNetWorthUsd
      : summary.totalNetWorthArs
    : 0;

  const totalInvested = summary
    ? isUsd
      ? summary.totalInvestedUsd
      : summary.totalInvestedArs
    : 0;

  const totalProfitLoss = summary
    ? isUsd
      ? summary.totalProfitLossUsd
      : summary.totalProfitLossArs
    : 0;

  const profitLossPercentage = summary ? summary.profitLossPercentage : 0;
  const isPositive = totalProfitLoss >= 0;

  const rates = summary?.rates;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Glow decorative orbs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-600/5 blur-3xl" />

      {/* Top Bar: Title & Currency Switcher */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 shadow-inner">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                Patrimonio Neto Total
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Cartera Activa
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Valuación consolidada de todos tus activos en tiempo real
            </p>
          </div>
        </div>

        {/* Currency Switcher & Refresh */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition disabled:opacity-50 cursor-pointer"
              title="Actualizar cotizaciones"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => onCurrencyChange('ARS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isUsd
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              $ ARS
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange('USD')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isUsd
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              u$s USD
            </button>
          </div>
        </div>
      </div>

      {/* Main Net Worth Value & P&L Badge */}
      <div className="relative z-10 my-6 sm:my-8 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">
            Valor Estimado de tu Portafolio ({selectedCurrency})
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono">
              {formatCurrency(totalNetWorth, selectedCurrency)}
            </span>

            {/* Global P&L Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold tracking-tight shadow-sm ${
                isPositive
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {profitLossPercentage.toFixed(2)}%
              </span>
              <span className="text-[11px] opacity-75 font-normal">
                ({isPositive ? '+' : ''}
                {formatCurrency(totalProfitLoss, selectedCurrency)})
              </span>
            </div>
          </div>
        </div>

        {/* Countervalue Reference */}
        <div className="text-left md:text-right">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Contravalor estimado</p>
          <p className="text-base sm:text-lg font-bold text-slate-300 font-mono">
            {formatCurrency(
              isUsd ? summary?.totalNetWorthArs || 0 : summary?.totalNetWorthUsd || 0,
              isUsd ? 'ARS' : 'USD'
            )}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 pt-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
            <Banknote className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Capital Invertido</p>
            <p className="text-sm sm:text-base font-bold text-white font-mono">
              {formatCurrency(totalInvested, selectedCurrency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
            }`}
          >
            <Percent className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Rendimiento Histórico</p>
            <p
              className={`text-sm sm:text-base font-bold font-mono ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {formatCurrency(totalProfitLoss, selectedCurrency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Diversificación</p>
            <p className="text-sm sm:text-base font-bold text-white font-mono">
              {summary?.distribution.length || 0} clases de activos
            </p>
          </div>
        </div>
      </div>

      {/* Live Market Rates Bar */}
      <div className="relative z-10 mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">Mercados en vivo:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-white/5 px-2.5 py-1">
            <span className="text-slate-400">Dólar Blue:</span>
            <span className="font-bold text-white">${rates?.usdBlue || 1210}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-white/5 px-2.5 py-1">
            <span className="text-slate-400">Dólar MEP:</span>
            <span className="font-bold text-white">${rates?.usdMep || rates?.usdArs || 1180}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/60 border border-white/5 px-2.5 py-1">
            <span className="text-slate-400">Cripto USDT:</span>
            <span className="font-bold text-emerald-400">${rates?.cryptoUsdt || 1195}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

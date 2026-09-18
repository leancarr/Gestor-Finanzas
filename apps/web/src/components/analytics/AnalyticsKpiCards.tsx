'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CalendarClock,
  Sparkles,
  Wallet,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { AnalyticsKpis, AnalyticsRange } from '@/utils/api/analytics';
import { SupportedCurrency, formatCurrency } from '@/utils/api/rates';

export interface AnalyticsKpiCardsProps {
  kpis: AnalyticsKpis | null;
  currency?: SupportedCurrency;
  loading?: boolean;
  range?: AnalyticsRange;
}

export function AnalyticsKpiCards({
  kpis,
  currency = 'ARS',
  loading = false,
  range = '30d',
}: AnalyticsKpiCardsProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] animate-pulse flex flex-col justify-between h-44"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-white/10" />
              <div className="h-10 w-10 rounded-2xl bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-36 rounded bg-white/10" />
              <div className="h-5 w-24 rounded-full bg-white/10" />
            </div>
            <div className="h-3 w-32 rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  // 1. Gastos: Menos gasto es mejor (verde), Más gasto es desfavorable (rojo)
  const isExpenseReduced = kpis.expensesChangePercent < 0;
  const isExpenseIncreased = kpis.expensesChangePercent > 0;

  // 2. Ingresos: Más ingreso es mejor (verde), Menos ingreso es desfavorable (rojo)
  const isIncomeIncreased = kpis.incomeChangePercent > 0;
  const isIncomeDecreased = kpis.incomeChangePercent < 0;

  // 3. Balance neto y salud
  const isSurplus = kpis.balanceHealth === 'surplus';
  const savingsRate =
    kpis.totalIncome > 0
      ? Math.round((kpis.netBalance / kpis.totalIncome) * 100)
      : null;

  // Contexto de días para gasto promedio
  const getDailyContextLabel = () => {
    if (range === '7d') return 'Promedio en 7 días';
    if (range === '30d') return 'Promedio en 30 días';
    return `${kpis.daysCount} días del mes actual`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ========================================================================= */}
      {/* 1. GASTOS DEL PERÍODO                                                    */}
      {/* ========================================================================= */}
      <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Gastos Totales
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 shadow-inner group-hover:scale-105 transition-transform">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="my-4">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {formatCurrency(kpis.totalExpenses, currency)}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {isExpenseReduced && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {Math.abs(kpis.expensesChangePercent)}%
              </span>
            )}
            {isExpenseIncreased && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{kpis.expensesChangePercent}%
              </span>
            )}
            {!isExpenseReduced && !isExpenseIncreased && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                <Minus className="h-3.5 w-3.5" />
                0.0%
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              vs período anterior
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Previo:</span>
          <span className="font-semibold text-slate-300">
            {formatCurrency(kpis.prevTotalExpenses, currency)}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INGRESOS DEL PERÍODO                                                  */}
      {/* ========================================================================= */}
      <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Ingresos Totales
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-inner group-hover:scale-105 transition-transform">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="my-4">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {formatCurrency(kpis.totalIncome, currency)}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {isIncomeIncreased && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{kpis.incomeChangePercent}%
              </span>
            )}
            {isIncomeDecreased && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {kpis.incomeChangePercent}%
              </span>
            )}
            {!isIncomeIncreased && !isIncomeDecreased && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                <Minus className="h-3.5 w-3.5" />
                0.0%
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              vs período anterior
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Previo:</span>
          <span className="font-semibold text-slate-300">
            {formatCurrency(kpis.prevTotalIncome, currency)}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BALANCE NETO & SALUD FINANCIERA                                      */}
      {/* ========================================================================= */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-md transition-all duration-300 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
          isSurplus
            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-white/5 to-white/5 hover:border-emerald-500/50 shadow-emerald-950/20'
            : 'border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-white/5 to-white/5 hover:border-rose-500/50 shadow-rose-950/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Balance Neto
          </span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 shadow-inner group-hover:scale-105 transition-transform ${
              isSurplus
                ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 ring-rose-500/30'
            }`}
          >
            {isSurplus ? (
              <Wallet className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
        </div>

        <div className="my-4">
          <p
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isSurplus ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(kpis.netBalance, currency)}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                isSurplus
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isSurplus ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              {isSurplus ? 'Superávit' : 'Déficit'}
            </span>

            {savingsRate !== null && (
              <span className="text-[11px] text-slate-400">
                {savingsRate}% ahorro
              </span>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            Salud financiera
          </span>
          <span
            className={`font-semibold ${
              isSurplus ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isSurplus ? 'Posición Favorable' : 'Monitorear Gastos'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. GASTO DIARIO PROMEDIO                                                 */}
      {/* ========================================================================= */}
      <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Gasto Diario Promedio
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20 shadow-inner group-hover:scale-105 transition-transform">
            <CalendarClock className="h-5 w-5" />
          </div>
        </div>

        <div className="my-4">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {formatCurrency(kpis.averageDailyExpense, currency)}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
              <Sparkles className="h-3 w-3" />
              Tasa diaria
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {getDailyContextLabel()}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Proyección 30d:</span>
          <span className="font-semibold text-slate-300">
            {formatCurrency(kpis.averageDailyExpense * 30, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

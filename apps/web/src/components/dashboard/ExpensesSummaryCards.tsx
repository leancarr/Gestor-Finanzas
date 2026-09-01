'use client';

import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { ExpensesSummary } from '@/utils/api/expenses';
import { CategoryIcon } from '@/components/categories/CategoryIcon';

interface ExpensesSummaryCardsProps {
  summary: ExpensesSummary | null;
  loading?: boolean;
}

export function ExpensesSummaryCards({
  summary,
  loading = false,
}: ExpensesSummaryCardsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (loading || !summary) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 animate-pulse flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-xl bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 rounded bg-slate-800" />
              <div className="h-6 w-32 rounded bg-slate-800/80" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalExpenses = summary.totalExpenses ?? summary.totalAmount ?? 0;
  const totalIncome = summary.totalIncome ?? 0;
  const balance = summary.balance !== undefined ? summary.balance : totalIncome - totalExpenses;
  const isPositiveBalance = balance >= 0;
  const expensesCount = summary.expensesCount ?? summary.count ?? 0;
  const incomeCount = summary.incomeCount ?? 0;
  const topCategory = summary.byCategory.length > 0 ? summary.byCategory[0] : null;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Balance Neto Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur shadow-lg transition-all ${
          isPositiveBalance
            ? 'border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/30 shadow-emerald-950/20 hover:border-emerald-500/40'
            : 'border-rose-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-rose-950/30 shadow-rose-950/20 hover:border-rose-500/40'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 shrink-0 shadow-inner ${
              isPositiveBalance
                ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 ring-rose-500/30'
            }`}
          >
            {isPositiveBalance ? (
              <Wallet className="h-6 w-6" />
            ) : (
              <TrendingDown className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium">Balance Neto</span>
            <p
              className={`text-xl font-black tracking-tight truncate ${
                isPositiveBalance ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isPositiveBalance ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span className={isPositiveBalance ? 'text-emerald-400' : 'text-rose-400'}>
            {isPositiveBalance ? 'Superávit en el mes' : 'Déficit en el mes'}
          </span>
        </div>
      </div>

      {/* 2. Total Ingresos Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium">Total Ingresos</span>
            <p className="text-xl font-extrabold text-white tracking-tight truncate">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            {incomeCount} {incomeCount === 1 ? 'ingreso registrado' : 'ingresos registrados'}
          </span>
        </div>
      </div>

      {/* 3. Total Gastos Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 shrink-0">
            <ArrowDownRight className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium">Total Gastos</span>
            <p className="text-xl font-extrabold text-white tracking-tight truncate">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
          <span>
            {expensesCount} {expensesCount === 1 ? 'gasto registrado' : 'gastos registrados'}
          </span>
        </div>
      </div>

      {/* 4. Top Category Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset shrink-0"
            style={{
              backgroundColor: topCategory?.color ? `${topCategory.color}15` : '#10B98115',
              borderColor: topCategory?.color ? `${topCategory.color}30` : '#10B98130',
              color: topCategory?.color || '#10B981',
            }}
          >
            {topCategory ? (
              <CategoryIcon name={topCategory.icon} className="h-6 w-6" />
            ) : (
              <Sparkles className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium">Mayor Gasto</span>
            <p className="text-sm font-bold text-white tracking-tight truncate">
              {topCategory ? topCategory.categoryName : 'Sin consumos'}
            </p>
            {topCategory && (
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                {formatCurrency(topCategory.total)} ({topCategory.percentage}%)
              </p>
            )}
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          {topCategory ? (
            <span>Categoría con mayor consumo</span>
          ) : (
            <span>Registra consumos para ver métricas</span>
          )}
        </div>
      </div>
    </div>
  );
}

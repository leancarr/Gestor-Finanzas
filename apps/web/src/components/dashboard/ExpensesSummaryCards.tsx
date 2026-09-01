'use client';

import React from 'react';
import { DollarSign, Receipt, TrendingDown, Sparkles } from 'lucide-react';
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

  const totalAmount = summary.totalAmount;
  const count = summary.count;
  const averageAmount = count > 0 ? totalAmount / count : 0;
  const topCategory = summary.byCategory.length > 0 ? summary.byCategory[0] : null;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/20 p-5 backdrop-blur shadow-lg shadow-emerald-950/10 hover:border-emerald-500/30 transition-all">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shrink-0 shadow-inner">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium">Total Gastado</span>
            <p className="text-xl font-extrabold text-white tracking-tight truncate">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Mes actual</span>
        </div>
      </div>

      {/* Transactions Count Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 shrink-0">
            <Receipt className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium">Gastos Registrados</span>
            <p className="text-xl font-extrabold text-white tracking-tight truncate">
              {count} {count === 1 ? 'gasto' : 'gastos'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>En el período seleccionado</span>
        </div>
      </div>

      {/* Average Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur hover:border-slate-700/80 transition-all shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 shrink-0">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium">Ticket Promedio</span>
            <p className="text-xl font-extrabold text-white tracking-tight truncate">
              {formatCurrency(averageAmount)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>Por movimiento</span>
        </div>
      </div>

      {/* Top Category Card */}
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
              {topCategory ? topCategory.categoryName : 'Sin gastos'}
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
            <span>Registra gastos para ver métricas</span>
          )}
        </div>
      </div>
    </div>
  );
}

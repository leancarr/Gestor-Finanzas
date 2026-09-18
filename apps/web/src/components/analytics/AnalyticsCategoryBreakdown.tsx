'use client';

import React from 'react';
import { AnalyticsCategoryItem } from '@/utils/api/analytics';
import { SupportedCurrency, formatCurrency } from '@/utils/api/rates';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { PieChart, Sparkles, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export interface AnalyticsCategoryBreakdownProps {
  categories: AnalyticsCategoryItem[];
  totalExpenses: number;
  currency?: SupportedCurrency;
  loading?: boolean;
}

export function AnalyticsCategoryBreakdown({
  categories,
  totalExpenses,
  currency = 'ARS',
  loading = false,
}: AnalyticsCategoryBreakdownProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="h-5 w-48 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasCategories = categories.length > 0 && totalExpenses > 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Desglose de Gastos por Categoría
            </h3>
            <p className="text-[11px] text-slate-400">
              Concentración y distribución de egresos durante el período
            </p>
          </div>
        </div>

        {hasCategories && (
          <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
            {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
          </span>
        )}
      </div>

      {/* Content */}
      {!hasCategories ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 mb-3">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">
            Sin egresos registrados
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            No se encontraron gastos en este período para categorizar.
          </p>
          <Link
            href="/gastos/nuevo"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-950/40 transition cursor-pointer"
          >
            Registrar gasto
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3.5">
          {categories.map((cat, idx) => {
            const catColor = cat.color || '#10b981';

            return (
              <div
                key={cat.categoryId || idx}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 p-4 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Category Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset shrink-0 shadow-inner"
                      style={{
                        backgroundColor: `${catColor}15`,
                        borderColor: `${catColor}30`,
                        color: catColor,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                          {cat.categoryName}
                        </p>
                        {idx === 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.2 text-[10px] font-semibold text-amber-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            Mayor impacto
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {cat.count} {cat.count === 1 ? 'movimiento' : 'movimientos'}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Percentage */}
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-black text-white tracking-tight">
                      {formatCurrency(cat.total, currency)}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">
                      {cat.percentage}%
                    </p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="mt-3 h-1.5 w-full bg-slate-900/90 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: catColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

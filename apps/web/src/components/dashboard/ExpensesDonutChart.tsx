'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CategorySummaryItem } from '@/utils/api/expenses';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { PieChart as PieChartIcon, Plus } from 'lucide-react';
import Link from 'next/link';

interface ExpensesDonutChartProps {
  categories: CategorySummaryItem[];
  totalAmount: number;
  loading?: boolean;
}

interface ChartItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: string | null;
  count: number;
  categoryId: string | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartItem;
  }>;
}

const DEFAULT_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedVal = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(data.value);

    return (
      <div className="rounded-2xl border border-white/10 bg-black/60 p-3.5 shadow-2xl backdrop-blur-xl text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-white">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-bold text-emerald-400">
            {formattedVal}
          </div>
          <div className="text-[11px] text-slate-400">
            {data.percentage}% del total • {data.count}{' '}
            {data.count === 1 ? 'gasto' : 'gastos'}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function ExpensesDonutChart({
  categories,
  totalAmount,
  loading = false,
}: ExpensesDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="h-5 w-48 rounded bg-slate-800 animate-pulse" />
          <div className="h-5 w-24 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="mt-6 flex flex-col items-center justify-center h-64">
          <div className="h-44 w-44 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Pre-process chart data
  const chartData: ChartItem[] = categories.map((cat, idx) => ({
    name: cat.categoryName,
    value: cat.total,
    percentage: cat.percentage,
    color: cat.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    icon: cat.icon,
    count: cat.count,
    categoryId: cat.categoryId,
  }));

  const hasData = chartData.length > 0 && totalAmount > 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <PieChartIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Reparto por Categoría
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribución porcentual de tus gastos
            </p>
          </div>
        </div>
        {hasData && (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
          </span>
        )}
      </div>

      {/* Chart & Breakdown Content */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 mb-3 border border-slate-700/50">
            <PieChartIcon className="h-8 w-8" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">
            Sin gastos registrados
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            No hay gastos cargados en este período para generar el gráfico de distribución.
          </p>
          <Link
            href="/gastos/nuevo"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-semibold hover:bg-emerald-600/30 hover:text-white transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Cargar primer gasto
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart Visualization */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    cornerRadius={6}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={2}
                        opacity={
                          activeIndex === null || activeIndex === index ? 1 : 0.4
                        }
                        className="transition-opacity duration-200 cursor-pointer outline-none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Center Info */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium text-slate-400">Total</span>
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Category List Breakdown */}
          <div className="lg:col-span-6 space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {chartData.map((cat, index) => (
              <div
                key={cat.categoryId || index}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`group flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  activeIndex === index
                    ? 'border-white/20 bg-white/10 shadow-md'
                    : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-inset shrink-0"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      borderColor: `${cat.color}30`,
                      color: cat.color,
                    }}
                  >
                    <CategoryIcon name={cat.icon} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {cat.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{cat.count} {cat.count === 1 ? 'gasto' : 'gastos'}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-300">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {formatCurrency(cat.value)}
                  </span>
                  {/* Mini visual progress bar */}
                  <div className="mt-1 h-1 w-16 bg-slate-800 rounded-full overflow-hidden ml-auto">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

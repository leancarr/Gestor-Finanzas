'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CategorySummaryItem } from '@/utils/api/expenses';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { PieChart as PieChartIcon, Disc, Gauge, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  SupportedCurrency,
  FALLBACK_RATES,
  convertCurrencyLocal,
  formatCurrency as formatCurrencyWithRates,
} from '@/utils/api/rates';
import { cn } from '@/lib/utils';

export type ChartDisplayMode = 'radial' | 'gauge' | 'donut';

interface ExpensesCategoryChartProps {
  categories: CategorySummaryItem[];
  totalAmount: number;
  loading?: boolean;
  currency?: SupportedCurrency;
  rates?: Record<SupportedCurrency, number>;
  summaryCurrency?: string;
  defaultMode?: ChartDisplayMode;
}

interface ChartItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: string | null;
  count: number;
  categoryId: string | null;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartItem;
  }>;
  currency?: SupportedCurrency;
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

function CustomTooltip({ active, payload, currency = 'ARS' }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedVal = formatCurrencyWithRates(data.value, currency);

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3.5 shadow-2xl backdrop-blur-xl text-xs z-50">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
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

export function ExpensesCategoryChart({
  categories,
  totalAmount,
  loading = false,
  currency = 'ARS',
  rates = FALLBACK_RATES,
  summaryCurrency,
  defaultMode = 'radial',
}: ExpensesCategoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>(defaultMode);

  const format = (val: number) => {
    return formatCurrencyWithRates(val, currency);
  };

  const baseCurrency = (summaryCurrency || currency || 'ARS').toUpperCase() as SupportedCurrency;

  const convertedTotal =
    baseCurrency === currency
      ? totalAmount
      : convertCurrencyLocal(totalAmount, baseCurrency, currency, rates);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="h-5 w-48 rounded bg-slate-800 animate-pulse" />
          <div className="h-5 w-24 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="mt-6 flex flex-col items-center justify-center h-72">
          <div className="h-44 w-44 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Pre-process chart data with currency conversion if needed
  const chartData: ChartItem[] = categories.map((cat, idx) => {
    const color = cat.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    return {
      name: cat.categoryName,
      value:
        baseCurrency === currency
          ? cat.total
          : convertCurrencyLocal(cat.total, baseCurrency, currency, rates),
      percentage: cat.percentage,
      color,
      fill: color,
      icon: cat.icon,
      count: cat.count,
      categoryId: cat.categoryId,
    };
  });

  const hasData = chartData.length > 0 && (convertedTotal > 0 || totalAmount > 0);

  // Radial Bar Data: Reordered so largest is outer or inner with clear spacing
  const radialData = [...chartData].reverse();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            {displayMode === 'radial' ? (
              <Disc className="h-4 w-4" />
            ) : displayMode === 'gauge' ? (
              <Gauge className="h-4 w-4" />
            ) : (
              <PieChartIcon className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Reparto por Categoría
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribución porcentual de tus gastos
            </p>
          </div>
        </div>

        {/* Visualization Switcher (SEI-89: Radial vs Gauge vs Donut) */}
        {hasData && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <div className="flex items-center p-1 rounded-xl border border-slate-800 bg-slate-950/70 shadow-inner">
              <button
                type="button"
                onClick={() => setDisplayMode('radial')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer',
                  displayMode === 'radial'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Radial Bars concéntricas (Opción B)"
              >
                <Disc className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Radial</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('gauge')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer',
                  displayMode === 'gauge'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Segmented Circular Gauge (Opción C)"
              >
                <Gauge className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Gauge</span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('donut')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer',
                  displayMode === 'donut'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Donut Clásico"
              >
                <PieChartIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Donut</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shrink-0">
              {categories.length} {categories.length === 1 ? 'cat.' : 'cats.'}
            </span>
          </div>
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
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center lg:items-start">
          {/* Main Visualizer Column */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            <div className="h-72 sm:h-80 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                {displayMode === 'radial' ? (
                  /* Option B: Radial Bars Concéntricas */
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="28%"
                    outerRadius="98%"
                    barSize={10}
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      dataKey="percentage"
                      cornerRadius={8}
                    />
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                  </RadialBarChart>
                ) : displayMode === 'gauge' ? (
                  /* Option C: Segmented Circular Gauge en Semicírculo */
                  <PieChart>
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="70%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      cornerRadius={6}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-gauge-${index}`}
                          fill={entry.color}
                          stroke="#0a0e1a"
                          strokeWidth={2}
                          opacity={
                            activeIndex === null || activeIndex === index ? 1 : 0.4
                          }
                          className="transition-opacity duration-200 cursor-pointer outline-none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  /* Option A / Classic Donut */
                  <PieChart>
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={78}
                      outerRadius={112}
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
                          stroke="#0a0e1a"
                          strokeWidth={2}
                          opacity={
                            activeIndex === null || activeIndex === index ? 1 : 0.4
                          }
                          className="transition-opacity duration-200 cursor-pointer outline-none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>

              {/* Center KPI Information */}
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center',
                  displayMode === 'gauge' ? 'top-10' : ''
                )}
              >
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Gastos
                </span>
                <span className="text-base sm:text-xl font-black text-white tracking-tight mt-0.5">
                  {format(convertedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Category List Breakdown */}
          <div className="lg:col-span-6 space-y-2.5">
            {chartData.map((cat, index) => (
              <div
                key={cat.categoryId || index}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={cn(
                  'group flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer',
                  activeIndex === index
                    ? 'border-white/20 bg-white/10 shadow-md'
                    : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/5'
                )}
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
                      <span>
                        {cat.count} {cat.count === 1 ? 'gasto' : 'gastos'}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-300">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {format(cat.value)}
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

// Backward-compatibility alias
export const ExpensesDonutChart = ExpensesCategoryChart;

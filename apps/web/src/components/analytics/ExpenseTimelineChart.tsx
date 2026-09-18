'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { AnalyticsTimelinePoint } from '@/utils/api/analytics';
import { SupportedCurrency, formatCurrency } from '@/utils/api/rates';
import {
  Activity,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';

export interface ExpenseTimelineChartProps {
  data: AnalyticsTimelinePoint[];
  currency?: SupportedCurrency;
  loading?: boolean;
}

type SeriesVisibility = 'all' | 'expenses' | 'income';

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    value?: unknown;
    dataKey?: unknown;
    payload?: AnalyticsTimelinePoint;
  }>;
  currency: SupportedCurrency;
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;

  const point = payload[0].payload;
  const net = point.income - point.expenses;
  const isNetPositive = net >= 0;

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl text-xs space-y-2.5 min-w-[210px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{point.displayDate}</span>
        </div>
        <span className="text-[10px] text-slate-500">{point.date}</span>
      </div>

      <div className="space-y-1.5">
        {/* Ingresos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-slate-400">Ingresos:</span>
          </div>
          <span className="font-bold text-emerald-400">
            {formatCurrency(point.income, currency)}
          </span>
        </div>

        {/* Gastos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="text-slate-400">Gastos:</span>
          </div>
          <span className="font-bold text-rose-400">
            {formatCurrency(point.expenses, currency)}
          </span>
        </div>

        {/* Balance neto diario */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-slate-400">Balance neto:</span>
          <span
            className={`font-black ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(net, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ExpenseTimelineChart({
  data,
  currency = 'ARS',
  loading = false,
}: ExpenseTimelineChartProps) {
  const [visibility, setVisibility] = useState<SeriesVisibility>('all');

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="h-5 w-48 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-64 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-8 w-44 rounded-xl bg-white/10 animate-pulse" />
        </div>
        <div className="mt-6 flex flex-col items-center justify-center h-80">
          <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  const totalChartExpenses = data.reduce((acc, p) => acc + p.expenses, 0);
  const totalChartIncome = data.reduce((acc, p) => acc + p.income, 0);
  const hasData = totalChartExpenses > 0 || totalChartIncome > 0;

  // Formato compacto para eje Y
  const formatYAxis = (val: number) => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(0)}k`;
    }
    return String(val);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-inner">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Curva Temporal: Gastos vs Ingresos
            </h3>
            <p className="text-xs text-slate-400">
              Evolución diaria y visualización comparativa de flujos de fondos
            </p>
          </div>
        </div>

        {/* Visibility Filter Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-2xl border border-white/10 bg-slate-950/60 shadow-inner text-xs">
            <button
              type="button"
              onClick={() => setVisibility('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                visibility === 'all'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => setVisibility('expenses')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                visibility === 'expenses'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Gastos
            </button>
            <button
              type="button"
              onClick={() => setVisibility('income')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                visibility === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ingresos
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 mb-3">
            <Layers className="h-7 w-7" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">
            Sin movimientos registrados en este rango
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Los movimientos que cargues en este período se representarán automáticamente en la línea temporal.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {/* Gradiente Esmeralda para Ingresos */}
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Gradiente Rose para Gastos */}
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                  vertical={false}
                />

                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155', opacity: 0.3 }}
                  dy={8}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                  dx={-5}
                />

                <Tooltip
                  content={({ active, payload }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload}
                      currency={currency}
                    />
                  )}
                />

                {/* Serie de Ingresos */}
                {(visibility === 'all' || visibility === 'income') && (
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Ingresos"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                    activeDot={{
                      r: 6,
                      stroke: '#0f172a',
                      strokeWidth: 2,
                      fill: '#10b981',
                    }}
                  />
                )}

                {/* Serie de Gastos */}
                {(visibility === 'all' || visibility === 'expenses') && (
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Gastos"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expensesGradient)"
                    activeDot={{
                      r: 6,
                      stroke: '#0f172a',
                      strokeWidth: 2,
                      fill: '#f43f5e',
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend & Totals Footer */}
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-slate-400">Total Ingresos:</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(totalChartIncome, currency)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-slate-400">Total Gastos:</span>
                <span className="font-bold text-rose-400">
                  {formatCurrency(totalChartExpenses, currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span>Interactivo: pasa el cursor sobre los puntos para ver el desglose</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

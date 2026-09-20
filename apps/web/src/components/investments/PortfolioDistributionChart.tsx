'use client';

import React, { useState, useSyncExternalStore } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { AssetDistribution, AssetType } from '@/utils/api/investments';
import { formatCurrency } from '@/utils/api/rates';
import { PieChart as PieIcon, Layers } from 'lucide-react';

const subscribeNoop = () => () => {};

export interface PortfolioDistributionChartProps {
  distribution: AssetDistribution[];
  totalNetWorthArs: number;
  totalNetWorthUsd: number;
  selectedCurrency?: 'ARS' | 'USD';
  loading?: boolean;
}

interface TypeMeta {
  label: string;
  color: string;
}

const TYPE_METAS: Record<AssetType, TypeMeta> = {
  CEDEAR: { label: 'CEDEARs / Acciones', color: '#3b82f6' },
  CRYPTO: { label: 'Criptomonedas', color: '#f97316' },
  CASH_USD: { label: 'Dólares Líquidos', color: '#06b6d4' },
  CASH_ARS: { label: 'Pesos / Liquidez', color: '#10b981' },
  FIXED_TERM: { label: 'Plazos Fijos', color: '#f59e0b' },
  OTHER: { label: 'Otros Activos', color: '#8b5cf6' },
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: AssetDistribution;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  selectedCurrency: 'ARS' | 'USD';
}

function CustomTooltip({ active, payload, selectedCurrency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length || !payload[0]?.payload) return null;
  const item = payload[0].payload;
  const meta = TYPE_METAS[item.type] || { label: item.type, color: '#10b981' };

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
        <span className="font-bold text-white">{meta.label}</span>
      </div>
      <div className="space-y-1 pt-0.5">
        <div className="flex justify-between items-center text-slate-400">
          <span>Participación:</span>
          <span className="font-bold text-white font-mono">{item.percentage}%</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Valuación ({selectedCurrency}):</span>
          <span className="font-bold text-emerald-400 font-mono">
            {formatCurrency(
              selectedCurrency === 'USD' ? item.totalUsd : item.totalArs,
              selectedCurrency
            )}
          </span>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <span>Contravalor:</span>
          <span className="font-mono">
            {formatCurrency(
              selectedCurrency === 'USD' ? item.totalArs : item.totalUsd,
              selectedCurrency === 'USD' ? 'ARS' : 'USD'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PortfolioDistributionChart({
  distribution,
  totalNetWorthArs,
  totalNetWorthUsd,
  selectedCurrency = 'ARS',
  loading = false,
}: PortfolioDistributionChartProps) {
  const isMounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="h-5 w-44 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-20 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="my-8 flex justify-center">
          <div className="h-48 w-48 rounded-full border-8 border-white/5 border-t-emerald-500/50 animate-spin" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = distribution.length > 0;
  const isUsd = selectedCurrency === 'USD';
  const totalValue = isUsd ? totalNetWorthUsd : totalNetWorthArs;

  const chartData = distribution.map((d) => ({
    ...d,
    value: isUsd ? d.totalUsd : d.totalArs,
    label: TYPE_METAS[d.type]?.label || d.type,
    color: TYPE_METAS[d.type]?.color || '#10b981',
  }));

  const activeItem = activeIndex !== null && chartData[activeIndex] ? chartData[activeIndex] : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
            <PieIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Composición de la Cartera
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribución porcentual del patrimonio neto
            </p>
          </div>
        </div>

        {hasData && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-300">
            <Layers className="h-3 w-3" />
            {distribution.length} {distribution.length === 1 ? 'clase' : 'clases'}
          </span>
        )}
      </div>

      {/* Chart Section */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 mb-3">
            <PieIcon className="h-7 w-7" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">Sin activos registrados</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Agrega tu primer activo para ver la torta de distribución patrimonial.
          </p>
        </div>
      ) : (
        <>
          <div className="relative my-4 flex items-center justify-center h-60">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={<CustomTooltip selectedCurrency={selectedCurrency} />}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.type}`}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={2}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          opacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                          transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 w-48 rounded-full border-8 border-white/5" />
            )}

            {/* Donut Center Overlay */}
            <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {activeItem ? activeItem.label : 'Patrimonio'}
              </span>
              <span className="text-sm sm:text-base font-black text-white font-mono">
                {activeItem
                  ? `${activeItem.percentage}%`
                  : formatCurrency(totalValue, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
            {chartData.map((item, idx) => (
              <div
                key={item.type}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-white/10 border border-white/10 shadow-sm'
                    : 'bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-200 truncate group-hover:text-white">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-slate-400 font-medium">
                    {formatCurrency(
                      selectedCurrency === 'USD' ? item.totalUsd : item.totalArs,
                      selectedCurrency
                    )}
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                    style={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

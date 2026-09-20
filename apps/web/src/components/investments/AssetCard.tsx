'use client';

import React from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Percent,
  Edit2,
  Trash2,
  DollarSign,
  Wallet,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { Asset, AssetType } from '@/utils/api/investments';
import { formatCurrency } from '@/utils/api/rates';

export interface AssetCardProps {
  asset: Asset;
  usdRate?: number;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

interface TypeConfig {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TYPE_CONFIGS: Record<AssetType, TypeConfig> = {
  CASH_ARS: {
    label: 'Efectivo ARS',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/25',
    badgeText: 'text-emerald-400',
    icon: DollarSign,
  },
  CASH_USD: {
    label: 'Efectivo USD',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/25',
    badgeText: 'text-cyan-400',
    icon: Wallet,
  },
  FIXED_TERM: {
    label: 'Plazo Fijo',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/25',
    badgeText: 'text-amber-400',
    icon: Clock,
  },
  CEDEAR: {
    label: 'CEDEAR / Acción',
    badgeBg: 'bg-blue-500/10',
    badgeBorder: 'border-blue-500/25',
    badgeText: 'text-blue-400',
    icon: TrendingUp,
  },
  CRYPTO: {
    label: 'Criptomoneda',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/25',
    badgeText: 'text-orange-400',
    icon: Coins,
  },
  OTHER: {
    label: 'Otro Activo',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/25',
    badgeText: 'text-purple-400',
    icon: HelpCircle,
  },
};

export function AssetCard({
  asset,
  usdRate = 1180,
  onEdit,
  onDelete,
}: AssetCardProps) {
  const config = TYPE_CONFIGS[asset.type] || TYPE_CONFIGS.OTHER;
  const TypeIcon = config.icon;

  const isUsd = (asset.currency || 'ARS').toUpperCase() === 'USD';
  const qty = Number(asset.quantity) || 0;
  const currentPrice = Number(asset.currentPrice) || Number(asset.purchasePrice) || 0;
  const purchasePrice = Number(asset.purchasePrice) || currentPrice;

  // Valuación en moneda base del activo
  const currentValueNative = qty * currentPrice;
  const investedValueNative = qty * purchasePrice;
  const profitLossNative = currentValueNative - investedValueNative;
  const profitLossPercentage =
    investedValueNative > 0 ? (profitLossNative / investedValueNative) * 100 : 0;
  const hasProfitLoss = asset.type !== 'CASH_ARS' && asset.type !== 'CASH_USD';
  const isPositive = profitLossNative >= 0;

  // Contravalores en ARS y USD
  let valueInArs = currentValueNative;
  let valueInUsd = currentValueNative;

  if (isUsd) {
    valueInArs = currentValueNative * usdRate;
  } else {
    valueInUsd = usdRate > 0 ? currentValueNative / usdRate : 0;
  }

  // Formato inteligente de cantidad
  const formatQuantity = () => {
    if (asset.type === 'CRYPTO') {
      return `${qty} ${asset.ticker || ''}`;
    }
    if (asset.type === 'CEDEAR') {
      return `${qty} ${qty === 1 ? 'Título' : 'Títulos'} ${asset.ticker ? `(${asset.ticker})` : ''}`;
    }
    if (asset.type === 'CASH_ARS') {
      return formatCurrency(qty, 'ARS');
    }
    if (asset.type === 'CASH_USD') {
      return formatCurrency(qty, 'USD');
    }
    return `${qty} u.`;
  };

  // Días restantes para plazo fijo
  let daysRemaining: number | null = null;
  if (asset.dueDate) {
    const due = new Date(asset.dueDate).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    daysRemaining = Math.ceil((due - now) / 86400000);
  }

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between">
      {/* Card Header: Icon, Name, Type Badge & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${config.badgeBg} ${config.badgeBorder} ${config.badgeText} shadow-inner`}
            >
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  {asset.name}
                </h3>
                {asset.ticker && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-black font-mono tracking-wider text-slate-300">
                    {asset.ticker}
                  </span>
                )}
              </div>
              {asset.institution && (
                <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {asset.institution}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Editar activo"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(asset)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
              title="Eliminar activo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Badges / Details (Fixed Term / Type) */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}
          >
            {config.label}
          </span>

          {asset.type === 'FIXED_TERM' && asset.interestRate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 font-mono">
              <Percent className="h-2.5 w-2.5" />
              TNA {asset.interestRate}%
            </span>
          )}

          {asset.type === 'FIXED_TERM' && asset.dueDate && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                daysRemaining !== null && daysRemaining <= 5
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Calendar className="h-2.5 w-2.5" />
              Vence: {new Date(asset.dueDate).toLocaleDateString('es-AR')}
              {daysRemaining !== null && (
                <span className="font-mono text-[9px] opacity-80">
                  ({daysRemaining > 0 ? `${daysRemaining}d` : 'Hoy / Vencido'})
                </span>
              )}
            </span>
          )}
        </div>

        {/* Quantity / Holdings row */}
        <div className="mt-4 rounded-2xl bg-white/[0.02] border border-white/5 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Tenencia actual:</span>
            <span className="font-bold text-white font-mono">{formatQuantity()}</span>
          </div>
          {currentPrice > 0 && asset.type !== 'CASH_ARS' && asset.type !== 'CASH_USD' && (
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Precio estimado:</span>
              <span className="font-mono">
                {formatCurrency(currentPrice, asset.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Valuation & P&L */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Valuación Total
            </p>
            <p className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
              {formatCurrency(valueInArs, 'ARS')}
            </p>
            <p className="text-xs font-semibold text-slate-400 font-mono">
              ≈ {formatCurrency(valueInUsd, 'USD')}
            </p>
          </div>

          {/* Profit & Loss Badge */}
          {hasProfitLoss ? (
            <div
              className={`text-right rounded-xl px-2.5 py-1.5 border text-xs font-bold font-mono ${
                isPositive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center justify-end gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {profitLossPercentage.toFixed(2)}%
                </span>
              </div>
              <p className="text-[10px] opacity-80">
                {isPositive ? '+' : ''}
                {formatCurrency(profitLossNative, asset.currency)}
              </p>
            </div>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              Liquidez 1:1
            </span>
          )}
        </div>

        {asset.notes && (
          <p className="mt-3 text-[11px] text-slate-400 italic line-clamp-1">
            &ldquo;{asset.notes}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  SupportedCurrency,
  TaxSchemeType,
  TAX_SCHEME_DEFINITIONS,
  calculateTaxes,
  formatCurrency,
  FALLBACK_RATES,
  TaxCalculationResult,
} from '@/utils/api/rates';
import {
  Receipt,
  ChevronDown,
  ChevronUp,
  Percent,
  Info,
  ShieldCheck,
  Calculator,
} from 'lucide-react';

export interface TaxBreakdownPreviewProps {
  amount: number;
  currency: SupportedCurrency;
  isTaxable: boolean;
  onToggleTaxable: (enabled: boolean) => void;
  rates?: Record<SupportedCurrency, number>;
  scheme?: TaxSchemeType;
  onSchemeChange?: (scheme: TaxSchemeType) => void;
  className?: string;
}

export function TaxBreakdownPreview({
  amount,
  currency,
  isTaxable,
  onToggleTaxable,
  rates = FALLBACK_RATES,
  scheme,
  onSchemeChange,
  className = '',
}: TaxBreakdownPreviewProps) {
  // Local scheme override if not controlled externally
  const [internalScheme, setInternalScheme] = useState<TaxSchemeType | null>(null);

  // State to expand/collapse detailed breakdown
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Effective scheme: controlled prop -> local state -> default based on currency
  const activeScheme: TaxSchemeType =
    scheme ??
    internalScheme ??
    (currency === 'ARS' ? 'IVA_21' : 'DIGITAL_SERVICES');

  const handleSchemeSelect = (newScheme: TaxSchemeType) => {
    if (onSchemeChange) {
      onSchemeChange(newScheme);
    } else {
      setInternalScheme(newScheme);
    }
  };

  // Compute live tax breakdown
  const taxResult = useMemo<TaxCalculationResult>(() => {
    return calculateTaxes(amount, currency, activeScheme, rates);
  }, [amount, currency, activeScheme, rates]);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isTaxable
          ? 'border-emerald-500/30 bg-slate-950/70 shadow-lg shadow-emerald-950/20 backdrop-blur-md'
          : 'border-slate-800/80 bg-slate-950/40'
      } p-4 sm:p-5 ${className}`}
    >
      {/* Header Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition-colors shrink-0 ${
              isTaxable
                ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30'
                : 'bg-slate-900 text-slate-500 ring-slate-800'
            }`}
          >
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Calcular Impuestos y Percepciones
              </span>
              {isTaxable && (
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  +{taxResult.effectiveTaxPercentage}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Desglose automático de IVA, PAÍS y Ganancias para consumos
            </p>
          </div>
        </div>

        {/* Interactive Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isTaxable}
          onClick={() => onToggleTaxable(!isTaxable)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
            isTaxable ? 'bg-emerald-500' : 'bg-slate-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isTaxable ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Expanded Interactive Body */}
      {isTaxable && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Scheme Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Percent className="h-3 w-3 text-emerald-400" />
                Régimen Impositivo
              </label>
              <span className="text-[10px] text-slate-400">
                {TAX_SCHEME_DEFINITIONS[activeScheme]?.description}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(TAX_SCHEME_DEFINITIONS) as TaxSchemeType[]).map((schemeKey) => {
                const def = TAX_SCHEME_DEFINITIONS[schemeKey];
                const isSelected = activeScheme === schemeKey;
                return (
                  <button
                    key={schemeKey}
                    type="button"
                    onClick={() => handleSchemeSelect(schemeKey)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{def.name}</span>
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ml-2 ${
                        isSelected ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Bar: Base vs Impuestos vs Total */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Monto Base
              </span>
              <p className="text-xs font-semibold text-slate-200 truncate">
                {formatCurrency(taxResult.baseAmount, currency)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400">
                Impuestos (+{taxResult.effectiveTaxPercentage}%)
              </span>
              <p className="text-xs font-semibold text-emerald-300 truncate">
                +{formatCurrency(taxResult.totalTaxes, currency)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-white">
                Total Final
              </span>
              <p className="text-xs font-bold text-white truncate">
                {formatCurrency(taxResult.totalAmount, currency)}
              </p>
            </div>
          </div>

          {/* Collapsible Trigger for Breakdown Details */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>{isExpanded ? 'Ocultar desglose detallado' : 'Ver desglose detallado'}</span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {currency !== 'ARS' && (
              <span className="text-[10px] text-slate-400">
                Equivalente: ~{formatCurrency(taxResult.totalAmountArs, 'ARS')}
              </span>
            )}
          </div>

          {/* Collapsible Itemized Table */}
          {isExpanded && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2.5 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-400">
                <span>Concepto Impositivo</span>
                <div className="flex gap-4">
                  <span className="w-12 text-center">Alícuota</span>
                  <span className="w-24 text-right">Monto ({currency})</span>
                </div>
              </div>

              {/* Subtotal Base Row */}
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium">Subtotal Neto</span>
                <div className="flex gap-4 items-center">
                  <span className="w-12 text-center text-slate-400 text-[11px]">-</span>
                  <span className="w-24 text-right font-medium">
                    {formatCurrency(taxResult.baseAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Tax Items Rows */}
              {taxResult.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium text-slate-300">{item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                  </div>
                  <div className="flex gap-4 items-center shrink-0">
                    <span className="w-12 text-center rounded bg-slate-800 px-1 py-0.5 text-[10px] font-bold text-slate-300">
                      {item.ratePercent}%
                    </span>
                    <div className="w-24 text-right font-medium text-emerald-400">
                      +{formatCurrency(item.amount, currency)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Final Row */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 font-bold text-white text-sm">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Total con Impuestos</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400">
                    {formatCurrency(taxResult.totalAmount, currency)}
                  </span>
                  {currency !== 'ARS' && (
                    <p className="text-[10px] font-normal text-slate-400">
                      ≈ {formatCurrency(taxResult.totalAmountArs, 'ARS')}
                    </p>
                  )}
                </div>
              </div>

              {/* Legal / Informative Notice */}
              <div className="mt-2 flex items-start gap-1.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Los impuestos calculados son estimaciones basadas en la normativa impositiva argentina
                  (IVA servicios digitales, Ley PAÍS y resoluciones AFIP/ARCA).
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

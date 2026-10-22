'use client';

import React, { useEffect, useState } from 'react';
import {
  SupportedCurrency,
  CURRENCY_LIST,
  FALLBACK_RATES,
  getActiveCountry,
  getCurrenciesForCountry,
} from '@/utils/api/rates';
import { Coins, Sparkles } from 'lucide-react';
import { UsdtIcon } from '@/components/icons/UsdtIcon';

export interface CurrencySelectorProps {
  value: SupportedCurrency;
  onChange: (currency: SupportedCurrency) => void;
  rates?: Record<SupportedCurrency, number>;
  disabled?: boolean;
  showRatePreview?: boolean;
  className?: string;
  label?: string;
}

const CURRENCY_CONFIG: Record<
  SupportedCurrency,
  {
    badgeClass: string;
    activeClass: string;
    ringClass: string;
    iconSymbol: string;
  }
> = {
  ARS: {
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    activeClass:
      'bg-gradient-to-br from-sky-500/20 via-sky-500/15 to-transparent border-sky-500/50 text-sky-300 ring-1 ring-sky-500/40 shadow-lg shadow-sky-950/40',
    ringClass: 'ring-sky-500/30',
    iconSymbol: '$',
  },
  USD: {
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    activeClass:
      'bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-transparent border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/40',
    ringClass: 'ring-emerald-500/30',
    iconSymbol: 'US$',
  },
  EUR: {
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    activeClass:
      'bg-gradient-to-br from-indigo-500/20 via-indigo-500/15 to-transparent border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/40',
    ringClass: 'ring-indigo-500/30',
    iconSymbol: '€',
  },
  USDT: {
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    activeClass:
      'bg-gradient-to-br from-teal-500/20 via-teal-500/15 to-transparent border-teal-500/50 text-teal-300 ring-1 ring-teal-500/40 shadow-lg shadow-teal-950/40',
    ringClass: 'ring-teal-500/30',
    iconSymbol: '₮',
  },
  MXN: {
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    activeClass:
      'bg-gradient-to-br from-amber-500/20 via-amber-500/15 to-transparent border-amber-500/50 text-amber-300 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/40',
    ringClass: 'ring-amber-500/30',
    iconSymbol: 'Mex$',
  },
  COP: {
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    activeClass:
      'bg-gradient-to-br from-yellow-500/20 via-yellow-500/15 to-transparent border-yellow-500/50 text-yellow-300 ring-1 ring-yellow-500/40 shadow-lg shadow-yellow-950/40',
    ringClass: 'ring-yellow-500/30',
    iconSymbol: 'COL$',
  },
  CLP: {
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    activeClass:
      'bg-gradient-to-br from-rose-500/20 via-rose-500/15 to-transparent border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/40',
    ringClass: 'ring-rose-500/30',
    iconSymbol: 'CLP$',
  },
  PEN: {
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    activeClass:
      'bg-gradient-to-br from-red-500/20 via-red-500/15 to-transparent border-red-500/50 text-red-300 ring-1 ring-red-500/40 shadow-lg shadow-red-950/40',
    ringClass: 'ring-red-500/30',
    iconSymbol: 'S/',
  },
  PYG: {
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    activeClass:
      'bg-gradient-to-br from-blue-500/20 via-blue-500/15 to-transparent border-blue-500/50 text-blue-300 ring-1 ring-blue-500/40 shadow-lg shadow-blue-950/40',
    ringClass: 'ring-blue-500/30',
    iconSymbol: '₲',
  },
  VES: {
    badgeClass: 'bg-amber-600/10 text-amber-500 border-amber-600/20',
    activeClass:
      'bg-gradient-to-br from-amber-600/20 via-amber-600/15 to-transparent border-amber-600/50 text-amber-300 ring-1 ring-amber-600/40 shadow-lg shadow-amber-950/40',
    ringClass: 'ring-amber-600/30',
    iconSymbol: 'Bs.',
  },
  GTQ: {
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    activeClass:
      'bg-gradient-to-br from-cyan-500/20 via-cyan-500/15 to-transparent border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-950/40',
    ringClass: 'ring-cyan-500/30',
    iconSymbol: 'Q',
  },
  CRC: {
    badgeClass: 'bg-sky-600/10 text-sky-500 border-sky-600/20',
    activeClass:
      'bg-gradient-to-br from-sky-600/20 via-sky-600/15 to-transparent border-sky-600/50 text-sky-300 ring-1 ring-sky-600/40 shadow-lg shadow-sky-950/40',
    ringClass: 'ring-sky-600/30',
    iconSymbol: '₡',
  },
  HNL: {
    badgeClass: 'bg-teal-600/10 text-teal-500 border-teal-600/20',
    activeClass:
      'bg-gradient-to-br from-teal-600/20 via-teal-600/15 to-transparent border-teal-600/50 text-teal-300 ring-1 ring-teal-600/40 shadow-lg shadow-teal-950/40',
    ringClass: 'ring-teal-600/30',
    iconSymbol: 'L',
  },
};

export function CurrencySelector({
  value,
  onChange,
  rates = FALLBACK_RATES,
  disabled = false,
  showRatePreview = true,
  className = '',
  label,
}: CurrencySelectorProps) {
  const [activeCountry, setActiveCountryState] = useState(getActiveCountry());

  useEffect(() => {
    setActiveCountryState(getActiveCountry());

    const handleCountryChange = () => {
      setActiveCountryState(getActiveCountry());
    };
    window.addEventListener('gestorguita_country_updated', handleCountryChange);
    return () => {
      window.removeEventListener('gestorguita_country_updated', handleCountryChange);
    };
  }, []);

  const baseCurrency = activeCountry.currency;
  const availableCurrencies = React.useMemo(() => {
    const list = getCurrenciesForCountry(activeCountry.code);
    if (!list.includes(value)) {
      list.push(value);
    }
    return list;
  }, [activeCountry.code, value]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Coins className="h-3 w-3 text-slate-500" />
            Moneda de Registro ({activeCountry.name})
          </span>
        </div>
      )}

      {/* Segmented Control Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner backdrop-blur-md">
        {availableCurrencies.map((code) => {
          const info = CURRENCY_LIST[code];
          const config = CURRENCY_CONFIG[code] || CURRENCY_CONFIG.USD;
          const isSelected = value === code;
          const rateToArs = rates[code] ?? FALLBACK_RATES[code] ?? 1;

          return (
            <button
              key={code}
              type="button"
              disabled={disabled}
              onClick={() => onChange(code)}
              className={`group relative flex flex-col items-start justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? config.activeClass
                  : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              {/* Top Row: Symbol & Code */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  {code === 'USDT' ? (
                    <UsdtIcon className="h-4 w-4 shrink-0" />
                  ) : (
                    <span className="text-base" role="img" aria-label={info?.name || code}>
                      {info?.flag || '🌐'}
                    </span>
                  )}
                  <span className="font-bold text-xs tracking-wider text-white">
                    {code}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border flex items-center justify-center ${
                    isSelected
                      ? config.badgeClass
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                  }`}
                >
                  {code === 'USDT' ? (
                    <UsdtIcon className="h-3 w-3" colored={false} />
                  ) : (
                    info?.symbol || '$'
                  )}
                </span>
              </div>

              {/* Middle Row: Name */}
              <p className="mt-1.5 text-[11px] text-slate-400 truncate w-full group-hover:text-slate-300">
                {info?.name || code}
              </p>

              {/* Bottom Row: Exchange Rate preview */}
              {showRatePreview && (
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px]">
                  {code === baseCurrency ? (
                    <span className="text-emerald-400 font-medium">Moneda Base</span>
                  ) : (
                    <>
                      <span className="text-slate-400">1 {code} ≈</span>
                      <span
                        className={`font-semibold ${
                          isSelected ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        ${rateToArs.toLocaleString('es-AR')}
                      </span>
                    </>
                  )}
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Floating Rate Hint when a foreign currency is selected */}
      {value !== baseCurrency && showRatePreview && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl border border-slate-800/60 bg-slate-950/40 text-[11px] text-slate-400 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              Cotización referencial: 1 {value} = $
              {(rates[value] ?? FALLBACK_RATES[value]).toLocaleString('es-AR')} ARS
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Multi-moneda activa</span>
        </div>
      )}
    </div>
  );
}

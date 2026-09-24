'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  RefreshCw,
  Coins,
  Check,
  Info,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import {
  getFullRates,
  DetailedRatesResponse,
  DolarQuoteDetail,
} from '@/utils/api/rates';

interface DolarRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRateType?: string;
  onSelectRateType?: (rateType: string, rateValue: number) => void;
}

export function DolarRatesModal({
  isOpen,
  onClose,
  selectedRateType = 'blue',
  onSelectRateType,
}: DolarRatesModalProps) {
  const [data, setData] = useState<DetailedRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRate, setActiveRate] = useState(selectedRateType);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await getFullRates();
      setData(res);
    } catch {
      // handled inside getFullRates fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRates();
      setActiveRate(selectedRateType);
    }
  }, [isOpen, selectedRateType]);

  if (!isOpen) return null;

  const quotes: Array<{
    id: string;
    label: string;
    detail?: DolarQuoteDetail;
    description: string;
    badge?: string;
  }> = [
    {
      id: 'blue',
      label: 'Dólar Blue',
      detail: data?.usd?.blue,
      description: 'Mercado informal / paralelo en efectivo',
      badge: 'Más Usado',
    },
    {
      id: 'mep',
      label: 'Dólar MEP / Bolsa',
      detail: data?.usd?.mep,
      description: 'Operatoria legal a través de bonos (AL30 / GD30)',
      badge: 'Legal Inversores',
    },
    {
      id: 'oficial',
      label: 'Dólar Oficial (BNA)',
      detail: data?.usd?.oficial,
      description: 'Cotización minorista Banco Nación sin impuestos',
    },
    {
      id: 'tarjeta',
      label: 'Dólar Tarjeta / Turista',
      detail: data?.usd?.tarjeta,
      description: 'Oficial + 30% PAIS + 30% Percepción Ganancias',
    },
    {
      id: 'crypto',
      label: 'Dólar Cripto (USDT)',
      detail: data?.usdt,
      description: 'Cotización P2P en tiempo real (Binance / CriptoYa)',
      badge: '24/7',
    },
  ];

  const handleSelect = (id: string, detail?: DolarQuoteDetail) => {
    setActiveRate(id);
    if (detail && onSelectRateType) {
      onSelectRateType(id, detail.sell);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 shadow-sm">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Cotizaciones de Dólares
              </h2>
              <p className="text-xs text-slate-400">
                Seleccioná qué tipo de cambio usar para convertir a USD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRates}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
              title="Actualizar cotizaciones"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quotes List */}
        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {quotes.map((q) => {
            const isSelected = activeRate === q.id;
            const buy = q.detail?.buy ?? 0;
            const sell = q.detail?.sell ?? 0;

            return (
              <div
                key={q.id}
                onClick={() => handleSelect(q.id, q.detail)}
                className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'border-white/5 bg-slate-900/40 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <div className="min-w-0 mb-2 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight">
                      {q.label}
                    </span>
                    {q.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        {q.badge}
                      </span>
                    )}
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        <Check className="h-2.5 w-2.5" />
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {q.description}
                  </p>
                </div>

                {/* Rates Compra / Venta */}
                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Compra
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      ${buy.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-white/10">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                      Venta
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      ${sell.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & CTA */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Datos en tiempo real vía DolarAPI & CriptoYa</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            Confirmar y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

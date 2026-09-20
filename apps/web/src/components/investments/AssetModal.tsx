'use client';

import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Coins,
  DollarSign,
  Wallet,
  Clock,
  HelpCircle,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Asset,
  AssetType,
  CreateAssetInput,
  createAsset,
  updateAsset,
} from '@/utils/api/investments';
import { formatCurrency } from '@/utils/api/rates';

export interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedAsset: Asset) => void;
  assetToEdit?: Asset | null;
}

interface TypeOption {
  type: AssetType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultCurrency: 'ARS' | 'USD';
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'CEDEAR',
    label: 'CEDEAR / Acción',
    desc: 'Acciones del exterior cotizando en pesos (AAPL, SPY, NVDA)',
    icon: TrendingUp,
    defaultCurrency: 'ARS',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  {
    type: 'CRYPTO',
    label: 'Criptomoneda',
    desc: 'Bitcoin, Ethereum, USDT u otros criptoactivos',
    icon: Coins,
    defaultCurrency: 'USD',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  },
  {
    type: 'FIXED_TERM',
    label: 'Plazo Fijo',
    desc: 'Depósito a plazo bancario con tasa TNA y fecha pactada',
    icon: Clock,
    defaultCurrency: 'ARS',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    type: 'CASH_USD',
    label: 'Efectivo USD',
    desc: 'Dólares billete o saldo en caja de ahorro en dólares',
    icon: Wallet,
    defaultCurrency: 'USD',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  },
  {
    type: 'CASH_ARS',
    label: 'Efectivo ARS',
    desc: 'Pesos en cuenta sueldo, billetera virtual o caja de ahorro',
    icon: DollarSign,
    defaultCurrency: 'ARS',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    type: 'OTHER',
    label: 'Otro Activo',
    desc: 'Bienes, metales, fondos comunes u otros instrumentos',
    icon: HelpCircle,
    defaultCurrency: 'ARS',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
];

const PRESETS = [
  {
    label: 'CEDEAR AAPL 🍎',
    type: 'CEDEAR' as AssetType,
    name: 'Apple Inc.',
    ticker: 'AAPL',
    currency: 'ARS',
    institution: 'Bull Market / IOL',
    purchasePrice: 22000,
    currentPrice: 24650,
  },
  {
    label: 'CEDEAR SPY 📈',
    type: 'CEDEAR' as AssetType,
    name: 'SPDR S&P 500 ETF',
    ticker: 'SPY',
    currency: 'ARS',
    institution: 'Balanz / IOL',
    purchasePrice: 38000,
    currentPrice: 42150,
  },
  {
    label: 'Bitcoin (BTC) ₿',
    type: 'CRYPTO' as AssetType,
    name: 'Bitcoin',
    ticker: 'BTC',
    currency: 'USD',
    institution: 'Cold Wallet / Trezor',
    purchasePrice: 62000,
    currentPrice: 68400,
  },
  {
    label: 'Ethereum (ETH) 💎',
    type: 'CRYPTO' as AssetType,
    name: 'Ethereum',
    ticker: 'ETH',
    currency: 'USD',
    institution: 'Binance / Lemon',
    purchasePrice: 2900,
    currentPrice: 3480,
  },
  {
    label: 'Plazo Fijo 30d 🏦',
    type: 'FIXED_TERM' as AssetType,
    name: 'Plazo Fijo Tradicional',
    currency: 'ARS',
    institution: 'Banco Galicia / Santander',
    interestRate: 38.5,
  },
];

function AssetModalContent({
  onClose,
  onSuccess,
  assetToEdit,
}: Omit<AssetModalProps, 'isOpen'>) {
  const [type, setType] = useState<AssetType>(assetToEdit?.type ?? 'CEDEAR');
  const [name, setName] = useState(assetToEdit?.name ?? '');
  const [ticker, setTicker] = useState(assetToEdit?.ticker ?? '');
  const [quantity, setQuantity] = useState<string>(
    assetToEdit ? String(assetToEdit.quantity) : '1'
  );
  const [purchasePrice, setPurchasePrice] = useState<string>(
    assetToEdit?.purchasePrice !== undefined ? String(assetToEdit.purchasePrice) : ''
  );
  const [currentPrice, setCurrentPrice] = useState<string>(
    assetToEdit?.currentPrice !== undefined ? String(assetToEdit.currentPrice) : ''
  );
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(
    (assetToEdit?.currency?.toUpperCase() as 'ARS' | 'USD') || 'ARS'
  );
  const [institution, setInstitution] = useState(assetToEdit?.institution ?? '');
  const [dueDate, setDueDate] = useState(assetToEdit?.dueDate ?? '');
  const [interestRate, setInterestRate] = useState<string>(
    assetToEdit?.interestRate !== undefined ? String(assetToEdit.interestRate) : '38'
  );
  const [notes, setNotes] = useState(assetToEdit?.notes ?? '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelect = (selectedType: AssetType) => {
    setType(selectedType);
    const opt = TYPE_OPTIONS.find((o) => o.type === selectedType);
    if (opt) {
      setCurrency(opt.defaultCurrency);
    }
    if (selectedType === 'CASH_ARS' || selectedType === 'CASH_USD') {
      setPurchasePrice('1');
      setCurrentPrice('1');
      if (!name) {
        setName(selectedType === 'CASH_ARS' ? 'Caja de Ahorro en Pesos' : 'Dólares Líquidos');
      }
    }
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setType(preset.type);
    setName(preset.name);
    setTicker(preset.ticker || '');
    setCurrency(preset.currency as 'ARS' | 'USD');
    setInstitution(preset.institution || '');
    if (preset.purchasePrice) setPurchasePrice(String(preset.purchasePrice));
    if (preset.currentPrice) setCurrentPrice(String(preset.currentPrice));
    if (preset.interestRate) setInterestRate(String(preset.interestRate));
  };

  const parsedQty = parseFloat(quantity) || 0;
  const parsedCurrentPrice = parseFloat(currentPrice) || parseFloat(purchasePrice) || 0;
  const totalValuation = parsedQty * parsedCurrentPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para el activo.');
      return;
    }

    if (parsedQty <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload: CreateAssetInput = {
      name: name.trim(),
      type,
      ticker: ticker.trim() ? ticker.trim().toUpperCase() : undefined,
      quantity: parsedQty,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      currentPrice: currentPrice
        ? parseFloat(currentPrice)
        : purchasePrice
          ? parseFloat(purchasePrice)
          : undefined,
      currency,
      institution: institution.trim() ? institution.trim() : undefined,
      dueDate: type === 'FIXED_TERM' && dueDate ? dueDate : undefined,
      interestRate:
        type === 'FIXED_TERM' && interestRate ? parseFloat(interestRate) : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    try {
      if (assetToEdit) {
        const updated = await updateAsset(assetToEdit.id, payload);
        onSuccess(updated);
      } else {
        const created = await createAsset(payload);
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el activo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {assetToEdit ? 'Editar Activo' : 'Nuevo Activo en Cartera'}
              </h2>
              <p className="text-xs text-slate-400">
                Registra posiciones de inversión, plazos fijos o tenencias de efectivo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets (Only in create mode) */}
        {!assetToEdit && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              Atajos rápidos:
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="rounded-xl border border-white/5 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Clase de Activo *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.type;

                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleTypeSelect(opt.type)}
                    className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border ${opt.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Fields: Name & Ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del Activo *
              </label>
              <input
                type="text"
                required
                placeholder="ej: Apple Inc., Bitcoin, Plazo Fijo Galicia..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ticker / Símbolo
              </label>
              <input
                type="text"
                placeholder="AAPL, BTC, SPY..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white font-mono uppercase placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Financials: Quantity, Prices & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {type === 'CRYPTO'
                  ? 'Cantidad Cripto'
                  : type === 'CEDEAR'
                    ? 'Cantidad Títulos'
                    : 'Monto / Unidades *'}
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Moneda Base
              </label>
              <div className="flex rounded-xl bg-slate-950/80 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrency('ARS')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'ARS'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  $ ARS
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  u$s USD
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cotización / Precio Actual ({currency})
              </label>
              <input
                type="number"
                step="any"
                placeholder={type === 'CASH_ARS' || type === 'CASH_USD' ? '1' : '0.00'}
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Optional purchase price for P&L tracking */}
          {type !== 'CASH_ARS' && type !== 'CASH_USD' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Precio de Compra / Costo Base ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Precio al que compraste para calcular P&L"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Entidad / Broker / Custodio
                </label>
                <input
                  type="text"
                  placeholder="ej: Balanz, IOL, Bull Market, Trezor, Banco Santander"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Specific Fields for FIXED_TERM */}
          {type === 'FIXED_TERM' && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                Parámetros de Plazo Fijo
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tasa Nominal Anual (TNA %)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="38.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Banco Emisor
                  </label>
                  <input
                    type="text"
                    placeholder="Banco Galicia, BBVA..."
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notas o Estrategia (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej: Mantener a 2 años, cobro de dividendos trimestrales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Live Estimated Valuation Banner */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Valuación Estimada de esta Posición
              </p>
              <p className="text-xl font-black text-white font-mono mt-0.5">
                {formatCurrency(totalValuation, currency)}
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {parsedQty} u. × {formatCurrency(parsedCurrentPrice, currency)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {assetToEdit ? 'Guardar Cambios' : 'Registrar Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssetModal({
  isOpen,
  onClose,
  onSuccess,
  assetToEdit,
}: AssetModalProps) {
  if (!isOpen) return null;

  return (
    <AssetModalContent
      key={assetToEdit?.id ?? 'new-asset'}
      onClose={onClose}
      onSuccess={onSuccess}
      assetToEdit={assetToEdit}
    />
  );
}

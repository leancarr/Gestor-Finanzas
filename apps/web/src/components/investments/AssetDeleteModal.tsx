'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Asset } from '@/utils/api/investments';
import { formatCurrency } from '@/utils/api/rates';

export interface AssetDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  asset: Asset | null;
  isDeleting?: boolean;
}

export function AssetDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  asset,
  isDeleting = false,
}: AssetDeleteModalProps) {
  if (!isOpen || !asset) return null;

  const totalValuation =
    (Number(asset.quantity) || 0) *
    (Number(asset.currentPrice) || Number(asset.purchasePrice) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">¿Eliminar activo?</h3>
              <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-300">
            Estás a punto de quitar la siguiente posición de tu portafolio patrimonial:
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                {asset.name}
              </span>
              {asset.ticker && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                  {asset.ticker}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Tenencia: {asset.quantity}</span>
              <span className="text-emerald-400 font-bold">
                {formatCurrency(totalValuation, asset.currency)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-rose-300/90 leading-relaxed bg-rose-950/30 border border-rose-500/20 rounded-xl p-3">
            ⚠️ El valor de este activo se descontará automáticamente de tu cálculo de Patrimonio Neto Total.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/50 transition disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Eliminar Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
}

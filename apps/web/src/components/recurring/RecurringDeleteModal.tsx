'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { deleteRecurring, RecurringItem } from '@/utils/api/recurring';
import { formatCurrency, SupportedCurrency } from '@/utils/api/rates';

interface RecurringDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
  recurring: RecurringItem | null;
}

export function RecurringDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  recurring,
}: RecurringDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !recurring) return null;

  const numericAmount =
    typeof recurring.amount === 'number'
      ? recurring.amount
      : parseFloat(String(recurring.amount)) || 0;

  const formattedAmount = formatCurrency(
    numericAmount,
    (recurring.currency || 'ARS').toUpperCase() as SupportedCurrency,
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteRecurring(recurring.id);
      onSuccess(recurring.id);
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error al eliminar la suscripción';
      setError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md text-slate-100 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 shadow-md">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Eliminar Suscripción</h2>
            <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
          <p className="text-xs text-slate-300">
            ¿Estás seguro de que deseas eliminar la suscripción{' '}
            <strong className="text-white font-semibold">{recurring.name}</strong>?
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Importe programado:</span>
            <span className="font-bold text-white">{formattedAmount}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/40 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

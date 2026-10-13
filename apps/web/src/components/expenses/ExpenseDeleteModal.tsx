'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { deleteExpense, ExpenseItem } from '@/utils/api/expenses';

interface ExpenseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (expense: ExpenseItem) => void;
  expense: ExpenseItem | null;
}

export function ExpenseDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
}: ExpenseDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !expense) return null;

  const numericAmount =
    typeof expense.amount === 'number'
      ? expense.amount
      : parseFloat(String(expense.amount));

  const formattedAmount = isNaN(numericAmount)
    ? '$ 0,00'
    : new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(numericAmount);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteExpense(expense.id);
      onSuccess(expense);
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al enviar el gasto a la papelera';
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
      <div className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 sm:p-8 text-left shadow-2xl transition-all">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 mb-4">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-white">¿Mover este gasto a la Papelera?</h3>

        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
          Estás a punto de enviar el gasto{' '}
          <strong className="text-white">&ldquo;{expense.description}&rdquo;</strong> ({formattedAmount}) a la Papelera de Reciclaje. Permanecerá allí durante 30 días antes de ser purgado definitivamente y podrás restaurarlo cuando quieras.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Moviendo a papelera...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Mover a la papelera
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

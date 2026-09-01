'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { deleteCategory, CategoryItem } from '@/utils/api/categories';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
  category: CategoryItem | null;
}

export function CategoryDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  category,
}: CategoryDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const expensesCount = category._count?.expenses || 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteCategory(category.id);
      onSuccess(category.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar la categoría');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950 backdrop-blur-xl sm:p-8 z-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20 shadow-lg shadow-red-950/40">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Eliminar Categoría</h3>
              <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            ¿Estás seguro de que deseas eliminar la categoría{' '}
            <strong className="text-white">"{category.name}"</strong>?
          </p>

          {/* Category Preview Tag */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-950/60 p-3.5 border border-slate-800">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl font-bold"
              style={{
                backgroundColor: `${category.color || '#10B981'}25`,
                color: category.color || '#10B981',
              }}
            >
              <CategoryIcon name={category.icon} className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-xs">{category.name}</span>
              <span className="text-[10px] text-slate-400">
                {expensesCount === 1
                  ? '1 gasto asociado'
                  : `${expensesCount} gastos asociados`}
              </span>
            </div>
          </div>

          {expensesCount > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Los gastos asignados a esta categoría mantendrán su registro pero quedarán sin categoría vinculada.
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <span>Sí, eliminar categoría</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

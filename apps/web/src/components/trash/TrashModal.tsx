'use client';

import React, { useEffect, useState } from 'react';
import {
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  RotateCcw,
  Clock,
  Tag,
  Repeat,
  DollarSign,
  Target,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  TrashItem,
  getTrashItems,
  restoreTrashItem,
  purgeTrashItem,
  purgeAllTrash,
} from '@/utils/api/trash';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemRestored?: () => void;
}

export function TrashModal({ isOpen, onClose, onItemRestored }: TrashModalProps) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await getTrashItems();
      setItems(data);
    } catch (err) {
      console.error('Error fetching trash items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (item: TrashItem) => {
    setActionInProgress(item.id);
    try {
      await restoreTrashItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setMessage(`"${item.title}" restaurado exitosamente.`);
      onItemRestored?.();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePurge = async (item: TrashItem) => {
    if (!confirm(`¿Eliminar definitivamente "${item.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setActionInProgress(item.id);
    try {
      await purgeTrashItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setMessage(`"${item.title}" eliminado definitivamente.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePurgeAll = async () => {
    if (!confirm('¿Vaciar toda la papelera definitivamente? Todos los elementos se destruirán de forma irreversible.')) {
      return;
    }
    setActionInProgress('all');
    try {
      await purgeAllTrash();
      setItems([]);
      setMessage('Papelera vaciada por completo.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const renderEntityBadge = (type: TrashItem['entityType']) => {
    switch (type) {
      case 'EXPENSE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
            <DollarSign className="h-3 w-3" />
            Gasto
          </span>
        );
      case 'CATEGORY':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <Tag className="h-3 w-3" />
            Categoría
          </span>
        );
      case 'RECURRING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
            <Repeat className="h-3 w-3" />
            Recurrente
          </span>
        );
      case 'BUDGET':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            <Target className="h-3 w-3" />
            Presupuesto
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Papelera de Reciclaje</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                  Retención 30 días
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Los elementos eliminados se purgan automáticamente tras 30 días.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handlePurgeAll}
                disabled={actionInProgress !== null}
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Vaciar Papelera
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {message && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* List Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Trash2 className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                La papelera está vacía
              </p>
              <p className="text-xs text-slate-500">
                No hay transacciones ni categorías eliminadas recientemente.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-slate-700/80 transition"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {renderEntityBadge(item.entityType)}
                    <span className="text-xs font-bold text-white truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    {item.amount !== undefined && (
                      <span className="font-semibold text-slate-200">
                        ${item.amount.toLocaleString('es-AR')} {item.currency}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                      <Clock className="h-3 w-3" />
                      {item.remainingDays} días para purga
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    disabled={actionInProgress === item.id}
                    title="Restaurar elemento"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePurge(item)}
                    disabled={actionInProgress === item.id}
                    title="Eliminar definitivamente"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

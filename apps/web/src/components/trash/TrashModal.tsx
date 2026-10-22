'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  X,
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
import { ConfirmActionModal } from '@/components/ui/ConfirmActionModal';
import { usePrefs } from '@/lib/prefs';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemRestored?: () => void;
}

export function TrashModal({ isOpen, onClose, onItemRestored }: TrashModalProps) {
  const { t } = usePrefs();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // States for custom confirmation modals
  const [itemToPurge, setItemToPurge] = useState<TrashItem | null>(null);
  const [isPurgeAllConfirmOpen, setIsPurgeAllConfirmOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !itemToPurge && !isPurgeAllConfirmOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, itemToPurge, isPurgeAllConfirmOpen, onClose]);

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

  const confirmPurgeItem = async () => {
    if (!itemToPurge) return;
    const item = itemToPurge;
    setActionInProgress(item.id);
    try {
      await purgeTrashItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setMessage(`"${item.title}" eliminado definitivamente.`);
      setItemToPurge(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const confirmPurgeAll = async () => {
    setActionInProgress('all');
    try {
      await purgeAllTrash();
      setItems([]);
      setMessage('Papelera vaciada por completo.');
      setIsPurgeAllConfirmOpen(false);
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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.trash.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                  Retención 30 días
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {t.trash.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setIsPurgeAllConfirmOpen(true)}
                disabled={actionInProgress !== null}
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {t.trash.emptyBtn}
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
                {t.trash.noItems}
              </p>
              <p className="text-xs text-slate-500">
                {t.trash.subtitle}
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
                    title={t.trash.restore}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{t.trash.restore}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToPurge(item)}
                    disabled={actionInProgress === item.id}
                    title={t.trash.purge}
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

      {/* Confirmation modal for single item purge */}
      <ConfirmActionModal
        isOpen={itemToPurge !== null}
        onClose={() => setItemToPurge(null)}
        onConfirm={confirmPurgeItem}
        title="¿Eliminar definitivamente?"
        description={
          itemToPurge ? (
            <>
              Estás a punto de eliminar de forma permanente{' '}
              <strong className="text-white">&ldquo;{itemToPurge.title}&rdquo;</strong>.
              Esta acción no se puede deshacer y el registro no podrá ser recuperado.
            </>
          ) : null
        }
        confirmText="Eliminar Definitivamente"
        cancelText="Cancelar"
        isLoading={actionInProgress === itemToPurge?.id}
      />

      {/* Confirmation modal for purge all */}
      <ConfirmActionModal
        isOpen={isPurgeAllConfirmOpen}
        onClose={() => setIsPurgeAllConfirmOpen(false)}
        onConfirm={confirmPurgeAll}
        title="¿Vaciar toda la papelera?"
        description="¿Estás seguro de que deseás vaciar toda la papelera definitivamente? Todos los elementos se destruirán de forma irreversible."
        confirmText="Vaciar Todo"
        cancelText="Cancelar"
        isLoading={actionInProgress === 'all'}
      />
    </div>,
    document.body,
  );
}

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  Repeat,
  AlertTriangle,
  Play,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  RecurringItem,
  getRecurring,
  processRecurring,
} from '@/utils/api/recurring';
import { formatCurrency, SupportedCurrency } from '@/utils/api/rates';

interface UpcomingDuesWidgetProps {
  onRefreshParent?: () => void;
}

export function UpcomingDuesWidget({ onRefreshParent }: UpcomingDuesWidgetProps) {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const refreshItems = async () => {
    try {
      const data = await getRecurring(false);
      setItems(data);
    } catch {
      // Ignorar silenciosamente si no hay conexión
    }
  };

  useEffect(() => {
    let isMounted = true;
    getRecurring(false)
      .then((data) => {
        if (isMounted) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const upcomingDues = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in5Days = new Date(today);
    in5Days.setDate(in5Days.getDate() + 5);
    in5Days.setHours(23, 59, 59, 999);

    return items
      .filter((item) => {
        if (!item.isActive) return false;
        const due = new Date(item.nextDueDate);
        return due.getTime() <= in5Days.getTime();
      })
      .sort(
        (a, b) =>
          new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
      );
  }, [items]);

  const handleProcessItem = async (item: RecurringItem) => {
    if (processingId) return;
    try {
      setProcessingId(item.id);
      await processRecurring(item.id);
      setSuccessId(item.id);
      setTimeout(() => {
        setSuccessId(null);
      }, 3000);
      await refreshItems();
      onRefreshParent?.();
    } catch {
      // Manejo de error
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || upcomingDues.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 p-5 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 shadow-md shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Vencimientos Próximos
              </h3>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                {upcomingDues.length} en los próximos 5 días
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Servicios y suscripciones que vencen pronto o requieren confirmación de pago
            </p>
          </div>
        </div>

        <Link
          href="/suscripciones"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:text-white transition cursor-pointer"
        >
          <Repeat className="h-3.5 w-3.5 text-emerald-400" />
          <span>Ver Todas</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Dues list */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingDues.map((due) => {
          const dueDate = new Date(due.nextDueDate);
          const dueDateClean = new Date(dueDate);
          dueDateClean.setHours(0, 0, 0, 0);

          const diffTime = dueDateClean.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let badgeText = `Vence en ${diffDays} días`;
          let badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';

          if (diffDays < 0) {
            const abs = Math.abs(diffDays);
            badgeText = abs === 1 ? 'Venció ayer' : `Venció hace ${abs}d`;
            badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
          } else if (diffDays === 0) {
            badgeText = 'Vence hoy';
            badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse';
          } else if (diffDays === 1) {
            badgeText = 'Vence mañana';
            badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold';
          }

          const num =
            typeof due.amount === 'number'
              ? due.amount
              : parseFloat(String(due.amount)) || 0;

          const isProcessingThis = processingId === due.id;
          const isSuccessThis = successId === due.id;

          return (
            <div
              key={due.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 backdrop-blur"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold text-white">
                    {due.name}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400">
                    {formatCurrency(num, (due.currency || 'ARS').toUpperCase() as SupportedCurrency)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] ${badgeClass}`}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {badgeText}
                  </span>
                </div>
              </div>

              {/* Botón rápido de registrar */}
              <button
                type="button"
                onClick={() => handleProcessItem(due)}
                disabled={isProcessingThis || isSuccessThis}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer shrink-0 disabled:opacity-50 ${
                  isSuccessThis
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
                title="Registrar pago y actualizar fecha"
              >
                {isProcessingThis ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isSuccessThis ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Play className="h-3 w-3 fill-white" />
                )}
                <span>{isSuccessThis ? 'Registrado' : 'Registrar'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

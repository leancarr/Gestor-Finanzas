'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Edit2,
  Loader2,
  Play,
  Repeat,
  Trash2,
  Zap,
} from 'lucide-react';
import { RecurringItem } from '@/utils/api/recurring';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  formatCurrency,
  SupportedCurrency,
  CURRENCY_LIST,
} from '@/utils/api/rates';

interface RecurringCardProps {
  recurring: RecurringItem;
  onEdit?: (recurring: RecurringItem) => void;
  onDelete?: (recurring: RecurringItem) => void;
  onProcess?: (recurring: RecurringItem) => Promise<void>;
  onToggleAutoDebit?: (recurring: RecurringItem) => Promise<void>;
  onToggleActive?: (recurring: RecurringItem) => Promise<void>;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
};

export function RecurringCard({
  recurring,
  onEdit,
  onDelete,
  onProcess,
  onToggleAutoDebit,
  onToggleActive,
}: RecurringCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTogglingAutoDebit, setIsTogglingAutoDebit] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const numericAmount =
    typeof recurring.amount === 'number'
      ? recurring.amount
      : parseFloat(String(recurring.amount)) || 0;

  const currencyCode = (recurring.currency || 'ARS').toUpperCase() as SupportedCurrency;
  const currencyInfo = CURRENCY_LIST[currencyCode] || CURRENCY_LIST.ARS;

  const formattedAmount = formatCurrency(numericAmount, currencyCode);
  const frequencyLabel = FREQUENCY_LABELS[recurring.frequency] || recurring.frequency;

  // Cálculo de días restantes para el vencimiento
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(recurring.nextDueDate);
  const dueDateClean = new Date(dueDate);
  dueDateClean.setHours(0, 0, 0, 0);

  const diffTime = dueDateClean.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let dueBadge = {
    text: `Vence en ${diffDays} días`,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    dueBadge = {
      text: absDays === 1 ? 'Venció ayer' : `Venció hace ${absDays} días`,
      className: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold',
    };
  } else if (diffDays === 0) {
    dueBadge = {
      text: 'Vence hoy',
      className: 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold animate-pulse',
    };
  } else if (diffDays === 1) {
    dueBadge = {
      text: 'Vence mañana',
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold',
    };
  } else if (diffDays <= 4) {
    dueBadge = {
      text: `Vence en ${diffDays} días`,
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
  }

  const formattedDueDate = !isNaN(dueDate.getTime())
    ? new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(dueDate)
    : recurring.nextDueDate;

  const category = recurring.category;
  const categoryColor = category?.color || '#10B981';

  const handleProcessClick = async () => {
    if (!onProcess || isProcessing) return;
    try {
      setIsProcessing(true);
      await onProcess(recurring);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAutoDebitClick = async () => {
    if (!onToggleAutoDebit || isTogglingAutoDebit) return;
    try {
      setIsTogglingAutoDebit(true);
      await onToggleAutoDebit(recurring);
    } finally {
      setIsTogglingAutoDebit(false);
    }
  };

  const handleToggleActiveClick = async () => {
    if (!onToggleActive || isTogglingActive) return;
    try {
      setIsTogglingActive(true);
      await onToggleActive(recurring);
    } finally {
      setIsTogglingActive(false);
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between gap-4 rounded-3xl border p-5 backdrop-blur-md transition-all shadow-md ${
        recurring.isActive
          ? 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
          : 'border-slate-800/40 bg-slate-950/40 opacity-70 hover:opacity-100'
      }`}
    >
      {/* Header: Icon + Info + Amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Logo / Category Icon */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset shadow-inner"
            style={{
              backgroundColor: `${categoryColor}18`,
              borderColor: `${categoryColor}35`,
              color: categoryColor,
            }}
          >
            {category ? (
              <CategoryIcon name={category.icon} className="h-6 w-6" />
            ) : (
              <Repeat className="h-6 w-6 text-emerald-400" />
            )}
          </div>

          {/* Title & Frequency */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                {recurring.name}
              </h3>
              {!recurring.isActive && (
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                  Pausada
                </span>
              )}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-300">
                {frequencyLabel}
              </span>
              <span className="text-slate-600">•</span>
              {category ? (
                <span
                  className="inline-flex items-center gap-1 font-medium text-[11px]"
                  style={{ color: categoryColor }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  {category.name}
                </span>
              ) : (
                <span className="text-slate-500 italic text-[11px]">Sin categoría</span>
              )}
            </div>
          </div>
        </div>

        {/* Amount & Currency */}
        <div className="text-right shrink-0">
          <p className="text-lg font-black tracking-tight text-white">
            {formattedAmount}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">
            {currencyInfo.flag} {currencyCode} / {frequencyLabel.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Due Date & Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-950/60 p-3 border border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-300">Próximo vencimiento:</span>
          <span className="font-semibold text-white">{formattedDueDate}</span>
        </div>

        {/* Days left badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-sm ${dueBadge.className}`}
        >
          <Clock className="h-3 w-3" />
          {dueBadge.text}
        </span>
      </div>

      {/* Controls & Actions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
        {/* Auto Debit Toggle */}
        <button
          type="button"
          onClick={handleToggleAutoDebitClick}
          disabled={isTogglingAutoDebit || !onToggleAutoDebit}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
            recurring.autoDebit
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
          title={
            recurring.autoDebit
              ? 'Débito automático activado: se procesará al vencer'
              : 'Cobro manual: click para activar débito automático'
          }
        >
          {isTogglingAutoDebit ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className={`h-3 w-3 ${recurring.autoDebit ? 'fill-emerald-400 text-emerald-400' : ''}`} />
          )}
          <span>{recurring.autoDebit ? 'Auto-débito' : 'Manual'}</span>
        </button>

        {/* Action Buttons: Process Now + Edit + Delete */}
        <div className="flex items-center gap-2">
          {/* Toggle Active/Pause */}
          {onToggleActive && (
            <button
              type="button"
              onClick={handleToggleActiveClick}
              disabled={isTogglingActive}
              className={`rounded-xl border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                recurring.isActive
                  ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title={recurring.isActive ? 'Pausar suscripción' : 'Reanudar suscripción'}
            >
              {isTogglingActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : recurring.isActive ? (
                'Pausar'
              ) : (
                'Activar'
              )}
            </button>
          )}

          {/* Registrar Ahora (Process) */}
          {onProcess && (
            <button
              type="button"
              onClick={handleProcessClick}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-950/30 transition cursor-pointer disabled:opacity-50"
              title="Registrar pago ahora y avanzar próximo vencimiento"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-white" />
              )}
              <span>Registrar ahora</span>
            </button>
          )}

          {/* Edit */}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(recurring)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Editar suscripción"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(recurring)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800/80 text-slate-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
              title="Eliminar suscripción"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

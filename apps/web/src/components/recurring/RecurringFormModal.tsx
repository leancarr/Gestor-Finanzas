'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Repeat,
  Calendar,
  Loader2,
  AlertCircle,
  Zap,
  Tag,
  Check,
} from 'lucide-react';
import {
  RecurringItem,
  CreateRecurringInput,
  UpdateRecurringInput,
  RecurrenceFrequency,
  createRecurring,
  updateRecurring,
} from '@/utils/api/recurring';
import { getCategories, CategoryItem } from '@/utils/api/categories';
import { SupportedCurrency, CURRENCY_LIST } from '@/utils/api/rates';

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: RecurringItem) => void;
  recurringToEdit?: RecurringItem | null;
}

const SERVICE_PRESETS = [
  { name: 'Spotify Premium', amount: 5500, currency: 'ARS', frequency: 'MONTHLY' as RecurrenceFrequency },
  { name: 'Netflix', amount: 12000, currency: 'ARS', frequency: 'MONTHLY' as RecurrenceFrequency },
  { name: 'YouTube Premium', amount: 6200, currency: 'ARS', frequency: 'MONTHLY' as RecurrenceFrequency },
  { name: 'ChatGPT Plus', amount: 20, currency: 'USD', frequency: 'MONTHLY' as RecurrenceFrequency },
  { name: 'iCloud / Storage', amount: 3, currency: 'USD', frequency: 'MONTHLY' as RecurrenceFrequency },
  { name: 'Gimnasio', amount: 35000, currency: 'ARS', frequency: 'MONTHLY' as RecurrenceFrequency },
  { name: 'Internet Fibra', amount: 28000, currency: 'ARS', frequency: 'MONTHLY' as RecurrenceFrequency },
];

interface RecurringFormBodyProps {
  recurringToEdit?: RecurringItem | null;
  categories: CategoryItem[];
  isCategoriesLoading: boolean;
  onClose: () => void;
  onSuccess: (item: RecurringItem) => void;
}

function RecurringFormBody({
  recurringToEdit,
  categories,
  isCategoriesLoading,
  onClose,
  onSuccess,
}: RecurringFormBodyProps) {
  const isEditing = Boolean(recurringToEdit);

  // Inicialización directa de estado en función de si es creación o edición
  const [name, setName] = useState(recurringToEdit ? recurringToEdit.name : '');
  const [amount, setAmount] = useState(
    recurringToEdit ? String(recurringToEdit.amount) : '',
  );
  const [currency, setCurrency] = useState<SupportedCurrency>(
    recurringToEdit
      ? ((recurringToEdit.currency || 'ARS').toUpperCase() as SupportedCurrency)
      : 'ARS',
  );
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    recurringToEdit ? recurringToEdit.frequency : 'MONTHLY',
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(() => {
    if (recurringToEdit?.dayOfMonth) return recurringToEdit.dayOfMonth;
    return new Date().getDate();
  });
  const [nextDueDate, setNextDueDate] = useState<string>(() => {
    if (recurringToEdit?.nextDueDate) {
      const due = new Date(recurringToEdit.nextDueDate);
      return !isNaN(due.getTime())
        ? due.toISOString().split('T')[0]
        : recurringToEdit.nextDueDate;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [categoryId, setCategoryId] = useState(
    recurringToEdit?.categoryId || '',
  );
  const [autoDebit, setAutoDebit] = useState<boolean>(
    recurringToEdit ? recurringToEdit.autoDebit : true,
  );
  const [isActive, setIsActive] = useState<boolean>(
    recurringToEdit ? recurringToEdit.isActive : true,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: (typeof SERVICE_PRESETS)[0]) => {
    setName(preset.name);
    setAmount(String(preset.amount));
    setCurrency(preset.currency as SupportedCurrency);
    setFrequency(preset.frequency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!name.trim()) {
      setError('El nombre de la suscripción es obligatorio.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser un número válido mayor a 0.');
      return;
    }
    if (!nextDueDate) {
      setError('La fecha de próximo vencimiento es obligatoria.');
      return;
    }

    try {
      setIsSubmitting(true);

      const parsedDueDate = new Date(nextDueDate + 'T00:00:00.000Z').toISOString();
      const parsedDayOfMonth = frequency === 'MONTHLY' ? Number(dayOfMonth) : undefined;

      if (isEditing && recurringToEdit) {
        const updateData: UpdateRecurringInput = {
          name: name.trim(),
          amount: parsedAmount,
          currency,
          frequency,
          dayOfMonth: parsedDayOfMonth,
          nextDueDate: parsedDueDate,
          autoDebit,
          isActive,
          categoryId: categoryId || null,
        };

        const updated = await updateRecurring(recurringToEdit.id, updateData);
        onSuccess(updated);
      } else {
        const createData: CreateRecurringInput = {
          name: name.trim(),
          amount: parsedAmount,
          currency,
          frequency,
          dayOfMonth: parsedDayOfMonth,
          nextDueDate: parsedDueDate,
          autoDebit,
          categoryId: categoryId || null,
        };

        const created = await createRecurring(createData);
        onSuccess(created);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la suscripción.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md text-slate-100 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Editar Suscripción' : 'Nueva Suscripción'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? 'Modifica las condiciones del gasto recurrente'
                : 'Registra un servicio recurrente o suscripción fija'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Presets (Only when creating) */}
      {!isEditing && (
        <div className="mt-4 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sugerencias rápidas
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/5 transition cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200">
            Nombre del Servicio o Suscripción *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Spotify, Netflix, Gimnasio, Internet..."
            maxLength={100}
            required
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Importe y Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 space-y-1.5">
            <label className="font-semibold text-slate-200">
              Monto *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-semibold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <label className="font-semibold text-slate-200">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {Object.values(CURRENCY_LIST).map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.flag} {c.code} ({c.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Frecuencia y Día del mes */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 space-y-1.5">
            <label className="font-semibold text-slate-200">
              Frecuencia *
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="MONTHLY" className="bg-slate-900 text-white">Mensual</option>
              <option value="YEARLY" className="bg-slate-900 text-white">Anual</option>
              <option value="WEEKLY" className="bg-slate-900 text-white">Semanal</option>
              <option value="DAILY" className="bg-slate-900 text-white">Diario</option>
            </select>
          </div>

          {frequency === 'MONTHLY' && (
            <div className="sm:col-span-5 space-y-1.5">
              <label className="font-semibold text-slate-200">
                Día de cobro
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Próximo Vencimiento */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Fecha de Próximo Vencimiento *
          </label>
          <input
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Categoría */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            Categoría Asignada (Opcional)
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isCategoriesLoading}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="" className="bg-slate-900 text-slate-400">
              Sin categoría
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles: Auto-débito y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Auto-Debit Checkbox */}
          <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={autoDebit}
              onChange={(e) => setAutoDebit(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <div className="min-w-0">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                Débito Automático
              </span>
              <p className="text-[10px] text-slate-400">
                Cobrar automáticamente en la fecha
              </p>
            </div>
          </label>

          {/* Activo / Pausado (solo en edición o creación) */}
          <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <div className="min-w-0">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Suscripción Activa
              </span>
              <p className="text-[10px] text-slate-400">
                Desmarca para pausarla temporalmente
              </p>
            </div>
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isEditing ? 'Guardar Cambios' : 'Crear Suscripción'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export function RecurringFormModal({
  isOpen,
  onClose,
  onSuccess,
  recurringToEdit,
}: RecurringFormModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    getCategories()
      .then((cats) => {
        if (isMounted) {
          setCategories(cats);
          setIsCategoriesLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsCategoriesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <RecurringFormBody
        key={recurringToEdit ? recurringToEdit.id : 'new-recurring'}
        recurringToEdit={recurringToEdit}
        categories={categories}
        isCategoriesLoading={isCategoriesLoading}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
}

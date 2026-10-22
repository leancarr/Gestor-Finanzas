'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Target,
  DollarSign,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  Plus,
  Repeat,
  Clock,
} from 'lucide-react';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import {
  BudgetItem,
  createOrUpsertBudget,
  updateBudget,
} from '@/utils/api/budgets';
import { CategoryItem } from '@/utils/api/categories';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedBudget: BudgetItem) => void;
  budgetToEdit?: BudgetItem | null;
  categories: CategoryItem[];
  defaultMonth: number;
  defaultYear: number;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const CURRENCIES = ['ARS', 'USD', 'EUR', 'USDT'];

const DURATION_OPTIONS = [
  { value: 1, label: '1 Mes', desc: 'Estándar' },
  { value: 3, label: 'Trimestral', desc: '3 meses' },
  { value: 6, label: 'Semestral', desc: '6 meses' },
  { value: 12, label: 'Anual', desc: '12 meses' },
];

interface BudgetModalFormProps {
  onClose: () => void;
  onSuccess: (savedBudget: BudgetItem) => void;
  budgetToEdit?: BudgetItem | null;
  categories: CategoryItem[];
  defaultMonth: number;
  defaultYear: number;
}

function BudgetModalForm({
  onClose,
  onSuccess,
  budgetToEdit,
  categories,
  defaultMonth,
  defaultYear,
}: BudgetModalFormProps) {
  const isEditing = Boolean(budgetToEdit);

  const [categoryId, setCategoryId] = useState<string>(() => {
    if (budgetToEdit?.categoryId) return budgetToEdit.categoryId;
    return categories.length > 0 ? categories[0].id : '';
  });

  const [amount, setAmount] = useState<string>(() => {
    return budgetToEdit ? String(budgetToEdit.amount) : '';
  });

  const [month, setMonth] = useState<number>(() => {
    return budgetToEdit?.month ?? defaultMonth;
  });

  const [year, setYear] = useState<number>(() => {
    return budgetToEdit?.year ?? defaultYear;
  });

  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [autoRenew, setAutoRenew] = useState<boolean>(() => {
    if (budgetToEdit?.categoryId) {
      try {
        const raw = localStorage.getItem('gestorguita_budget_autorenew');
        if (raw) {
          const list: string[] = JSON.parse(raw);
          return list.includes(budgetToEdit.categoryId);
        }
      } catch {
        return false;
      }
    }
    return false;
  });

  const [currency, setCurrency] = useState<string>(() => {
    return budgetToEdit?.currency || 'ARS';
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions: SelectOption[] = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon,
      color: cat.color,
    }));
  }, [categories]);

  const monthOptions: SelectOption[] = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => ({
      value: String(idx + 1),
      label: name,
    }));
  }, []);

  const handleQuickAdd = (value: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, ingresa un monto válido mayor a 0');
      return;
    }

    if (!categoryId) {
      setError('Por favor, selecciona una categoría');
      return;
    }

    try {
      setIsSubmitting(true);

      let saved: BudgetItem;
      if (isEditing && budgetToEdit) {
        saved = await updateBudget(budgetToEdit.id, {
          amount: parsedAmount,
          currency,
        });
      } else {
        // Multi-month creation support
        let firstSaved: BudgetItem | null = null;
        for (let i = 0; i < durationMonths; i++) {
          const targetDate = new Date(year, month - 1 + i, 1);
          const m = targetDate.getMonth() + 1;
          const y = targetDate.getFullYear();
          const item = await createOrUpsertBudget({
            categoryId,
            amount: parsedAmount,
            month: m,
            year: y,
            currency,
          });
          if (i === 0) firstSaved = item;
        }
        saved = firstSaved!;
      }

      // Persist / toggle auto-renew preference
      try {
        const raw = localStorage.getItem('gestorguita_budget_autorenew');
        const list: string[] = raw ? JSON.parse(raw) : [];
        const nextList = autoRenew
          ? Array.from(new Set([...list, categoryId]))
          : list.filter((id) => id !== categoryId);
        localStorage.setItem(
          'gestorguita_budget_autorenew',
          JSON.stringify(nextList),
        );
      } catch {
        // LocalStorage fallback
      }

      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al procesar el presupuesto';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Presupuesto' : 'Fijar Tope Mensual'}
              </h2>
              <p className="text-xs text-slate-400">
                Define el límite de gastos para no excederte este mes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              Categoría
            </label>

            {isEditing ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${budgetToEdit?.category?.color || '#10B981'}20`,
                    color: budgetToEdit?.category?.color || '#10B981',
                  }}
                >
                  <CategoryIcon
                    name={budgetToEdit?.category?.icon}
                    className="h-4 w-4"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {budgetToEdit?.category?.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mes de {MONTH_NAMES[(budgetToEdit?.month || 1) - 1]}{' '}
                    {budgetToEdit?.year}
                  </p>
                </div>
              </div>
            ) : (
              <CustomSelect
                value={categoryId}
                onChange={(val) => setCategoryId(val)}
                options={categoryOptions}
                placeholder="Seleccionar categoría..."
                searchable={true}
              />
            )}
          </div>

          {/* Período (Mes y Año) si es creación */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  Mes Inicial
                </label>
                <CustomSelect
                  value={String(month)}
                  onChange={(val) => setMonth(Number(val))}
                  options={monthOptions}
                  placeholder="Mes..."
                  searchable={false}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Año
                </label>
                <input
                  type="number"
                  value={year}
                  min={2020}
                  max={2100}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-2.5 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Duración (Multi-mes) - Solo en creación */}
          {!isEditing && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Duración del Presupuesto
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = durationMonths === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationMonths(opt.value)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-white shadow-md shadow-emerald-950/30'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {durationMonths > 1 && (
                <p className="text-[11px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  Se creará automáticamente el tope para {durationMonths} meses consecutivos desde {MONTH_NAMES[month - 1]} {year}.
                </p>
              )}
            </div>
          )}

          {/* Renovación Automática Recurrente */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/50 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Renovación automática
                </p>
                <p className="text-[11px] text-slate-400">
                  Renovar tope cada mes automáticamente
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoRenew}
              onClick={() => setAutoRenew(!autoRenew)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoRenew ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoRenew ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Moneda y Monto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Monto Límite
              </label>

              {/* Selector de moneda */}
              <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold transition cursor-pointer ${
                      currency === curr
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                placeholder="Ej: 150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-3.5 pl-4 pr-16 text-lg font-bold text-white shadow-inner transition placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currency}
              </span>
            </div>

            {/* Atajos de Incremento Rápido */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[10000, 50000, 100000, 250000].map((quickVal) => (
                <button
                  key={quickVal}
                  type="button"
                  onClick={() => handleQuickAdd(quickVal)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />${(quickVal / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Fijar Presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BudgetModal(props: BudgetModalProps) {
  if (!props.isOpen) return null;

  return (
    <BudgetModalForm
      key={props.budgetToEdit ? props.budgetToEdit.id : 'new'}
      {...props}
    />
  );
}

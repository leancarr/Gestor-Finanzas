'use client';

import React, { useState } from 'react';
import {
  X,
  Target,
  DollarSign,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
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

  const [currency, setCurrency] = useState<string>(() => {
    return budgetToEdit?.currency || 'ARS';
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        saved = await createOrUpsertBudget({
          categoryId,
          amount: parsedAmount,
          month,
          year,
          currency,
        });
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
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
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
                  <CategoryIcon name={budgetToEdit?.category?.icon} className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {budgetToEdit?.category?.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mes de {MONTH_NAMES[(budgetToEdit?.month || 1) - 1]} {budgetToEdit?.year}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-3 px-4 text-sm font-medium text-white shadow-inner transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {categories.length === 0 && (
                    <option value="">No hay categorías registradas</option>
                  )}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>

                {selectedCategory && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: selectedCategory.color || '#10B981' }}
                    />
                    <span>Categoría seleccionada: <strong className="text-slate-200">{selectedCategory.name}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Período (Mes y Año) si es creación */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  Mes
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-2.5 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                      {name}
                    </option>
                  ))}
                </select>
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

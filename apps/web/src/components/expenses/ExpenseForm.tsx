'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DollarSign,
  Calendar,
  FileText,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createExpense, ExpenseItem } from '@/utils/api/expenses';
import {
  getCategories,
  seedDefaultCategories,
  CategoryItem,
} from '@/utils/api/categories';
import { CategoryIcon } from '@/components/categories/CategoryIcon';

// Validation schema with Zod
const expenseFormSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']).default('EXPENSE'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === 'number') return val;
      const parsed = parseFloat(val.replace(/\./g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    })
    .refine((val) => val > 0, {
      message: 'El monto debe ser mayor a 0',
    })
    .refine((val) => val <= 999999999.99, {
      message: 'El monto excede el límite permitido',
    }),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria')
    .max(255, 'La descripción no puede tener más de 255 caracteres'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  categoryId: z.string().optional().nullable(),
});

export type ExpenseFormData = z.input<typeof expenseFormSchema>;

interface ExpenseFormProps {
  onSuccess?: (expense: ExpenseItem) => void;
  onCancel?: () => void;
  redirectOnSuccess?: boolean;
  className?: string;
  defaultCategoryId?: string;
  defaultType?: 'EXPENSE' | 'INCOME';
  defaultAmount?: number;
  defaultDescription?: string;
  defaultDate?: string;
}

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export function ExpenseForm({
  onSuccess,
  onCancel,
  redirectOnSuccess = true,
  className = '',
  defaultCategoryId,
  defaultType = 'EXPENSE',
  defaultAmount,
  defaultDescription,
  defaultDate,
}: ExpenseFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSeedingCategories, setIsSeedingCategories] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Today's date in YYYY-MM-DD
  const today = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      type: defaultType,
      amount: defaultAmount ? String(defaultAmount) : '',
      description: defaultDescription || '',
      date: defaultDate || today,
      categoryId: defaultCategoryId || '',
    },
  });

  const currentType = (watch('type') || 'EXPENSE') as 'EXPENSE' | 'INCOME';
  const isIncome = currentType === 'INCOME';
  const currentAmount = watch('amount');
  const currentDate = watch('date');
  const selectedCategoryId = watch('categoryId');

  // Load user's categories
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCategories(true);
    getCategories()
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          if (defaultCategoryId && data.some((c) => c.id === defaultCategoryId)) {
            setValue('categoryId', defaultCategoryId);
          }
        }
      })
      .catch((err: unknown) => {
        console.error('Error fetching categories:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [defaultCategoryId, setValue]);

  const handleSeedDefaults = async () => {
    setIsSeedingCategories(true);
    setErrorMessage(null);
    try {
      const seeded = await seedDefaultCategories();
      setCategories(seeded);
      if (seeded.length > 0) {
        setValue('categoryId', seeded[0].id);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al cargar categorías recomendadas';
      setErrorMessage(msg);
    } finally {
      setIsSeedingCategories(false);
    }
  };

  const handlePresetAmount = (value: number) => {
    setValue('amount', value.toString(), { shouldValidate: true });
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsedAmount =
        typeof data.amount === 'number'
          ? data.amount
          : parseFloat(data.amount.replace(/\./g, '').replace(',', '.'));

      const transactionType = (data.type || 'EXPENSE') as 'EXPENSE' | 'INCOME';

      const expense = await createExpense({
        amount: parsedAmount,
        type: transactionType,
        description: data.description.trim(),
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        categoryId: data.categoryId && data.categoryId.trim() !== '' ? data.categoryId : null,
      });

      const typeLabel = transactionType === 'INCOME' ? 'Ingreso' : 'Gasto';
      setSuccessMessage(`¡${typeLabel} de $ ${parsedAmount.toLocaleString('es-AR')} guardado con éxito!`);
      
      reset({
        type: transactionType,
        amount: '',
        description: '',
        date: today,
        categoryId: '',
      });

      if (onSuccess) {
        onSuccess(expense);
      }

      if (redirectOnSuccess) {
        setTimeout(() => {
          router.push(transactionType === 'INCOME' ? '/' : '/gastos');
        }, 800);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `Ocurrió un error al registrar la transacción.`;
      setErrorMessage(msg);
    }
  };

  return (
    <div className={`rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur shadow-2xl ${className}`}>
      {/* Header Info */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 transition-colors ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
              }`}
            >
              <DollarSign className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-white">
              {isIncome ? 'Registrar Ingreso' : 'Registrar Gasto'}
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {isIncome
              ? 'Registra tus entradas de dinero (sueldo, freelance, ventas, etc.)'
              : 'Registra tus consumos diarios en pesos de manera rápida y segura'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
            isIncome
              ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
              : 'bg-slate-800 text-slate-300 ring-slate-700'
          }`}
        >
          Pesos (ARS $)
        </span>
      </div>

      {/* Prominent Type Switch (Gasto vs Ingreso) */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Tipo de Movimiento
        </label>
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setValue('type', 'EXPENSE', { shouldValidate: true })}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isIncome
                ? 'bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/40 text-rose-300 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Gasto (Egreso)</span>
          </button>

          <button
            type="button"
            onClick={() => setValue('type', 'INCOME', { shouldValidate: true })}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isIncome
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Ingreso (Entrada)</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Monto (Amount) Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Monto {isIncome ? 'del Ingreso' : 'del Gasto'}{' '}
            <span className="text-emerald-400 font-bold">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <span className={`text-lg font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>$</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              {...register('amount')}
              className={`w-full rounded-2xl border bg-slate-950/80 pl-11 pr-16 py-3.5 text-xl font-bold text-white placeholder-slate-600 shadow-inner focus:outline-none focus:ring-2 transition ${
                errors.amount
                  ? 'border-red-500/50 focus:ring-red-500/30'
                  : isIncome
                  ? 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                  : 'border-slate-800 focus:border-rose-500/60 focus:ring-rose-500/20'
              }`}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                ARS
              </span>
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1.5 text-xs text-red-400 font-medium">
              {errors.amount.message as string}
            </p>
          )}

          {/* Quick Preset Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">
              Atajos:
            </span>
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetAmount(preset)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  String(currentAmount) === String(preset)
                    ? isIncome
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-rose-500 bg-rose-500/20 text-rose-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                ${preset.toLocaleString('es-AR')}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción (Description) Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Descripción / Detalle <span className="text-emerald-400 font-bold">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <FileText className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder={
                isIncome
                  ? 'Ej: Sueldo mensual, Cobro de cliente freelance, Venta...'
                  : 'Ej: Supermercado Coto, Nafta YPF, Farmacia...'
              }
              {...register('description')}
              className={`w-full rounded-2xl border bg-slate-950/80 pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 transition ${
                errors.description
                  ? 'border-red-500/50 focus:ring-red-500/30'
                  : isIncome
                  ? 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                  : 'border-slate-800 focus:border-rose-500/60 focus:ring-rose-500/20'
              }`}
            />
          </div>
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-400 font-medium">
              {errors.description.message as string}
            </p>
          )}
        </div>

        {/* Categoría (Category) Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Categoría
            </label>
            {categories.length === 0 && !isLoadingCategories && (
              <button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeedingCategories}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                {isSeedingCategories ? 'Cargando...' : 'Cargar categorías sugeridas'}
              </button>
            )}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Tag className="h-4 w-4" />
            </div>
            <select
              {...register('categoryId')}
              disabled={isLoadingCategories}
              className={`w-full appearance-none rounded-2xl border border-slate-800 bg-slate-950/80 pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 transition cursor-pointer disabled:opacity-50 ${
                isIncome
                  ? 'focus:border-emerald-500/60 focus:ring-emerald-500/20'
                  : 'focus:border-rose-500/60 focus:ring-rose-500/20'
              }`}
            >
              <option value="">Seleccionar una categoría (opcional)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
              ▼
            </div>
          </div>

          {/* Quick Category Chips */}
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {categories.slice(0, 10).map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setValue('categoryId', isSelected ? '' : cat.id, {
                        shouldValidate: true,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs transition cursor-pointer ${
                      isSelected
                        ? isIncome
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                          : 'border-rose-500 bg-rose-500/20 text-rose-300 font-semibold shadow-sm'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || '#10B981' }}
                    />
                    <CategoryIcon name={cat.icon} className="h-3 w-3 shrink-0" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fecha (Date) Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Fecha {isIncome ? 'del Ingreso' : 'del Gasto'}{' '}
              <span className="text-emerald-400 font-bold">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue('date', today, { shouldValidate: true })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  currentDate === today
                    ? isIncome
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-medium'
                      : 'border-rose-500 bg-rose-500/20 text-rose-300 font-medium'
                    : 'border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setValue('date', yesterday, { shouldValidate: true })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  currentDate === yesterday
                    ? isIncome
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-medium'
                      : 'border-rose-500 bg-rose-500/20 text-rose-300 font-medium'
                    : 'border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Ayer
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              type="date"
              {...register('date')}
              className={`w-full rounded-2xl border bg-slate-950/80 pl-10 pr-4 py-3 text-xs text-white shadow-inner focus:outline-none focus:ring-2 transition cursor-pointer ${
                errors.date
                  ? 'border-red-500/50 focus:ring-red-500/30'
                  : isIncome
                  ? 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                  : 'border-slate-800 focus:border-rose-500/60 focus:ring-rose-500/20'
              }`}
            />
          </div>
          {errors.date && (
            <p className="mt-1.5 text-xs text-red-400 font-medium">
              {errors.date.message as string}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50 hover:shadow-emerald-900/50'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50 hover:shadow-rose-900/50'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isIncome ? 'Guardando Ingreso...' : 'Guardando Gasto...'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {isIncome ? 'Registrar Ingreso' : 'Registrar Gasto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ExpenseItem } from '@/utils/api/expenses';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  Receipt,
  ArrowRight,
  Plus,
  Calendar,
  Tag,
} from 'lucide-react';
import {
  SupportedCurrency,
  CURRENCY_LIST,
  FALLBACK_RATES,
  convertCurrencyLocal,
  formatCurrency as formatCurrencyWithRates,
} from '@/utils/api/rates';

interface RecentExpensesListProps {
  expenses: ExpenseItem[];
  loading?: boolean;
  preferredCurrency?: SupportedCurrency;
  rates?: Record<SupportedCurrency, number>;
}

export function RecentExpensesList({
  expenses,
  loading = false,
  preferredCurrency = 'ARS',
  rates = FALLBACK_RATES,
}: RecentExpensesListProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    if (isToday) {
      return 'Hoy';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
    }).format(d);
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="h-5 w-40 rounded bg-slate-800 animate-pulse" />
          <div className="h-4 w-20 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-slate-800/60 bg-slate-900/30 p-3 animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 rounded bg-slate-800" />
                  <div className="h-3 w-16 rounded bg-slate-800/60" />
                </div>
              </div>
              <div className="h-4 w-16 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Últimos Movimientos
            </h3>
            <p className="text-[11px] text-slate-400">
              Los 5 gastos más recientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/gastos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Expenses Content */}
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500 mb-3 border border-slate-700/50">
            <Receipt className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">
            No hay gastos recientes
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Tus transacciones aparecerán aquí a medida que las registres.
          </p>
          <Link
            href="/gastos/nuevo"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Gasto
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {expenses.map((expense) => {
            const category = expense.category;
            const categoryColor = category?.color || '#10B981';
            const numericAmount =
              typeof expense.amount === 'number'
                ? expense.amount
                : parseFloat(String(expense.amount)) || 0;
            const expenseCurrency = (expense.currency || 'ARS').toUpperCase() as SupportedCurrency;
            const currencyInfo = CURRENCY_LIST[expenseCurrency] || CURRENCY_LIST.ARS;
            const formattedOriginal = formatCurrencyWithRates(numericAmount, expenseCurrency);
            const isDifferentCurrency = expenseCurrency !== preferredCurrency;
            const convertedToPreferred = isDifferentCurrency
              ? convertCurrencyLocal(numericAmount, expenseCurrency, preferredCurrency, rates)
              : null;

            return (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-transparent hover:border-white/10 hover:bg-white/5 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category Icon */}
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-inset shrink-0 shadow-sm"
                    style={{
                      backgroundColor: `${categoryColor}15`,
                      borderColor: `${categoryColor}30`,
                      color: categoryColor,
                    }}
                  >
                    {category ? (
                      <CategoryIcon name={category.icon} className="h-5 w-5" />
                    ) : (
                      <Tag className="h-5 w-5 text-slate-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {expense.description}
                      </p>

                      {/* Currency badge if foreign or different */}
                      <span
                        className="shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold border border-slate-700/60 bg-slate-800/80 text-slate-300"
                        title={`Transacción en ${currencyInfo.name}`}
                      >
                        <span>{currencyInfo.flag}</span>
                        <span>{expenseCurrency}</span>
                      </span>

                      {/* Tax badge */}
                      {expense.isTaxable && (
                        <span
                          className="shrink-0 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300"
                          title="Cálculo impositivo aplicado"
                        >
                          <Receipt className="h-2.5 w-2.5" />
                          <span>Impuestos</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      {category ? (
                        <span
                          className="font-medium"
                          style={{ color: categoryColor }}
                        >
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Sin categoría</span>
                      )}
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(expense.date)}
                      </span>
                      {expense.user && (
                        <>
                          <span>•</span>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 shadow-xs"
                            title={`Cargado por ${expense.user.name || expense.user.email}`}
                          >
                            {expense.user.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={expense.user.avatarUrl}
                                alt={expense.user.name || 'Avatar'}
                                className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-700/80 text-[9px] font-bold text-slate-300 shrink-0">
                                👤
                              </span>
                            )}
                            <span className="truncate max-w-[100px]">
                              {expense.user.name || expense.user.email?.split('@')[0] || 'Miembro'}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Type Indicator */}
                <div className="text-right shrink-0 ml-3">
                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight block ${
                      expense.type === 'INCOME'
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    {expense.type === 'INCOME' ? '+' : '-'} {formattedOriginal}
                  </span>
                  {isDifferentCurrency && convertedToPreferred !== null && (
                    <span className="text-[10px] text-slate-400 block font-normal">
                      ≈ {formatCurrencyWithRates(convertedToPreferred, preferredCurrency)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-2 text-center">
            <Link
              href="/gastos/nuevo"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              Registrar otro gasto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

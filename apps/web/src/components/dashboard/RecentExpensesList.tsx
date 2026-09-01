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

interface RecentExpensesListProps {
  expenses: ExpenseItem[];
  loading?: boolean;
}

export function RecentExpensesList({
  expenses,
  loading = false,
}: RecentExpensesListProps) {
  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

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
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur shadow-sm">
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
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur shadow-sm flex flex-col justify-between">
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

            return (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all shadow-sm"
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
                    <p className="truncate text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {expense.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
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
                    </div>
                  </div>
                </div>

                  {/* Amount & Type Indicator */}
                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight ${
                        expense.type === 'INCOME'
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {expense.type === 'INCOME' ? '+' : '-'} {formatCurrency(expense.amount)}
                    </span>
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

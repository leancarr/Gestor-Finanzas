'use client';

import React from 'react';
import { Calendar, Trash2, Tag } from 'lucide-react';
import { ExpenseItem } from '@/utils/api/expenses';
import { CategoryIcon } from '@/components/categories/CategoryIcon';

interface ExpenseCardProps {
  expense: ExpenseItem;
  onDelete?: (expense: ExpenseItem) => void;
}

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const numericAmount =
    typeof expense.amount === 'number'
      ? expense.amount
      : parseFloat(String(expense.amount));

  const formattedAmount = isNaN(numericAmount)
    ? '$ 0,00'
    : new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);

  // Format date nicely
  const expenseDate = new Date(expense.date);
  const formattedDate = !isNaN(expenseDate.getTime())
    ? new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(expenseDate)
    : expense.date;

  const category = expense.category;
  const categoryColor = category?.color || '#10B981';

  return (
    <div className="group relative flex items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur hover:border-slate-700/80 hover:bg-slate-900/90 transition-all shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Category Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset shadow-md"
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

        {/* Expense Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {expense.description}
            </p>
            {expense.type === 'INCOME' && (
              <span className="shrink-0 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Ingreso
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            {category && (
              <span
                className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                />
                {category.name}
              </span>
            )}
            {!category && (
              <span className="text-slate-500 italic">Sin categoría</span>
            )}
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Calendar className="h-3 w-3 text-slate-500" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-sm sm:text-base font-bold tracking-tight ${
            expense.type === 'INCOME' ? 'text-emerald-400' : 'text-white'
          }`}
        >
          {expense.type === 'INCOME' ? '+' : '-'} {formattedAmount}
        </span>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(expense)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-slate-500 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer"
            title="Eliminar gasto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Calendar, Trash2, Tag, Receipt } from 'lucide-react';
import { ExpenseItem } from '@/utils/api/expenses';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { TagBadge } from '@/components/tags/TagBadge';
import {
  formatCurrency,
  SupportedCurrency,
  CURRENCY_LIST,
  FALLBACK_RATES,
} from '@/utils/api/rates';

interface ExpenseCardProps {
  expense: ExpenseItem;
  onDelete?: (expense: ExpenseItem) => void;
  onTagClick?: (tag: string) => void;
}

const CURRENCY_BADGE_STYLES: Record<
  SupportedCurrency,
  { bg: string; text: string; border: string }
> = {
  ARS: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
  },
  USD: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  EUR: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  USDT: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/20',
  },
};

export function ExpenseCard({ expense, onDelete, onTagClick }: ExpenseCardProps) {
  const numericAmount =
    typeof expense.amount === 'number'
      ? expense.amount
      : parseFloat(String(expense.amount));

  const currencyCode = (expense.currency || 'ARS').toUpperCase() as SupportedCurrency;
  const currencyInfo = CURRENCY_LIST[currencyCode] || CURRENCY_LIST.ARS;
  const badgeStyle = CURRENCY_BADGE_STYLES[currencyCode] || CURRENCY_BADGE_STYLES.ARS;

  const formattedAmount = isNaN(numericAmount)
    ? '$ 0,00'
    : formatCurrency(numericAmount, currencyCode);

  // Approximate ARS conversion for foreign currencies
  const isForeign = currencyCode !== 'ARS';
  const exchangeRate = expense.exchangeRate
    ? Number(expense.exchangeRate)
    : FALLBACK_RATES[currencyCode] || 1;
  const estimatedArs = isForeign && !isNaN(numericAmount) ? numericAmount * exchangeRate : null;

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

  // Extract tags from expense.tags or inline hashtags in description
  const inlineTags = (expense.description.match(/#[a-zA-Z0-9_\u00C0-\u00FF-]+/g) || []).map((t) => t.trim());
  const combinedTags = Array.from(new Set([...(expense.tags || []), ...inlineTags]));

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
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <p className="truncate text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {expense.description}
            </p>

            {/* Transaction Type Badge */}
            {expense.type === 'INCOME' && (
              <span className="shrink-0 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                Ingreso
              </span>
            )}

            {/* Currency Badge */}
            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
              title={`Transacción en ${currencyInfo.name}`}
            >
              <span>{currencyInfo.flag}</span>
              <span>{currencyCode}</span>
            </span>

            {/* Taxable Badge */}
            {expense.isTaxable && (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
                title="Cálculo de impuestos incluido"
              >
                <Receipt className="h-2.5 w-2.5" />
                <span>Impuestos</span>
              </span>
            )}

            {/* Event Tags Badges */}
            {combinedTags.map((tagStr) => (
              <TagBadge
                key={tagStr}
                tag={tagStr}
                size="xs"
                onClick={onTagClick}
              />
            ))}
          </div>

          {/* Subtitle Details: Category, Date, Exchange Rate */}
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

            {/* Foreign Currency Conversion Note */}
            {isForeign && estimatedArs !== null && (
              <>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline font-medium">
                  TC: ${exchangeRate.toLocaleString('es-AR')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span
            className={`text-sm sm:text-base font-bold tracking-tight block ${
              expense.type === 'INCOME' ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {expense.type === 'INCOME' ? '+' : '-'} {formattedAmount}
          </span>
          {isForeign && estimatedArs !== null && (
            <span className="text-[10px] text-slate-400 block font-normal">
              ≈ {formatCurrency(estimatedArs, 'ARS')}
            </span>
          )}
        </div>

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

'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
} from 'lucide-react';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { BudgetItem } from '@/utils/api/budgets';

interface BudgetCardProps {
  budget: BudgetItem;
  onEdit: (budget: BudgetItem) => void;
  onDelete: (budget: BudgetItem) => void;
}

export function formatMoney(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const category = budget.category || {
    name: 'Categoría eliminada',
    color: '#64748B',
    icon: 'Tag',
  };

  const color = category.color || '#10B981';
  const percentage = Math.round(budget.percentage * 10) / 10;
  const isExceeded = budget.status === 'EXCEEDED';
  const isWarning = budget.status === 'WARNING';

  // Configuración de estilos según estado
  let statusBadge = {
    label: 'Normal',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    barColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/10',
  };

  if (isExceeded) {
    statusBadge = {
      label: 'Superado',
      icon: AlertOctagon,
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold',
      barColor: 'bg-rose-500',
      glowColor: 'shadow-rose-500/20',
    };
  } else if (isWarning) {
    statusBadge = {
      label: 'Alerta (80%+)',
      icon: AlertTriangle,
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold',
      barColor: 'bg-amber-500',
      glowColor: 'shadow-amber-500/20',
    };
  }

  const StatusIcon = statusBadge.icon;
  const progressWidth = Math.min(percentage, 100);

  return (
    <div
      className={`group relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl ${statusBadge.glowColor} flex flex-col justify-between`}
    >
      <div>
        {/* Cabecera: Icono de Categoría, Título y Acciones */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 shadow-md"
              style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
                boxShadow: `0 4px 16px ${color}20`,
              }}
            >
              <CategoryIcon name={category.icon} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                {category.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                Tope mensual de gastos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100 transition">
            <button
              onClick={() => onEdit(budget)}
              title="Editar presupuesto"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(budget)}
              title="Eliminar presupuesto"
              className="rounded-xl p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cifras Principales: Gastado vs Presupuestado */}
        <div className="mt-5 space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Gastado
              </span>
              <p className="text-xl font-extrabold text-white">
                {formatMoney(budget.spentAmount, budget.currency)}
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Límite
              </span>
              <p className="text-base font-semibold text-slate-300">
                {formatMoney(budget.amount, budget.currency)}
              </p>
            </div>
          </div>

          {/* Barra Visual de Progreso */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-950/80 p-0.5 border border-slate-800/80 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${statusBadge.barColor} ${
                isExceeded ? 'animate-pulse' : ''
              }`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          {/* Porcentaje y Badge de Estado */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusBadge.badgeClass}`}
            >
              <StatusIcon className="h-3 w-3" />
              {statusBadge.label}
            </span>

            <span className="font-mono font-bold text-slate-200">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Pie de Tarjeta: Saldo Restante / Excedente */}
      <div className="mt-5 border-t border-slate-800/60 pt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
          {isExceeded ? 'Exceso acumulado:' : 'Disponible restante:'}
        </span>
        <span
          className={`font-mono font-bold ${
            isExceeded
              ? 'text-rose-400'
              : isWarning
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {isExceeded
            ? `+${formatMoney(Math.abs(budget.remaining), budget.currency)}`
            : formatMoney(budget.remaining, budget.currency)}
        </span>
      </div>
    </div>
  );
}

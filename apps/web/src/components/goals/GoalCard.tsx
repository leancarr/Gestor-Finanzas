'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Plus,
  ArrowUpRight,
  Sparkles,
  Loader2,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  Goal,
  addGoalDeposit,
  calculateGoalMetrics,
} from '@/utils/api/goals';
import { formatCurrency } from '@/utils/api/rates';

interface GoalCardProps {
  goal: Goal;
  onGoalUpdated: (updatedGoal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onDepositSuccess?: (goal: Goal, amount: number) => void;
}

export function GoalCard({
  goal,
  onGoalUpdated,
  onEdit,
  onDelete,
  onDepositSuccess,
}: GoalCardProps) {
  const [isDepositing, setIsDepositing] = useState(false);
  const [activeDepositAmount, setActiveDepositAmount] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [feedbackDeposit, setFeedbackDeposit] = useState<{
    amount: number;
    id: number;
  } | null>(null);

  const metrics = calculateGoalMetrics(goal);
  const color = goal.color || '#10B981';

  // Format deadline date in friendly Argentine Spanish
  const formattedDeadline = React.useMemo(() => {
    if (!goal.deadline) return 'Sin fecha límite';
    const d = new Date(goal.deadline + 'T00:00:00');
    if (isNaN(d.getTime())) return goal.deadline;
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }, [goal.deadline]);

  // Determine fast injection options based on currency
  const quickAmounts =
    goal.currency === 'USD'
      ? [
          { label: '+ US$ 20', value: 20 },
          { label: '+ US$ 50', value: 50 },
          { label: '+ US$ 100', value: 100 },
        ]
      : [
          { label: '+ $10.000', value: 10000 },
          { label: '+ $50.000', value: 50000 },
          { label: '+ $100.000', value: 100000 },
        ];

  const handleDeposit = async (amount: number) => {
    if (amount <= 0 || isDepositing) return;

    setIsDepositing(true);
    setActiveDepositAmount(amount);
    setCustomError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Inyectar depósito a la meta y registrar egreso automático en Gastos (Ahorro & Metas)
      const updated = await addGoalDeposit(
        goal.id,
        amount,
        `Inyección rápida a ${goal.name}`,
      );

      // 2. Feedback visual inmediato
      setFeedbackDeposit({ amount, id: Date.now() });
      setTimeout(() => {
        setFeedbackDeposit((prev) => (prev?.amount === amount ? null : prev));
      }, 3500);

      onGoalUpdated(updated);
      if (onDepositSuccess) {
        onDepositSuccess(updated, amount);
      }

      setShowCustomInput(false);
      setCustomAmount('');
    } catch (err: unknown) {
      console.error('Error al realizar aporte rápido:', err);
      setCustomError(
        err instanceof Error ? err.message : 'Error al procesar el aporte.',
      );
    } finally {
      setIsDepositing(false);
      setActiveDepositAmount(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(customAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setCustomError('Ingresá un monto válido mayor a 0');
      return;
    }
    handleDeposit(parsed);
  };

  return (
    <div
      className="group relative flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-2xl shadow-slate-950/40"
      style={{
        boxShadow: feedbackDeposit
          ? `0 0 25px ${color}30, 0 10px 30px rgba(0,0,0,0.5)`
          : undefined,
      }}
    >
      {/* Visual Feedback Banner after deposit */}
      {feedbackDeposit && (
        <div className="absolute -top-3 inset-x-6 z-20 flex items-center justify-center gap-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black py-1 px-3 shadow-lg shadow-emerald-950/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="h-3.5 w-3.5 fill-current" />
          <span>
            +{formatCurrency(feedbackDeposit.amount, goal.currency)} inyectados con éxito!
          </span>
        </div>
      )}

      <div>
        {/* Header: Icon, Name, Currency, & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${color}18`,
                borderColor: `${color}40`,
                borderWidth: '1px',
                color: color,
              }}
            >
              <CategoryIcon name={goal.icon} className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                  {goal.currency}
                </span>
                {metrics.isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>¡Meta Cumplida!</span>
                  </span>
                ) : metrics.isOverdue ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>Plazo Vencido</span>
                  </span>
                ) : null}
              </div>

              <h3 className="text-base font-bold text-white tracking-tight truncate mt-1" title={goal.name}>
                {goal.name}
              </h3>
            </div>
          </div>

          {/* Action buttons (Edit & Delete) */}
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(goal)}
                className="p-1.5 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title="Editar meta"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(goal)}
                className="p-1.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                title="Eliminar meta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Financial Progress: Current vs Target */}
        <div className="mt-5 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Ahorrado
              </span>
              <p className="text-xl font-black tracking-tight text-white">
                {formatCurrency(goal.currentAmount, goal.currency)}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Objetivo
              </span>
              <p className="text-sm font-bold text-slate-300">
                {formatCurrency(goal.targetAmount, goal.currency)}
              </p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="relative">
            <div className="h-3 w-full rounded-full bg-slate-950/90 border border-slate-800/80 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, metrics.percentage)}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}80`,
                }}
              />
            </div>

            {/* Percentage badge floating / indicator */}
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className="text-slate-400 font-medium">
                {metrics.isCompleted
                  ? 'Objetivo 100% alcanzado'
                  : `Faltan ${formatCurrency(metrics.remainingAmount, goal.currency)}`}
              </span>
              <span
                className="font-extrabold text-sm"
                style={{ color: metrics.isCompleted ? '#10B981' : color }}
              >
                {metrics.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Deadline and Remaining Days Cluster */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5" title="Fecha límite de la meta">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{formattedDeadline}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            {metrics.isCompleted ? (
              <span className="text-emerald-400 font-semibold">Completada</span>
            ) : metrics.daysRemaining > 1 ? (
              <span className="font-semibold text-slate-300">
                {metrics.daysRemaining} días restantes
              </span>
            ) : metrics.daysRemaining === 1 ? (
              <span className="font-semibold text-amber-400">¡Vence mañana!</span>
            ) : metrics.daysRemaining === 0 ? (
              <span className="font-semibold text-rose-400">¡Vence hoy!</span>
            ) : (
              <span className="font-semibold text-rose-400">
                Vencida hace {Math.abs(metrics.daysRemaining)} d
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SEI-53: Fast Injection Cluster */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Inyección Rápida</span>
          </span>
          <span className="text-[10px] text-slate-500">
            Descuenta de gastos
          </span>
        </div>

        {/* Fast buttons grid */}
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((opt) => {
            const isLoadingThis = isDepositing && activeDepositAmount === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isDepositing}
                onClick={() => handleDeposit(opt.value)}
                className="relative flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border border-slate-800 bg-slate-950/80 text-emerald-400 hover:text-white hover:bg-emerald-600/20 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
              >
                {isLoadingThis ? (
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                ) : (
                  <span>{opt.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toggle 'Otro monto' */}
        {!showCustomInput ? (
          <button
            type="button"
            disabled={isDepositing}
            onClick={() => setShowCustomInput(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-slate-700/80 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/40 transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Otro monto</span>
          </button>
        ) : (
          <form
            onSubmit={handleCustomSubmit}
            className="space-y-2 pt-1 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  step="any"
                  autoFocus
                  placeholder={`Monto en ${goal.currency}...`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                  {goal.currency}
                </span>
              </div>

              <button
                type="submit"
                disabled={isDepositing || !customAmount}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isDepositing && activeDepositAmount === Number(customAmount) ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Aportar'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomAmount('');
                  setCustomError(null);
                }}
                className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {customError && (
              <p className="text-[11px] text-rose-400">{customError}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

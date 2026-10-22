'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  PiggyBank,
  Shield,
  Plane,
  Car,
  Home,
  Laptop,
  TrendingUp,
  Sparkles,
  HeartPulse,
  GraduationCap,
  Gift,
  Loader2,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { CustomColorPicker, HARMONIC_COLORS } from '@/components/ui/CustomColorPicker';
import { CustomAmountInput } from '@/components/ui/CustomAmountInput';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  Goal,
  GoalCurrency,
  createGoal,
  updateGoal,
  CreateGoalInput,
} from '@/utils/api/goals';
import { formatCurrency } from '@/utils/api/rates';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: (newGoal: Goal) => void;
  goalToEdit?: Goal | null;
  vaultId?: string | null;
}

const GOAL_ICON_PRESETS = [
  { name: 'Target', label: 'Objetivo' },
  { name: 'PiggyBank', label: 'Alcancía' },
  { name: 'Shield', label: 'Seguridad' },
  { name: 'Plane', label: 'Viaje' },
  { name: 'Car', label: 'Vehículo' },
  { name: 'Home', label: 'Vivienda' },
  { name: 'Laptop', label: 'Tecnología' },
  { name: 'TrendingUp', label: 'Inversión' },
  { name: 'Sparkles', label: 'Especial' },
  { name: 'GraduationCap', label: 'Estudio' },
  { name: 'HeartPulse', label: 'Salud' },
  { name: 'Gift', label: 'Regalo' },
];

export function NewGoalModal({
  isOpen,
  onClose,
  onGoalCreated,
  goalToEdit,
  vaultId,
}: NewGoalModalProps) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<GoalCurrency>('ARS');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [color, setColor] = useState<string>(HARMONIC_COLORS[0].hex);
  const [icon, setIcon] = useState<string>('Target');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form when modal opens or goalToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (goalToEdit) {
      setName(goalToEdit.name);
      setCurrency(goalToEdit.currency);
      setTargetAmount(String(goalToEdit.targetAmount));
      setCurrentAmount(String(goalToEdit.currentAmount));
      setDeadline(goalToEdit.deadline);
      setColor(goalToEdit.color);
      setIcon(goalToEdit.icon || 'Target');
    } else {
      setName('');
      setCurrency('ARS');
      setTargetAmount('');
      setCurrentAmount('');

      // Default deadline to 3 months from now
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 3);
      const y = defaultDate.getFullYear();
      const m = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const d = String(defaultDate.getDate()).padStart(2, '0');
      setDeadline(`${y}-${m}-${d}`);

      setColor(HARMONIC_COLORS[0].hex);
      setIcon('Target');
    }
    setErrorMessage(null);
  }, [isOpen, goalToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Ingresá un nombre de al menos 2 caracteres para la meta.');
      return;
    }

    const parsedTarget = Number(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setErrorMessage('El monto objetivo debe ser mayor a 0.');
      return;
    }

    if (!deadline) {
      setErrorMessage('Seleccioná una fecha límite estimada para la meta.');
      return;
    }

    const parsedCurrent = Number(currentAmount) || 0;

    setIsSubmitting(true);
    try {
      if (goalToEdit) {
        const updated = await updateGoal(goalToEdit.id, {
          name: trimmedName,
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          currency,
          color,
          icon,
          deadline,
        });
        onGoalCreated(updated);
      } else {
        const input: CreateGoalInput = {
          name: trimmedName,
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          currency,
          color,
          icon,
          deadline,
          vaultId: vaultId ?? null,
        };
        const created = await createGoal(input);
        onGoalCreated(created);
      }
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar meta:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al procesar la meta.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericTarget = Number(targetAmount) || 0;
  const numericCurrent = Number(currentAmount) || 0;
  const previewProgress =
    numericTarget > 0 ? Math.min(100, Math.round((numericCurrent / numericTarget) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 sm:p-7 text-slate-100 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-md transition-colors"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}40`,
                borderWidth: '1px',
                color: color,
              }}
            >
              <CategoryIcon name={icon} className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{goalToEdit ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Patrimonio
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fijá un objetivo financiero claro con inyecciones rápidas y fecha límite.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div
          className="mb-5 rounded-2xl border p-4 transition-all duration-300"
          style={{
            borderColor: `${color}40`,
            backgroundColor: `${color}08`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner text-white font-bold"
                style={{ backgroundColor: color }}
              >
                <CategoryIcon name={icon} className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Vista Previa
                </span>
                <h4 className="text-sm font-bold text-white truncate">
                  {name.trim() || 'Nombre de la Meta'}
                </h4>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-white">
                {numericTarget > 0 ? formatCurrency(numericTarget, currency) : `$ 0`}
              </span>
              <span className="block text-[10px] text-slate-400">
                Progreso: {previewProgress}%
              </span>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${previewProgress}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name & Currency in row */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nombre de la Meta <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Fondo de Emergencia, Vacaciones en Japón..."
                maxLength={60}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Divisa <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrency('ARS')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currency === 'ARS'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ARS ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  USD (US$)
                </button>
              </div>
            </div>
          </div>

          {/* Amounts: Target & Current */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomAmountInput
              label="Monto Objetivo"
              required
              currency={currency}
              currencySymbol={currency === 'USD' ? 'US$' : '$'}
              placeholder="0.00"
              value={targetAmount}
              onChange={(val) => setTargetAmount(val)}
            />

            <CustomAmountInput
              label="Monto Ya Ahorrado (Inicial)"
              currency={currency}
              currencySymbol={currency === 'USD' ? 'US$' : '$'}
              placeholder="0.00"
              value={currentAmount}
              onChange={(val) => setCurrentAmount(val)}
            />
          </div>

          {/* Deadline */}
          <div>
            <CustomDatePicker
              label="Fecha Límite Estimada"
              required
              value={deadline}
              onChange={(val) => setDeadline(val)}
              placeholder="Seleccionar fecha de vencimiento"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Ícono de Identificación
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-6 gap-2 p-2 rounded-2xl bg-slate-950/80 border border-slate-800">
              {GOAL_ICON_PRESETS.map((item) => {
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    title={item.label}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40 shadow-md scale-105'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <CategoryIcon name={item.name} className="h-5 w-5" />
                    <span className="text-[9px] mt-1 font-medium truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Color Picker */}
          <div>
            <CustomColorPicker
              label="Color Temático de la Meta"
              value={color}
              onChange={(newHex) => setColor(newHex)}
            />
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{goalToEdit ? 'Actualizar Meta' : 'Crear Meta de Ahorro'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

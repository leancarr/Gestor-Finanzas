'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Shield,
  Trophy,
  Medal,
  Crown,
  Flame,
  Zap,
  Target,
  Plus,
  Check,
  Award,
  LucideIcon,
} from 'lucide-react';
import { createChallenge, Challenge, CreateChallengeInput } from '@/utils/api/gamification';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated?: (challenge: Challenge) => void;
}

interface PresetChallenge {
  id: string;
  title: string;
  description: string;
  targetDays: number;
  badgeIcon: string;
  badgeName: string;
  icon: LucideIcon;
  color: string;
}

const PRESET_CHALLENGES: PresetChallenge[] = [
  {
    id: 'preset-delivery',
    title: 'Mano de hierro: No pedir delivery por 14 días',
    description: 'Evitá apps de delivery (PedidosYa, Rappi) y cociná en casa para blindar tu presupuesto.',
    targetDays: 14,
    badgeIcon: 'Shield',
    badgeName: 'Mano de Hierro',
    icon: Shield,
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 'preset-ninja',
    title: 'Ninja del Ahorro: 7 días sin gastos hormiga',
    description: 'Eliminá cafés al paso, golosinas y compras impulsivas diarias menores a $5.000.',
    targetDays: 7,
    badgeIcon: 'Zap',
    badgeName: 'Ninja del Ahorro',
    icon: Zap,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'preset-cook',
    title: 'Hogar Dulce Hogar: Cocinar en casa 10 días seguidos',
    description: 'Prepará almuerzos y cenas caseros de lunes a viernes con ingredientes que ya tenés.',
    targetDays: 10,
    badgeIcon: 'Trophy',
    badgeName: 'Chef de Presupuesto',
    icon: Trophy,
    color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'preset-antojos',
    title: 'Semana Cero Antojos: 7 días sin compras impulsivas',
    description: 'Comprá únicamente lo estrictamente planificado en tu lista de supermercado.',
    targetDays: 7,
    badgeIcon: 'Crown',
    badgeName: 'Autocontrol Real',
    icon: Crown,
    color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
  },
];

const AVAILABLE_ICONS = [
  { name: 'Shield', label: 'Escudo', icon: Shield },
  { name: 'Trophy', label: 'Trofeo', icon: Trophy },
  { name: 'Medal', label: 'Medalla', icon: Medal },
  { name: 'Crown', label: 'Corona', icon: Crown },
  { name: 'Flame', label: 'Llama', icon: Flame },
  { name: 'Zap', label: 'Rayo', icon: Zap },
  { name: 'Target', label: 'Blanco', icon: Target },
];

export function CreateChallengeModal({
  isOpen,
  onClose,
  onChallengeCreated,
}: CreateChallengeModalProps) {
  const [selectedTab, setSelectedTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_CHALLENGES[0].id);

  // Formulario personalizado
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customTargetDays, setCustomTargetDays] = useState(7);
  const [customBadgeName, setCustomBadgeName] = useState('');
  const [customBadgeIcon, setCustomBadgeIcon] = useState('Trophy');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let challengeInput: CreateChallengeInput;

      if (selectedTab === 'presets') {
        const preset = PRESET_CHALLENGES.find((p) => p.id === selectedPresetId);
        if (!preset) throw new Error('Preset no encontrado');
        challengeInput = {
          title: preset.title,
          description: preset.description,
          targetDays: preset.targetDays,
          badgeIcon: preset.badgeIcon,
          badgeName: preset.badgeName,
        };
      } else {
        if (!customTitle.trim()) {
          throw new Error('El título del reto es obligatorio');
        }
        if (customTargetDays <= 0 || customTargetDays > 365) {
          throw new Error('La duración debe estar entre 1 y 365 días');
        }
        challengeInput = {
          title: customTitle.trim(),
          description: customDescription.trim() || undefined,
          targetDays: Number(customTargetDays),
          badgeIcon: customBadgeIcon,
          badgeName: customBadgeName.trim() || 'Campeón del Ahorro',
        };
      }

      const created = await createChallenge(challengeInput);
      if (onChallengeCreated) {
        onChallengeCreated(created);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear reto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-md bg-black/70 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-emerald-950/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Crear Nuevo Reto de Ahorro</span>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  Modo Ahorro
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Elegí un preset de disciplina o configurá tu propio desafío personalizado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher: Presets vs Personalizado */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedTab('presets')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'presets'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Presets Divertidos</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('custom')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'custom'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Personalizado</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {selectedTab === 'presets' ? (
            /* Presets List */
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {PRESET_CHALLENGES.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                const IconComp = preset.icon;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`relative flex items-start gap-4 rounded-2xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-950/30'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border shrink-0 bg-gradient-to-br ${preset.color}`}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white tracking-tight">
                          {preset.title}
                        </h4>
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300 shrink-0">
                          {preset.targetDays} días
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        {preset.description}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                        <Award className="h-3 w-3" />
                        Medalla: {preset.badgeName}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Título del Reto <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ej: Cero gaseosas por 14 días..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Descripción o Regla de Ahorro
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Explica la meta o regla que debes cumplir cada día..."
                  rows={2}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Días Objetivo (Meta de Racha)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customTargetDays}
                      onChange={(e) => setCustomTargetDays(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-white font-bold focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      required
                    />
                    <div className="flex gap-1">
                      {[7, 14, 21, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCustomTargetDays(d)}
                          className={`rounded-xl border px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
                            customTargetDays === d
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Nombre de la Medalla
                  </label>
                  <input
                    type="text"
                    value={customBadgeName}
                    onChange={(e) => setCustomBadgeName(e.target.value)}
                    placeholder="Ej: Maestro de la Voluntad"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Selector de Ícono para la Medalla */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Ícono de la Recompensa
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {AVAILABLE_ICONS.map((item) => {
                    const isSelected = customBadgeIcon === item.name;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setCustomBadgeIcon(item.name)}
                        className={`flex items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <IconComp className="h-4 w-4 text-amber-400" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            >
              <Trophy className="h-4 w-4" />
              <span>{isSubmitting ? 'Creando reto...' : 'Activar Reto de Ahorro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Flame, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { getGamificationOverview, checkInStreak } from '@/utils/api/gamification';
import { ConfettiReward } from './ConfettiReward';

interface StreakBadgeProps {
  className?: string;
  initialStreak?: number;
}

export function StreakBadge({ className = '', initialStreak }: StreakBadgeProps) {
  const [streak, setStreak] = useState<number>(initialStreak ?? 7);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckedInToday, setIsCheckedInToday] = useState(() => {
    if (typeof window !== 'undefined') {
      const lastCheckInDate = localStorage.getItem('gestorguita_last_checkin_date');
      const today = new Date().toISOString().split('T')[0];
      return lastCheckInDate === today;
    }
    return false;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Cargar estado real de racha
  useEffect(() => {
    let isMounted = true;
    getGamificationOverview()
      .then((data) => {
        if (isMounted && data) {
          setStreak(data.savingStreak);
        }
      })
      .catch(() => {
        // Silencioso
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCheckedInToday || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await checkInStreak();
      setStreak(res.savingStreak);
      setIsCheckedInToday(true);
      setShowConfetti(true);

      if (typeof window !== 'undefined') {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('gestorguita_last_checkin_date', today);
      }
    } catch {
      // Fallback optimista
      setStreak((prev) => prev + 1);
      setIsCheckedInToday(true);
      setShowConfetti(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStreakTierMessage = (days: number) => {
    if (days >= 30) return '¡Modo Titán Financiero! Más de un mes de disciplina invencible.';
    if (days >= 14) return '¡Racha en Fuego! Dos semanas dominando tus impulsos.';
    if (days >= 7) return '¡Imparable! Una semana completa de ahorro inteligente.';
    if (days >= 3) return '¡Gran comienzo! Estás forjando el hábito de ahorrar.';
    return '¡Iniciá tu racha hoy! Cada día sin gastos innecesarios suma.';
  };

  return (
    <>
      <ConfettiReward active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 shadow-sm shadow-amber-950/40 transition-all cursor-pointer select-none"
          title="Ver estado de racha de ahorro"
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <Flame className="h-4 w-4 text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-transform animate-pulse" />
          </span>
          <span className="tracking-wide">{streak} {streak === 1 ? 'día' : 'días'}</span>
        </button>

        {/* Dropdown Popover / Tooltip */}
        {isOpen && (
          <div className="absolute right-0 mt-2.5 w-72 sm:w-80 rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-amber-950/40 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                  <Flame className="h-4 w-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Racha de Ahorro
                  </h4>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    Modo Ahorro Extremo
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-black text-amber-300">
                🔥 {streak} {streak === 1 ? 'día' : 'días'}
              </span>
            </div>

            {/* Motivational message */}
            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              {getStreakTierMessage(streak)}
            </p>

            {/* Daily Check-in Action */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={isCheckedInToday || isSubmitting}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all shadow-md ${
                  isCheckedInToday
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 cursor-default'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-950/50 cursor-pointer'
                }`}
              >
                {isCheckedInToday ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>¡Check-in de hoy completado!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{isSubmitting ? 'Registrando...' : 'Registrar día sin gastos (+1 día)'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Link to Full Challenges Screen */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-900 text-[11px]">
              <span className="text-slate-500">¿Querés más retos?</span>
              <Link
                href="/retos"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                <span>Ver Sala de Trofeos</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

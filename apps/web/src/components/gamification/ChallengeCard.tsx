'use client';

import React, { useState } from 'react';
import {
  Shield,
  Trophy,
  Medal,
  Crown,
  Flame,
  Zap,
  Target,
  Award,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';
import { Challenge } from '@/utils/api/gamification';

interface ChallengeCardProps {
  challenge: Challenge;
  onCheckIn?: (challengeId: string) => Promise<void>;
  onDelete?: (challengeId: string) => Promise<void>;
}

const BADGE_ICONS: Record<string, LucideIcon> = {
  Shield,
  Trophy,
  Medal,
  Crown,
  Flame,
  Zap,
  Target,
  Award,
};

export function ChallengeCard({
  challenge,
  onCheckIn,
  onDelete,
}: ChallengeCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const IconComponent = BADGE_ICONS[challenge.badgeIcon] || Award;
  const isCompleted = challenge.status === 'COMPLETED';
  const isActive = challenge.status === 'ACTIVE';

  const progressPercent = Math.min(
    100,
    Math.round((challenge.currentStreak / challenge.targetDays) * 100)
  );

  const handleCheckIn = async () => {
    if (!onCheckIn || isSubmitting || isCompleted) return;
    setIsSubmitting(true);
    try {
      await onCheckIn(challenge.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(challenge.id);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl border p-5 backdrop-blur-md transition-all shadow-md ${
        isCompleted
          ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-slate-950 shadow-emerald-950/30'
          : isActive
          ? 'border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 hover:border-slate-700 hover:shadow-xl'
          : 'border-slate-800/60 bg-slate-950/60 opacity-80'
      }`}
    >
      {/* Top Bar: Icon, Title, Status & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Medalla / Trofeo Icon */}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg transition-transform group-hover:scale-105 shrink-0 ${
                isCompleted
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
              }`}
            >
              <IconComponent className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                  {challenge.title}
                </h3>
              </div>

              {/* Reward Badge Name */}
              <p className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1 mt-0.5">
                <Sparkles className="h-3 w-3" />
                <span>Recompensa: {challenge.badgeName}</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 shadow-sm">
                <CheckCircle2 className="h-3 w-3" />
                ¡Completado!
              </span>
            ) : isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm">
                <Flame className="h-3 w-3 text-amber-400 animate-pulse" />
                En curso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                <AlertCircle className="h-3 w-3" />
                Fallido
              </span>
            )}

            {/* Delete button */}
            {onDelete && (
              <div className="relative">
                {showConfirmDelete ? (
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white rounded transition cursor-pointer"
                    >
                      {isDeleting ? '...' : 'Sí'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Eliminar este reto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {challenge.description && (
          <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">
            {challenge.description}
          </p>
        )}
      </div>

      {/* Duolingo-style Progress Section */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <span>Progreso del reto</span>
            {challenge.bestStreak > challenge.currentStreak && (
              <span className="text-[10px] font-normal text-slate-500">
                (Récord: {challenge.bestStreak}d)
              </span>
            )}
          </span>
          <span
            className={
              isCompleted
                ? 'text-emerald-400 font-extrabold'
                : 'text-amber-400 font-extrabold'
            }
          >
            {challenge.currentStreak} / {challenge.targetDays} días ({progressPercent}%)
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/50'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 shadow-amber-500/40'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Bottom Footer: Dates & Check-In Action Button */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            {isCompleted
              ? `Completado el ${formatDate(challenge.completedAt)}`
              : `Iniciado el ${formatDate(challenge.startDate)}`}
          </span>
        </div>

        {isActive && onCheckIn && (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer hover:shadow-emerald-900/30"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Registrando...' : 'Registrar día sin gastos (+1)'}</span>
          </button>
        )}

        {isCompleted && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Trophy className="h-4 w-4" />
            <span>¡Medalla desbloqueada!</span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Flame,
  Plus,
  ArrowLeft,
  DollarSign,
  Users,
  Target,
  Repeat,
  TrendingUp,
  Layers,
  BarChart3,
  Bot,
  User as UserNavIcon,
  Sparkles,
  Calendar,
  PartyPopper,
  Tag,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { CreateChallengeModal } from '@/components/gamification/CreateChallengeModal';
import { ConfettiReward } from '@/components/gamification/ConfettiReward';
import { EventsSummaryModal } from '@/components/tags/EventsSummaryModal';
import { TagBadge } from '@/components/tags/TagBadge';
import {
  getGamificationOverview,
  getTagsSummary,
  checkInStreak,
  deleteChallenge,
  GamificationOverview,
  TagSummary,
} from '@/utils/api/gamification';
import { getExpenses, ExpenseItem } from '@/utils/api/expenses';
import { formatCurrency } from '@/utils/api/rates';

export default function RetosPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<GamificationOverview | null>(null);
  const [tagsSummary, setTagsSummary] = useState<TagSummary[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active section tab: 'challenges' | 'trophies' | 'events'
  const [activeTab, setActiveTab] = useState<'challenges' | 'trophies' | 'events'>('challenges');

  // Modals & Celebrations
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEventTag, setSelectedEventTag] = useState<string | null>(null);
  const [isEventsSummaryOpen, setIsEventsSummaryOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  };

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [gamificationData, tagsData, expensesData] = await Promise.all([
        getGamificationOverview(),
        getTagsSummary(),
        getExpenses().catch(() => []),
      ]);
      setOverview(gamificationData);
      setTagsSummary(tagsData);
      setExpenses(expensesData);
    } catch (err: unknown) {
      console.error('Error loading gamification data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getGamificationOverview(),
      getTagsSummary(),
      getExpenses().catch(() => []),
    ])
      .then(([gamificationData, tagsData, expensesData]) => {
        if (!isMounted) return;
        setOverview(gamificationData);
        setTagsSummary(tagsData);
        setExpenses(expensesData);
      })
      .catch((err: unknown) => {
        console.error('Error loading gamification data:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Check-in diario general o para un reto
  const handleCheckIn = async (challengeId?: string) => {
    try {
      const res = await checkInStreak(challengeId);
      if (res.completedChallenge || res.newBadge) {
        setShowConfetti(true);
        showToast(
          'success',
          res.completedChallenge
            ? `¡Felicidades! Completaste el reto: "${res.completedChallenge.title}" 🏆`
            : `¡Nueva medalla desbloqueada! 🎉`
        );
      } else {
        showToast('success', `¡Día sin gastos registrado! Racha: ${res.savingStreak} días 🔥`);
      }
      await loadData();
    } catch {
      showToast('info', 'Progreso guardado offline en este dispositivo.');
    }
  };

  // Eliminación de un reto
  const handleDeleteChallenge = async (challengeId: string) => {
    try {
      await deleteChallenge(challengeId);
      showToast('info', 'Reto cancelado.');
      await loadData();
    } catch {
      // Silencioso
    }
  };

  const handleOpenEventModal = (tag: string) => {
    setSelectedEventTag(tag);
    setIsEventsSummaryOpen(true);
  };

  const savingStreak = overview?.savingStreak || 0;
  const activeChallenges = overview?.activeChallenges || [];
  const completedChallenges = overview?.completedChallenges || [];
  const badgesEarned = overview?.badgesEarned || [];

  // Títulos o trofeos bloqueados para motivar al usuario
  const LOCKED_TROPHIES = [
    { title: 'Monje Zen', desc: 'Racha de 30 días sin romper presupuestos', icon: '🧘‍♂️' },
    { title: 'Inversor Sabio', desc: 'Primer activo cargado en Modo Inversiones', icon: '💎' },
    { title: 'Caza-Oportunidades', desc: '10 compras analizadas con el Asistente AI', icon: '🤖' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <ConfettiReward active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="mx-auto max-w-6xl space-y-8">
        {/* Navigation & Header */}
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                title="Volver al Inicio"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 shadow-md shadow-amber-950/40">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl flex items-center gap-2">
                  <span>Retos & Gamificación</span>
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Modo Ahorro Extremo
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Rachas diarias de ahorro, desafíos estilo Duolingo y consolidación de eventos (#Hashtags)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <VaultSelector />
            <StreakBadge initialStreak={savingStreak} />

            <Link
              href="/gastos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Gastos
            </Link>
            <Link
              href="/bovedas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              Bóvedas
            </Link>
            <Link
              href="/inversiones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Inversiones
            </Link>
            <Link
              href="/presupuestos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Presupuestos
            </Link>
            <Link
              href="/suscripciones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Repeat className="h-3.5 w-3.5 text-emerald-400" />
              Suscripciones
            </Link>
            <Link
              href="/retos"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold text-amber-400 shadow-sm"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Retos
            </Link>
            <Link
              href="/categorias"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Categorías
            </Link>
            <Link
              href="/analiticas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              Analíticas
            </Link>
            <Link
              href="/asistente"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer shadow-sm"
            >
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              Asistente
            </Link>
            <Link
              href="/perfil"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <UserNavIcon className="h-3.5 w-3.5 text-emerald-400" />
              Perfil
            </Link>
            <UserStatus />
          </div>
        </header>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{toastMessage.text}</span>
            </div>
          </div>
        )}

        {isLoading && !overview ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-48 rounded-3xl border border-slate-800 bg-slate-900/40 p-8" />
            <div className="h-10 w-72 rounded-xl bg-slate-800/60" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-44 rounded-3xl border border-slate-800 bg-slate-900/40" />
              <div className="h-44 rounded-3xl border border-slate-800 bg-slate-900/40" />
            </div>
          </div>
        ) : (
          <>
            {/* Hero Banner: Racha Principal & Medidor de Consistencia Financiera */}
            <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-amber-950/20">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300">
                    <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
                    <span>Racha Activa de Ahorro</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                🔥 {savingStreak} {savingStreak === 1 ? 'Día Consecutivo' : 'Días Consecutivos'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {savingStreak >= 14
                  ? '¡Disciplina de acero! Cada día que evitás gastos innecesarios acerca tus metas patrimoniales.'
                  : 'Registrá tus días sin gastos impulsivos para blindar tu dinero y desbloquear medallas exclusivas.'}
              </p>

              {/* Medidor de consistencia */}
              <div className="pt-2 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Nivel de Consistencia Financiera</span>
                  <span className="text-amber-400 font-bold">{Math.min(100, savingStreak * 10)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(10, savingStreak * 10))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions & KPIs */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => handleCheckIn()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-amber-950/50 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Registrar Día sin Gastos</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 text-emerald-400" />
                <span>+ Nuevo Reto de Ahorro</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tab Navigation: Retos Activos | Medallas / Trofeos | Eventos (#Hashtags) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('challenges')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'challenges'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Retos Activos ({activeChallenges.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trophies')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'trophies'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Sala de Trofeos ({badgesEarned.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shadow-sm'
                  : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <PartyPopper className="h-4 w-4 text-indigo-400" />
              <span>Eventos & Hashtags ({tagsSummary.length})</span>
            </button>
          </div>

          {activeTab === 'challenges' && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Crear Reto</span>
            </button>
          )}

          {activeTab === 'events' && (
            <button
              type="button"
              onClick={() => {
                if (tagsSummary.length > 0) {
                  setSelectedEventTag(tagsSummary[0].tag);
                }
                setIsEventsSummaryOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-950/40 transition cursor-pointer"
            >
              <PartyPopper className="h-3.5 w-3.5" />
              <span>Ver Balance Consolidado</span>
            </button>
          )}
        </div>

        {/* Tab 1 Content: Retos Activos y Completados */}
        {activeTab === 'challenges' && (
          <div className="space-y-8">
            {/* Retos Activos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-400" />
                  <span>En Curso</span>
                </h3>
              </div>

              {activeChallenges.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                  <h4 className="text-base font-bold text-white">No tenés retos activos actualmente</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Sumate a un desafío como &quot;14 días sin delivery&quot; o creá uno personalizado para poner a prueba tu disciplina.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Elegir un Reto</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onCheckIn={handleCheckIn}
                      onDelete={handleDeleteChallenge}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Retos Completados */}
            {completedChallenges.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Retos Conquistados ({completedChallenges.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onDelete={handleDeleteChallenge}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Content: Sala de Trofeos / Medallas */}
        {activeTab === 'trophies' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-400" />
                    <span>Tus Medallas Desbloqueadas</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Logros alcanzados al cumplir retos de consistencia y ahorro
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                  {badgesEarned.length} Medallas
                </span>
              </div>

              {badgesEarned.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 text-center">
                  <Award className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                  <h4 className="text-base font-bold text-white">Todavía no has desbloqueado medallas</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Completá tus retos activos para llenar tu vitrina con trofeos dorados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badgesEarned.map((badge) => (
                    <div
                      key={badge.id}
                      className="group relative flex items-center gap-4 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/80 to-slate-950 p-4 shadow-lg hover:border-amber-500/60 transition"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                        🏆
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white tracking-tight truncate">
                          {badge.badgeName}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5" title={badge.challengeTitle}>
                          {badge.challengeTitle}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300/80 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(badge.unlockedAt))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vitrina de Próximos Logros Bloqueados */}
            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-slate-500" />
                <span>Próximos Trofeos por Desbloquear</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {LOCKED_TROPHIES.map((locked) => (
                  <div
                    key={locked.title}
                    className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 opacity-75"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xl grayscale shrink-0">
                      {locked.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-300">{locked.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{locked.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 Content: Eventos y Hashtags (#Eventos) */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PartyPopper className="h-4 w-4 text-indigo-400" />
                  <span>Eventos, Festejos y Viajes (#Eventos)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizá el costo acumulado de cada hashtag agrupador en tus movimientos
                </p>
              </div>

              <Link
                href="/gastos"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                <span>Ir al Historial de Gastos</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {tagsSummary.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 text-center">
                <Tag className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-white">No hay hashtags o eventos registrados</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Al registrar un gasto, escribí un hashtag como <code>#ViajeBariloche</code> o <code>#CenaFinDeAno</code> para agruparlo automáticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tagsSummary.map((item) => (
                  <div
                    key={item.tag}
                    onClick={() => handleOpenEventModal(item.tag)}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all cursor-pointer shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <TagBadge tag={item.tag} size="md" />
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                          {item.count} gastos
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Costo Consolidado
                        </span>
                        <p className="text-xl font-black text-emerald-400 mt-0.5">
                          {formatCurrency(item.totalAmount, 'ARS')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Ver detalle</span>
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Modales */}
      <CreateChallengeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onChallengeCreated={(newCh) => {
          showToast('success', `Reto "${newCh.title}" activado con éxito!`);
          loadData();
        }}
      />

      <EventsSummaryModal
        isOpen={isEventsSummaryOpen}
        onClose={() => setIsEventsSummaryOpen(false)}
        selectedTag={selectedEventTag}
        tagsSummary={tagsSummary}
        expenses={expenses}
        onSelectTag={(tag) => {
          // Si el usuario da clic en filtrar en movimientos
          router.push(`/gastos?tag=${encodeURIComponent(tag)}`);
        }}
      />
    </main>
  );
}

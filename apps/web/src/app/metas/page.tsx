'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Wallet,
  DollarSign,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Trophy,
  Loader2,
  Trash2,
} from 'lucide-react';
import { GoalCard } from '@/components/goals/GoalCard';
import { NewGoalModal } from '@/components/goals/NewGoalModal';
import { ConfettiReward } from '@/components/gamification/ConfettiReward';
import {
  Goal,
  getGoals,
  deleteGoal,
  calculateGoalMetrics,
} from '@/utils/api/goals';
import { formatCurrency, FALLBACK_RATES } from '@/utils/api/rates';
import { useVaultStore } from '@/stores/useVaultStore';

export default function MetasPage() {
  const { activeVault, activeVaultId } = useVaultStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confetti and Feedback
  const [showConfetti, setShowConfetti] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      console.error('Error al cargar metas de ahorro:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to cross-component goals updates
    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Goal[]>;
      if (customEvent.detail) {
        setGoals(customEvent.detail);
      } else {
        loadData();
      }
    };

    window.addEventListener('goals_updated', handleUpdated);
    return () => {
      window.removeEventListener('goals_updated', handleUpdated);
    };
  }, [loadData]);

  // Handle Goal Creation or Update
  const handleGoalSaved = (savedGoal: Goal) => {
    const isEdit = Boolean(goalToEdit);
    setGoalToEdit(null);
    showToast(
      'success',
      isEdit
        ? `Meta "${savedGoal.name}" actualizada con éxito.`
        : `¡Meta "${savedGoal.name}" creada exitosamente! 🎯`,
    );
    loadData();
  };

  // Handle Goal Deletion
  const confirmDelete = async () => {
    if (!goalToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGoal(goalToDelete.id);
      showToast('info', `Meta "${goalToDelete.name}" eliminada.`);
      setGoalToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Error al eliminar meta:', err);
      showToast('info', 'No se pudo eliminar la meta.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle successful deposit
  const handleDepositSuccess = (updatedGoal: Goal, amount: number) => {
    const metrics = calculateGoalMetrics(updatedGoal);
    if (metrics.isCompleted) {
      setShowConfetti(true);
      showToast(
        'success',
        `¡Felicidades! Completaste la meta "${updatedGoal.name}" 🏆🎉`,
      );
    } else {
      showToast(
        'success',
        `Aporte de ${formatCurrency(amount, updatedGoal.currency)} registrado en "${updatedGoal.name}" y debitado de gastos.`,
      );
    }
    loadData();
  };

  // Scoped Goals by active vault
  const scopedGoals = useMemo(() => {
    if (activeVaultId) {
      return goals.filter((g) => g.vaultId === activeVaultId);
    }
    return goals.filter((g) => !g.vaultId);
  }, [goals, activeVaultId]);

  // Calculations for KPIs
  const kpis = useMemo(() => {
    const usdRate = FALLBACK_RATES['USD'] || 1180;

    let totalSavedArs = 0;
    let totalSavedUsd = 0;
    let totalTargetArs = 0;
    let totalTargetUsd = 0;
    let activeCount = 0;
    let completedCount = 0;

    for (const g of scopedGoals) {
      if (g.currency === 'USD') {
        totalSavedUsd += g.currentAmount;
        totalTargetUsd += g.targetAmount;
      } else {
        totalSavedArs += g.currentAmount;
        totalTargetArs += g.targetAmount;
      }

      if (g.currentAmount >= g.targetAmount) {
        completedCount++;
      } else {
        activeCount++;
      }
    }

    const consolidatedSavedArs = totalSavedArs + totalSavedUsd * usdRate;
    const consolidatedTargetArs = totalTargetArs + totalTargetUsd * usdRate;
    const globalProgress =
      consolidatedTargetArs > 0
        ? Math.min(100, Math.round((consolidatedSavedArs / consolidatedTargetArs) * 1000) / 10)
        : 0;

    return {
      totalSavedArs,
      totalSavedUsd,
      consolidatedSavedArs,
      totalTargetArs,
      totalTargetUsd,
      consolidatedTargetArs,
      globalProgress,
      activeCount,
      completedCount,
      totalGoals: scopedGoals.length,
    };
  }, [scopedGoals]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return scopedGoals.filter((g) => {
      // Filter by tab
      if (filterTab === 'ACTIVE' && g.currentAmount >= g.targetAmount) return false;
      if (filterTab === 'COMPLETED' && g.currentAmount < g.targetAmount) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          g.name.toLowerCase().includes(query) ||
          g.currency.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [scopedGoals, filterTab, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <ConfettiReward active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header & Navigation */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/40">
              <Award className="h-6 w-6 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Metas de Ahorro
                </h1>
                {activeVault ? (
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    Bóveda: {activeVault.name}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Personal Privado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {activeVault
                  ? `Metas compartidas exclusivas de la bóveda "${activeVault.name}".`
                  : 'Fijá objetivos financieros personales, realizá inyecciones rápidas y automatizá el registro de egresos.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setGoalToEdit(null);
                setIsNewModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-xl shadow-emerald-950/50 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Nueva Meta</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* KPIs Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Total Ahorrado */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Ahorrado
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(kpis.consolidatedSavedArs, 'ARS')}
              </p>
              {kpis.totalSavedUsd > 0 && (
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Incluye {formatCurrency(kpis.totalSavedUsd, 'USD')} al tipo de cambio de referencia
                </p>
              )}
            </div>
          </div>

          {/* KPI 2: Objetivo Total */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Objetivo Total
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Target className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(kpis.consolidatedTargetArs, 'ARS')}
              </p>
              {kpis.totalTargetUsd > 0 && (
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Incluye {formatCurrency(kpis.totalTargetUsd, 'USD')} en metas en divisa
                </p>
              )}
            </div>
          </div>

          {/* KPI 3: Progreso Global % */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Progreso Global
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-white tracking-tight">
                  {kpis.globalProgress}%
                </p>
                <span className="text-[11px] font-semibold text-emerald-400">
                  {kpis.completedCount} de {kpis.totalGoals} cumplidas
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-700"
                  style={{ width: `${kpis.globalProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 4: Metas Activas */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Metas Activas
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-2xl font-black text-white tracking-tight">
                {kpis.activeCount} <span className="text-sm font-semibold text-slate-400">en curso</span>
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{kpis.completedCount} conquistadas con éxito</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'ALL'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              Todas ({goals.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'ACTIVE'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              En Curso ({kpis.activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('COMPLETED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'COMPLETED'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
              }`}
            >
              Cumplidas ({kpis.completedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar meta..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900/90 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* Goals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-3xl border border-slate-800 bg-slate-900/40 animate-pulse p-6"
              />
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white">
              {searchQuery ? 'No se encontraron metas con esa búsqueda' : 'No tenés metas de ahorro activas'}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Probá modificando el término de búsqueda o seleccionando otra pestaña.'
                : 'Fijá tu primer objetivo financiero (viaje, fondo de emergencia, tecnología) y empezá a ahorrar.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setGoalToEdit(null);
                  setIsNewModalOpen(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <Plus className="h-4 w-4" />
                <span>Crear mi Primera Meta</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onGoalUpdated={(updated) => {
                  setGoals((prev) =>
                    prev.map((g) => (g.id === updated.id ? updated : g)),
                  );
                }}
                onEdit={(target) => {
                  setGoalToEdit(target);
                  setIsNewModalOpen(true);
                }}
                onDelete={(target) => {
                  setGoalToDelete(target);
                }}
                onDepositSuccess={handleDepositSuccess}
              />
            ))}
          </div>
        )}
      </div>

      {/* New or Edit Goal Modal */}
      <NewGoalModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setGoalToEdit(null);
        }}
        onGoalCreated={handleGoalSaved}
        goalToEdit={goalToEdit}
        vaultId={activeVaultId}
      />

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Eliminar Meta</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseás eliminar la meta{' '}
              <strong className="text-white">"{goalToDelete.name}"</strong>?
              Los gastos asociados que ya fueron debitados permanecerán en tu historial financiero.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setGoalToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, Eliminar Meta</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

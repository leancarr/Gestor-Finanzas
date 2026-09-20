'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Repeat,
  Plus,
  ArrowLeft,
  Calendar,
  DollarSign,
  Layers,
  BarChart3,
  User as UserNavIcon,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Search,
  Sparkles,
  Target,
  Users,
  Bot,
} from 'lucide-react';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { UserStatus } from '@/components/auth/UserStatus';
import { RecurringCard } from '@/components/recurring/RecurringCard';
import { RecurringFormModal } from '@/components/recurring/RecurringFormModal';
import { RecurringDeleteModal } from '@/components/recurring/RecurringDeleteModal';
import {
  RecurringItem,
  getRecurring,
  processRecurring,
  processDueRecurring,
  updateRecurring,
} from '@/utils/api/recurring';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { formatCurrency, SupportedCurrency, FALLBACK_RATES } from '@/utils/api/rates';

export default function SuscripcionesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [recurringList, setRecurringList] = useState<RecurringItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [isProcessingDue, setIsProcessingDue] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recurringToDelete, setRecurringToDelete] = useState<RecurringItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Listen to Supabase Auth user
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setIsAuthLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cargar lista de suscripciones (incluyendo todas para poder pausar/activar)
  const fetchRecurringList = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getRecurring(true);
      setRecurringList(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar suscripciones.';
      showToast('error', msg);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getRecurring(true)
      .then((data) => {
        if (isMounted) {
          setRecurringList(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Error al cargar suscripciones.';
          showToast('error', msg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Cálculos de KPIs
  const now = useMemo(() => new Date(), []);

  const {
    monthlyCommittedARS,
    activeCount,
    autoDebitCount,
    nextDueItem,
    dueAutoDebitCount,
  } = useMemo(() => {
    const activeItems = recurringList.filter((item) => item.isActive);

    let totalARS = 0;
    for (const item of activeItems) {
      const amount =
        typeof item.amount === 'number'
          ? item.amount
          : parseFloat(String(item.amount)) || 0;

      let factor = 1;
      if (item.frequency === 'DAILY') factor = 30;
      else if (item.frequency === 'WEEKLY') factor = 4.33;
      else if (item.frequency === 'MONTHLY') factor = 1;
      else if (item.frequency === 'YEARLY') factor = 1 / 12;

      const curr = (item.currency || 'ARS').toUpperCase() as SupportedCurrency;
      const rate = curr !== 'ARS' ? FALLBACK_RATES[curr] || 1 : 1;
      totalARS += amount * factor * rate;
    }

    const autoDebits = activeItems.filter((item) => item.autoDebit);

    // Próximo vencimiento más cercano
    const sorted = [...activeItems].sort(
      (a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
    );
    const closest = sorted.length > 0 ? sorted[0] : null;

    // Cantidad vencidas con auto-débito
    const dueAuto = autoDebits.filter(
      (item) => new Date(item.nextDueDate).getTime() <= now.getTime(),
    );

    return {
      monthlyCommittedARS: totalARS,
      activeCount: activeItems.length,
      autoDebitCount: autoDebits.length,
      nextDueItem: closest,
      dueAutoDebitCount: dueAuto.length,
    };
  }, [recurringList, now]);

  // Filtrado de lista por búsqueda y estado
  const filteredList = useMemo(() => {
    return recurringList.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE') return item.isActive;
      if (statusFilter === 'PAUSED') return !item.isActive;
      return true;
    });
  }, [recurringList, search, statusFilter]);

  // Handlers para las tarjetas
  const handleProcessItem = async (item: RecurringItem) => {
    try {
      await processRecurring(item.id);
      showToast('success', `Gasto de "${item.name}" registrado correctamente.`);
      await fetchRecurringList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el pago.';
      showToast('error', msg);
    }
  };

  const handleToggleAutoDebit = async (item: RecurringItem) => {
    try {
      const updated = await updateRecurring(item.id, {
        autoDebit: !item.autoDebit,
      });
      setRecurringList((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      showToast(
        'success',
        `Débito automático ${updated.autoDebit ? 'activado' : 'desactivado'} para ${item.name}.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar auto-débito.';
      showToast('error', msg);
    }
  };

  const handleToggleActive = async (item: RecurringItem) => {
    try {
      const updated = await updateRecurring(item.id, {
        isActive: !item.isActive,
      });
      setRecurringList((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      showToast(
        'success',
        `Suscripción "${item.name}" ${updated.isActive ? 'activada' : 'pausada'}.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado.';
      showToast('error', msg);
    }
  };

  const handleProcessDueBatch = async () => {
    if (isProcessingDue) return;
    try {
      setIsProcessingDue(true);
      const res = await processDueRecurring();
      showToast('success', res.message);
      await fetchRecurringList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar débitos vencidos.';
      showToast('error', msg);
    } finally {
      setIsProcessingDue(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <Repeat className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Suscripciones y Gastos Recurrentes
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 ml-12 sm:ml-0">
              Control de servicios periódicos, débito automático y proyección de gastos comprometidos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <VaultSelector />
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
              href="/categorias"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Categorías
            </Link>
            <Link
              href="/presupuestos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Presupuestos
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

        {/* Toast Notifications */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-5 duration-300 ${
              toastMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300 shadow-emerald-950/50'
                : 'border-rose-500/30 bg-rose-950/90 text-rose-300 shadow-rose-950/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* UNAUTHENTICATED HERO BANNER                                               */}
        {/* ========================================================================= */}
        {!isAuthLoading && !user && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur">
            <h2 className="text-xl font-bold text-white">Inicia sesión para gestionar tus suscripciones</h2>
            <p className="mt-2 text-xs text-slate-400">
              Mantén el control de tus servicios recurrentes y automatiza tus gastos mensuales.
            </p>
            <Link
              href="/auth"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AUTHENTICATED DASHBOARD                                                   */}
        {/* ========================================================================= */}
        {user && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* 1. Total Mensual Comprometido */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400 font-medium">Total Mensual Comprometido</span>
                    <p className="text-xl font-black text-white tracking-tight truncate">
                      {formatCurrency(monthlyCommittedARS, 'ARS')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Proyección mensual equivalente en ARS</span>
                </div>
              </div>

              {/* 2. Suscripciones Activas */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20 shrink-0">
                    <Repeat className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400 font-medium">Suscripciones Activas</span>
                    <p className="text-xl font-black text-white tracking-tight truncate">
                      {activeCount} {activeCount === 1 ? 'servicio' : 'servicios'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>
                    {recurringList.length - activeCount} en pausa
                  </span>
                </div>
              </div>

              {/* 3. Débito Automático */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 shrink-0">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400 font-medium">Débito Automático</span>
                    <p className="text-xl font-black text-white tracking-tight truncate">
                      {autoDebitCount} {autoDebitCount === 1 ? 'activo' : 'activos'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Se registran en la fecha indicada</span>
                </div>
              </div>

              {/* 4. Próximo Vencimiento */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400 font-medium">Próximo Vencimiento</span>
                    <p className="text-sm font-bold text-white tracking-tight truncate">
                      {nextDueItem ? nextDueItem.name : 'Sin vencimientos'}
                    </p>
                    {nextDueItem && (
                      <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                        {new Intl.DateTimeFormat('es-AR', {
                          day: '2-digit',
                          month: 'short',
                        }).format(new Date(nextDueItem.nextDueDate))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{nextDueItem ? 'Próximo cobro agendado' : 'No hay pagos pendientes'}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar & Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar suscripción..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({recurringList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Activas ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PAUSED')}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'PAUSED'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pausadas ({recurringList.length - activeCount})
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Process Due Button (if any) */}
                {dueAutoDebitCount > 0 && (
                  <button
                    type="button"
                    onClick={handleProcessDueBatch}
                    disabled={isProcessingDue}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-300 shadow-md transition cursor-pointer disabled:opacity-50"
                    title="Cobrar automáticamente los débitos vencidos"
                  >
                    <Play className="h-3.5 w-3.5 fill-amber-400" />
                    <span>Cobrar Vencidas ({dueAutoDebitCount})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setRecurringToEdit(null);
                    setIsFormModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Suscripción</span>
                </button>
              </div>
            </div>

            {/* Subscriptions Grid */}
            {isDataLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredList.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredList.map((item) => (
                  <RecurringCard
                    key={item.id}
                    recurring={item}
                    onProcess={handleProcessItem}
                    onToggleAutoDebit={handleToggleAutoDebit}
                    onToggleActive={handleToggleActive}
                    onEdit={(r) => {
                      setRecurringToEdit(r);
                      setIsFormModalOpen(true);
                    }}
                    onDelete={(r) => {
                      setRecurringToDelete(r);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center backdrop-blur">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md">
                  <Repeat className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  {search || statusFilter !== 'ALL'
                    ? 'No se encontraron suscripciones con ese filtro'
                    : 'Aún no tienes suscripciones registradas'}
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  Agrega servicios como Netflix, Spotify, Internet o el Gimnasio para tener claridad de tus pagos fijos.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRecurringToEdit(null);
                    setIsFormModalOpen(true);
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar mi primera suscripción</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal de Creación / Edición */}
        <RecurringFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setRecurringToEdit(null);
          }}
          recurringToEdit={recurringToEdit}
          onSuccess={(savedItem) => {
            showToast(
              'success',
              recurringToEdit
                ? `Suscripción "${savedItem.name}" actualizada.`
                : `Suscripción "${savedItem.name}" creada con éxito.`,
            );
            fetchRecurringList();
          }}
        />

        {/* Modal de Eliminación */}
        <RecurringDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setRecurringToDelete(null);
          }}
          recurring={recurringToDelete}
          onSuccess={(deletedId) => {
            showToast('success', 'Suscripción eliminada con éxito.');
            setRecurringList((prev) => prev.filter((r) => r.id !== deletedId));
          }}
        />
      </div>
    </main>
  );
}

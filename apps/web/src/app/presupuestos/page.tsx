'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Loader2,
  Layers,
  PiggyBank,
  Wallet,
  Receipt,
  RotateCcw,
  BarChart3,
  Repeat,
  AlertCircle,
  User as UserNavIcon,
  Users,
} from 'lucide-react';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { UserStatus } from '@/components/auth/UserStatus';
import { BudgetCard, formatMoney } from '@/components/budgets/BudgetCard';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import {
  BudgetItem,
  getBudgets,
  deleteBudget,
} from '@/utils/api/budgets';
import { getCategories, CategoryItem } from '@/utils/api/categories';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function PresupuestosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Month navigation state
  const currentDate = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  // Data state
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetItem | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const supabase = useMemo(() => createClient(), []);

  // Listen to Supabase Auth state
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

  // Load budgets and categories
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    setError(null);

    try {
      const [fetchedBudgets, fetchedCategories] = await Promise.all([
        getBudgets({ month: selectedMonth, year: selectedYear }),
        getCategories(),
      ]);
      setBudgets(fetchedBudgets);
      setCategories(fetchedCategories);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al cargar presupuestos del período';
      setError(msg);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    Promise.all([
      getBudgets({ month: selectedMonth, year: selectedYear }),
      getCategories(),
    ])
      .then(([fetchedBudgets, fetchedCategories]) => {
        if (isMounted) {
          setBudgets(fetchedBudgets);
          setCategories(fetchedCategories);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Error al cargar presupuestos del período';
          setError(msg);
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
  }, [user, selectedMonth, selectedYear]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
  };

  const isCurrentMonthSelected =
    selectedMonth === currentDate.getMonth() + 1 &&
    selectedYear === currentDate.getFullYear();

  // Modal handlers
  const handleOpenCreate = () => {
    setBudgetToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget: BudgetItem) => {
    setBudgetToEdit(budget);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (savedBudget: BudgetItem) => {
    setBudgets((prev) => {
      const exists = prev.some((b) => b.id === savedBudget.id);
      if (exists) {
        return prev.map((b) => (b.id === savedBudget.id ? savedBudget : b));
      }
      return [savedBudget, ...prev];
    });
    showToast(
      'success',
      budgetToEdit
        ? 'Presupuesto actualizado correctamente.'
        : 'Presupuesto fijado exitosamente.',
    );
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;
    try {
      setIsDeleting(true);
      await deleteBudget(budgetToDelete.id);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetToDelete.id));
      showToast('success', 'Presupuesto eliminado con éxito.');
      setBudgetToDelete(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al eliminar presupuesto.';
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Resumen / KPIs de Presupuestos
  const { totalBudgeted, totalSpent, totalRemaining, globalPercentage, globalStatus } =
    useMemo(() => {
      const totalB = budgets.reduce((acc, b) => acc + b.amount, 0);
      const totalS = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
      const diff = totalB - totalS;
      const pct = totalB > 0 ? Math.round((totalS / totalB) * 1000) / 10 : 0;

      let status: 'OK' | 'WARNING' | 'EXCEEDED' = 'OK';
      if (pct > 100) {
        status = 'EXCEEDED';
      } else if (pct >= 80) {
        status = 'WARNING';
      }

      return {
        totalBudgeted: totalB,
        totalSpent: totalS,
        totalRemaining: diff,
        globalPercentage: pct,
        globalStatus: status,
      };
    }, [budgets]);

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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Presupuestos y Metas
                </h1>
                <p className="text-xs text-slate-400">
                  Control de límites mensuales por categoría y alertas de desvío
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
              href="/suscripciones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Repeat className="h-3.5 w-3.5 text-emerald-400" />
              Suscripciones
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
              href="/perfil"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <UserNavIcon className="h-3.5 w-3.5 text-emerald-400" />
              Perfil
            </Link>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Fijar Presupuesto
            </button>
            <UserStatus />
          </div>
        </header>

        {/* Toast Feedback */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-bottom-5 ${
              toastMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
                : 'border-rose-500/30 bg-rose-950/90 text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Non-authenticated state */}
        {!isAuthLoading && !user && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center backdrop-blur-sm">
            <Target className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-bold text-white">
              Inicia sesión para gestionar tus metas
            </h3>
            <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
              Define topes por rubro, recibe alertas antes de excederte y mantén
              tus finanzas personales bajo estricto control.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/auth"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
              >
                Ingresar a mi cuenta
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated View */}
        {user && (
          <div className="space-y-6">
            {/* Controles de Navegación por Período Mensual */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400 hover:border-slate-700 hover:text-white transition cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-sm font-bold text-white">
                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </span>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400 hover:border-slate-700 hover:text-white transition cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {!isCurrentMonthSelected && (
                  <button
                    onClick={handleCurrentMonth}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-slate-800 transition cursor-pointer ml-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Mes actual
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchData()}
                  disabled={isDataLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                  title="Actualizar datos"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isDataLoading ? 'animate-spin text-emerald-400' : ''}`}
                  />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>

            {/* Tarjetas de Resumen Global (KPIs) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Presupuestado */}
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Presupuestado
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-white">
                  {formatMoney(totalBudgeted)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {budgets.length} {budgets.length === 1 ? 'rubro monitoreado' : 'rubros monitoreados'}
                </p>
              </div>

              {/* Gastado Real */}
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Gastado Real
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                    <Receipt className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-white">
                  {formatMoney(totalSpent)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Consumos en categorías presupuestadas
                </p>
              </div>

              {/* Saldo Restante / Desvío */}
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {totalRemaining >= 0 ? 'Disponible Restante' : 'Exceso Total'}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      totalRemaining >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                    }`}
                  >
                    <PiggyBank className="h-4 w-4" />
                  </div>
                </div>
                <p
                  className={`mt-3 text-2xl font-extrabold ${
                    totalRemaining < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatMoney(Math.abs(totalRemaining))}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {totalRemaining >= 0
                    ? 'Margen antes de agotar presupuesto'
                    : 'Superado sobre el total asignado'}
                </p>
              </div>

              {/* Salud General */}
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Consumo Global
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      globalStatus === 'EXCEEDED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : globalStatus === 'WARNING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {globalStatus === 'EXCEEDED'
                      ? 'Desbordado'
                      : globalStatus === 'WARNING'
                      ? 'Límite Alto'
                      : 'Saludable'}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-white">
                    {globalPercentage}%
                  </p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-950/80 border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      globalStatus === 'EXCEEDED'
                        ? 'bg-rose-500'
                        : globalStatus === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(globalPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Lista / Grilla de Presupuestos */}
            {isDataLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-56 animate-pulse rounded-3xl border border-slate-800/50 bg-slate-900/30 p-5"
                  />
                ))}
              </div>
            ) : budgets.length === 0 ? (
              /* Estado Vacío */
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-12 text-center backdrop-blur-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-400 ring-1 ring-slate-700/50">
                  <Target className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  No hay presupuestos para {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  Fija un tope a tus categorías más frecuentes (ej: Supermercado, Salidas, Combustible) para mantener la disciplina en tus finanzas.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Fijar primer presupuesto
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    onEdit={handleOpenEdit}
                    onDelete={(b) => setBudgetToDelete(b)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar Presupuesto */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        budgetToEdit={budgetToEdit}
        categories={categories}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />

      {/* Modal de Confirmación de Eliminación */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setBudgetToDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              ¿Eliminar presupuesto?
            </h3>
            <p className="mt-2 text-xs text-slate-400">
              Se eliminará el tope establecido para la categoría{' '}
              <strong className="text-slate-200">
                {budgetToDelete.category?.name}
              </strong>
              . Los gastos registrados de esa categoría no se verán afectados.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-950/50 transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

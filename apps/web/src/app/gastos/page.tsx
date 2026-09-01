'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Plus,
  Search,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Receipt,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseDeleteModal } from '@/components/expenses/ExpenseDeleteModal';
import { getExpenses, ExpenseItem } from '@/utils/api/expenses';
import { getCategories, CategoryItem } from '@/utils/api/categories';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function GastosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const loading = isAuthLoading || (user ? isDataLoading : false);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

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

  // Load expenses and categories
  const loadData = useCallback(async () => {
    setIsDataLoading(true);
    setError(null);
    try {
      const [expensesData, categoriesData] = await Promise.all([
        getExpenses(),
        getCategories().catch(() => []),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los gastos. Verifica tu sesión y la conexión al backend.';
      setError(msg);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    Promise.all([getExpenses(), getCategories().catch(() => [])])
      .then(([expensesData, categoriesData]) => {
        if (isMounted) {
          setExpenses(expensesData);
          setCategories(categoriesData);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar los gastos. Verifica tu sesión y la conexión al backend.';
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
  }, [user]);

  // Auto-hide toast after 4s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleOpenDeleteModal = (exp: ExpenseItem) => {
    setExpenseToDelete(exp);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== deletedId));
    setToastMessage({
      type: 'success',
      text: 'Gasto eliminado con éxito.',
    });
  };

  // Filtered expenses by search and category
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        search.trim() === '' ||
        exp.description.toLowerCase().includes(search.toLowerCase().trim());
      const matchesCategory =
        !selectedCategoryFilter || exp.categoryId === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, selectedCategoryFilter]);

  // Statistics calculation
  const totalAmount = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      const num =
        typeof exp.amount === 'number'
          ? exp.amount
          : parseFloat(String(exp.amount)) || 0;
      return acc + num;
    }, 0);
  }, [expenses]);

  const averageAmount = useMemo(() => {
    if (expenses.length === 0) return 0;
    return totalAmount / expenses.length;
  }, [expenses, totalAmount]);

  const maxExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.max(
      ...expenses.map((e) =>
        typeof e.amount === 'number' ? e.amount : parseFloat(String(e.amount)) || 0,
      ),
    );
  }, [expenses]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Navigation & Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
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
                <DollarSign className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Mis Gastos
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 ml-12 sm:ml-0">
              Historial y registro de gastos personales en pesos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/categorias"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              Categorías
            </Link>
            <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-800 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ticket 2.2: SEI-22
            </div>
            <UserStatus />
          </div>
        </div>

        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div
            className={`mt-6 flex items-center justify-between rounded-2xl p-4 text-xs shadow-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
              toastMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {/* Not Logged In Banner */}
        {!isAuthLoading && !user && (
          <div className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <ShieldCheck className="h-4 w-4" />
                  AUTENTICACIÓN REQUERIDA (RLS)
                </div>
                <h2 className="text-lg font-bold text-white">
                  Inicia sesión para gestionar tus gastos
                </h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Cada usuario tiene sus propios gastos protegidos por Row Level Security en PostgreSQL.
                </p>
              </div>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-950/40 transition shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                Ir a Iniciar Sesión
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated Dashboard View */}
        {user && (
          <>
            {/* Stats Bar */}
            <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Total Gastado</span>
                  <p className="text-xl font-bold text-white tracking-tight">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              {/* Count Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Gastos Registrados</span>
                  <p className="text-xl font-bold text-white">{expenses.length}</p>
                </div>
              </div>

              {/* Average Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Gasto Promedio</span>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(averageAmount)}
                  </p>
                </div>
              </div>

              {/* Max Expense Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Mayor Gasto</span>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(maxExpense)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions & Filters */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
                {/* Search Box */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por descripción..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative w-full sm:max-w-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Filter className="h-3.5 w-3.5" />
                  </div>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900/60 pl-9 pr-8 py-2.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition cursor-pointer"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Action Button: Nuevo Gasto */}
              <div className="flex items-center gap-3">
                <Link
                  href="/gastos/nuevo"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Gasto
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  <button
                    onClick={loadData}
                    className="mt-2 text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Reintentar cargar gastos &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mt-8 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl border border-slate-800/60 bg-slate-900/30 p-4 animate-pulse flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-slate-800" />
                      <div className="space-y-2">
                        <div className="h-4 w-36 rounded bg-slate-800" />
                        <div className="h-3 w-24 rounded bg-slate-800/60" />
                      </div>
                    </div>
                    <div className="h-5 w-20 rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && expenses.length === 0 && (
              <div className="mt-12 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 mb-4">
                  <FolderOpen className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No tienes gastos registrados aún</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                  Comienza a controlar tus finanzas personales ingresando tus gastos en pesos de forma rápida.
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/gastos/nuevo"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Registrar Primer Gasto
                  </Link>
                </div>
              </div>
            )}

            {/* No Search / Filter Results */}
            {!loading && expenses.length > 0 && filteredExpenses.length === 0 && (
              <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/30 p-8 text-center">
                <p className="text-sm font-semibold text-slate-300">
                  No se encontraron gastos con los filtros aplicados
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategoryFilter('');
                  }}
                  className="mt-3 text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Expenses List */}
            {!loading && filteredExpenses.length > 0 && (
              <div className="mt-6 space-y-3">
                {filteredExpenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={handleOpenDeleteModal}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ExpenseDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        expense={expenseToDelete}
      />
    </main>
  );
}

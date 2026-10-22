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
  BarChart3,
  Repeat,
  Target,
  Users,
  ScanLine,
  Bot,
  TrendingUp,
  Award,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { useVaultStore } from '@/stores/useVaultStore';
import { UserStatus } from '@/components/auth/UserStatus';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseDeleteModal } from '@/components/expenses/ExpenseDeleteModal';
import { ReceiptScannerModal } from '@/components/ai/ReceiptScannerModal';
import { CsvImportModal } from '@/components/expenses/CsvImportModal';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { EventTagFilter } from '@/components/tags/EventTagFilter';
import { EventsSummaryModal } from '@/components/tags/EventsSummaryModal';
import { getTagsSummary, TagSummary } from '@/utils/api/gamification';
import ExportMenu from '@/components/dashboard/ExportMenu';
import { getExpenses, createExpense, ExpenseItem } from '@/utils/api/expenses';
import { getTrashItems, restoreTrashItem } from '@/utils/api/trash';
import { getCategories, CategoryItem } from '@/utils/api/categories';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { SupportedCurrency, FALLBACK_RATES } from '@/utils/api/rates';

export default function GastosPage() {
  const { activeVault, activeVaultId } = useVaultStore();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const loading = isAuthLoading || (user ? isDataLoading : false);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('ALL');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    undoAction?: () => void;
  } | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Tag & Event filters (SEI-41)
  const [tagsSummary, setTagsSummary] = useState<TagSummary[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('tag');
    }
    return null;
  });
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);

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

  // Reset member filter on activeVault change
  useEffect(() => {
    setSelectedMemberFilter('ALL');
  }, [activeVaultId]);

  // Load expenses and categories
  const loadData = useCallback(async () => {
    setIsDataLoading(true);
    setError(null);
    try {
      const [expensesData, categoriesData, tagsData] = await Promise.all([
        getExpenses({ vaultId: activeVaultId || undefined }),
        getCategories().catch(() => []),
        getTagsSummary().catch(() => []),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
      setTagsSummary(tagsData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las transacciones. Verifica tu sesión y la conexión al backend.';
      setError(msg);
    } finally {
      setIsDataLoading(false);
    }
  }, [activeVaultId]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setIsDataLoading(true);
    Promise.all([
      getExpenses({ vaultId: activeVaultId || undefined }),
      getCategories().catch(() => []),
      getTagsSummary().catch(() => []),
    ])
      .then(([expensesData, categoriesData, tagsData]) => {
        if (isMounted) {
          setExpenses(expensesData);
          setCategories(categoriesData);
          setTagsSummary(tagsData);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar las transacciones. Verifica tu sesión y la conexión al backend.';
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
  }, [user, activeVaultId]);

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

  const handleDeleteSuccess = (deletedExpense: ExpenseItem) => {
    setExpenses((prev) => prev.filter((e) => e.id !== deletedExpense.id));
    setToastMessage({
      type: 'success',
      text: `Movimiento "${deletedExpense.description}" enviado a la papelera.`,
      undoAction: async () => {
        try {
          const items = await getTrashItems();
          const match = items.find(
            (i) =>
              i.title === deletedExpense.description ||
              i.amount === Number(deletedExpense.amount),
          );
          if (match) {
            await restoreTrashItem(match.id);
          } else {
            await createExpense({
              description: deletedExpense.description,
              amount: Number(deletedExpense.amount),
              currency: deletedExpense.currency,
              type: deletedExpense.type,
              categoryId: deletedExpense.categoryId,
              vaultId: deletedExpense.vaultId,
              tags: deletedExpense.tags,
              date: deletedExpense.date,
            });
          }
          await loadData();
          setToastMessage({
            type: 'success',
            text: `Movimiento "${deletedExpense.description}" restaurado exitosamente.`,
          });
        } catch (err) {
          console.error('Error al deshacer eliminación:', err);
        }
      },
    });
  };

  // Filtered expenses by search, category, type and currency
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        search.trim() === '' ||
        exp.description.toLowerCase().includes(search.toLowerCase().trim());
      const matchesCategory =
        !selectedCategoryFilter || exp.categoryId === selectedCategoryFilter;
      const matchesType =
        selectedTypeFilter === 'ALL' || exp.type === selectedTypeFilter;
      const matchesCurrency =
        selectedCurrencyFilter === 'ALL' ||
        (exp.currency || 'ARS').toUpperCase() === selectedCurrencyFilter;

      let matchesTag = true;
      if (selectedTag) {
        const cleanFilter = selectedTag.toLowerCase().replace(/^#/, '');
        const hasTagInArray =
          exp.tags &&
          exp.tags.some((t) => t.toLowerCase().replace(/^#/, '') === cleanFilter);
        const hasTagInDesc = (exp.description || '')
          .toLowerCase()
          .includes(cleanFilter);
        matchesTag = Boolean(hasTagInArray || hasTagInDesc);
      }

      const matchesMember =
        selectedMemberFilter === 'ALL' ||
        exp.userId === selectedMemberFilter ||
        exp.user?.id === selectedMemberFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesCurrency &&
        matchesTag &&
        matchesMember
      );
    });
  }, [
    expenses,
    search,
    selectedCategoryFilter,
    selectedTypeFilter,
    selectedCurrencyFilter,
    selectedTag,
    selectedMemberFilter,
  ]);

  // Statistics calculations (consolidated in ARS)
  const totalExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.type !== 'INCOME')
      .reduce((acc, exp) => {
        const num =
          typeof exp.amount === 'number'
            ? exp.amount
            : parseFloat(String(exp.amount)) || 0;
        const curr = (exp.currency || 'ARS').toUpperCase() as SupportedCurrency;
        const rate = curr !== 'ARS'
          ? (Number(exp.exchangeRate) || FALLBACK_RATES[curr] || 1)
          : 1;
        return acc + (num * rate);
      }, 0);
  }, [expenses]);

  const totalIncome = useMemo(() => {
    return expenses
      .filter((e) => e.type === 'INCOME')
      .reduce((acc, exp) => {
        const num =
          typeof exp.amount === 'number'
            ? exp.amount
            : parseFloat(String(exp.amount)) || 0;
        const curr = (exp.currency || 'ARS').toUpperCase() as SupportedCurrency;
        const rate = curr !== 'ARS'
          ? (Number(exp.exchangeRate) || FALLBACK_RATES[curr] || 1)
          : 1;
        return acc + (num * rate);
      }, 0);
  }, [expenses]);

  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const isPositiveBalance = balance >= 0;

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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Movimientos
                </h1>
                {activeVault && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    🏛️ {activeVault.name}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400 ml-12 sm:ml-0">
              Historial y registro de ingresos y gastos multi-moneda (ARS, USD, EUR, USDT) con motor impositivo
            </p>
          </div>
        </div>

        {/* Banner Indicador de Bóveda Activa (SEI-47) */}
        {activeVault && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 backdrop-blur shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Mostrando movimientos de: {activeVault.name}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    Bóveda Compartida
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeVault.description || 'Movimientos y gastos compartidos de la organización.'}
                  {activeVault.members && activeVault.members.length > 0 && (
                    <span className="ml-1 text-slate-400 font-medium">
                      • {activeVault.members.length} {activeVault.members.length === 1 ? 'integrante' : 'integrantes'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/bovedas"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                Panel de Bóvedas &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div
            className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-xs shadow-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
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
            <div className="flex items-center gap-2">
              {toastMessage.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    const undo = toastMessage.undoAction;
                    setToastMessage(null);
                    undo?.();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs border border-emerald-500/30 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Deshacer
                </button>
              )}
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white cursor-pointer ml-1 text-base leading-none"
              >
                &times;
              </button>
            </div>
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
                  Inicia sesión para gestionar tus movimientos
                </h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Cada usuario tiene sus propios ingresos y gastos protegidos por Row Level Security en PostgreSQL.
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
              {/* Balance Card */}
              <div
                className={`rounded-2xl border p-5 backdrop-blur flex items-center gap-4 ${
                  isPositiveBalance
                    ? 'border-emerald-500/30 bg-slate-900/60'
                    : 'border-rose-500/30 bg-slate-900/60'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 shrink-0 ${
                    isPositiveBalance
                      ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                  }`}
                >
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 font-medium">Balance</span>
                  <p
                    className={`text-xl font-bold tracking-tight truncate ${
                      isPositiveBalance ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>

              {/* Total Income Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 font-medium">Total Ingresos</span>
                  <p className="text-xl font-bold text-white tracking-tight truncate">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
              </div>

              {/* Total Expenses Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 shrink-0">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 font-medium">Total Gastos</span>
                  <p className="text-xl font-bold text-white tracking-tight truncate">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
              </div>

              {/* Count Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 shrink-0">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Movimientos</span>
                  <p className="text-xl font-bold text-white">{expenses.length}</p>
                </div>
              </div>
            </div>

            {/* Event Tag Filter Bar (SEI-41) */}
            {tagsSummary.length > 0 && (
              <div className="mt-6">
                <EventTagFilter
                  tagsSummary={tagsSummary}
                  selectedTag={selectedTag}
                  onSelectTag={setSelectedTag}
                  onOpenEventsModal={() => setIsEventsModalOpen(true)}
                />
              </div>
            )}

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

                {/* Type Filter */}
                <div className="relative w-full sm:max-w-[150px]">
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) =>
                      setSelectedTypeFilter(
                        e.target.value as 'ALL' | 'EXPENSE' | 'INCOME',
                      )
                    }
                    className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900/60 pl-3.5 pr-8 py-2.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition cursor-pointer"
                  >
                    <option value="ALL">Todos los tipos</option>
                    <option value="EXPENSE">Solo Gastos</option>
                    <option value="INCOME">Solo Ingresos</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-xs">
                    ▼
                  </div>
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

                {/* Currency Filter */}
                <div className="relative w-full sm:max-w-[140px]">
                  <select
                    value={selectedCurrencyFilter}
                    onChange={(e) => setSelectedCurrencyFilter(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900/60 pl-3.5 pr-8 py-2.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition cursor-pointer"
                  >
                    <option value="ALL">Todas las divisas</option>
                    <option value="ARS">🇦🇷 ARS ($)</option>
                    <option value="USD">🇺🇸 USD (US$)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="USDT">🌐 USDT (₮)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-xs">
                    ▼
                  </div>
                </div>

                {/* Member Filter Contextual to Vault (SEI-47) */}
                {activeVault && (activeVault.members?.length ?? 0) > 0 && (
                  <div className="relative w-full sm:max-w-[170px]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <select
                      value={selectedMemberFilter}
                      onChange={(e) => setSelectedMemberFilter(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-emerald-500/30 bg-slate-900/60 pl-9 pr-8 py-2.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition cursor-pointer"
                    >
                      <option value="ALL">Todos los miembros</option>
                      {activeVault.members!.map((m) => {
                        const memberName =
                          m.user?.name || (m.user?.email ? m.user.email.split('@')[0] : m.userId);
                        return (
                          <option key={m.userId} value={m.userId} className="bg-slate-900 text-white">
                            👤 {memberName}
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 text-xs">
                      ▼
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button: Nueva Transacción, Escanear Ticket e Importar CSV */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 shadow-lg transition cursor-pointer"
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Escanear Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-teal-400 hover:text-teal-300 shadow-lg transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Importar CSV</span>
                </button>
                <ExportMenu data={filteredExpenses} />
                <Link
                  href="/gastos/nuevo"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Transacción
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
                    setSelectedTypeFilter('ALL');
                    setSelectedCurrencyFilter('ALL');
                    setSelectedTag(null);
                    setSelectedMemberFilter('ALL');
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
                    onTagClick={(tag) => setSelectedTag(tag)}
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

      {/* Receipt Scanner Modal (Vision AI) */}
      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={() => {
          loadData();
          setToastMessage({
            type: 'success',
            text: '¡Comprobante procesado y gasto registrado exitosamente!',
          });
        }}
      />

      {/* CSV Bank Import Modal (SEI-57) */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={(count) => {
          loadData();
          setToastMessage({
            type: 'success',
            text: `¡${count} movimientos importados exitosamente desde el archivo CSV!`,
          });
        }}
        categories={categories}
      />

      {/* Events / Hashtags Summary Modal (SEI-41) */}
      <EventsSummaryModal
        isOpen={isEventsModalOpen}
        onClose={() => setIsEventsModalOpen(false)}
        selectedTag={selectedTag}
        onSelectTag={(tag) => setSelectedTag(tag)}
        tagsSummary={tagsSummary}
        expenses={expenses}
      />
    </main>
  );
}

'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Layers,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  PieChart,
} from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { CategoryDeleteModal } from '@/components/categories/CategoryDeleteModal';
import {
  getCategories,
  seedDefaultCategories,
  CategoryItem,
} from '@/utils/api/categories';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function CategoriasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const loading = isAuthLoading || (user ? isDataLoading : false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

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

  // Load categories
  const loadCategories = useCallback(async () => {
    setIsDataLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las categorías. Verifica tu sesión y conexión al backend.';
      setError(msg);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getCategories()
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar las categorías. Verifica tu sesión y conexión al backend.';
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

  const handleOpenCreateModal = () => {
    setCategoryToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryItem) => {
    setCategoryToEdit(cat);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = (item: CategoryItem) => {
    if (categoryToEdit) {
      setCategories((prev) =>
        prev.map((c) => (c.id === item.id ? item : c)),
      );
      setToastMessage({
        type: 'success',
        text: `Categoría "${item.name}" actualizada con éxito.`,
      });
    } else {
      setCategories((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
      setToastMessage({
        type: 'success',
        text: `Categoría "${item.name}" creada con éxito.`,
      });
    }
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== deletedId));
    setToastMessage({
      type: 'success',
      text: 'Categoría eliminada con éxito.',
    });
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      const seeded = await seedDefaultCategories();
      setCategories(seeded);
      setToastMessage({
        type: 'success',
        text: 'Categorías por defecto cargadas correctamente.',
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al restaurar categorías por defecto';
      setError(msg);
    } finally {
      setIsSeeding(false);
    }
  };

  // Filtered categories by search
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalCategories = categories.length;
  const usedCategories = categories.filter(
    (c) => (c._count?.expenses || 0) > 0,
  ).length;
  const uniqueColors = new Set(categories.map((c) => c.color).filter(Boolean)).size;

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
                <Layers className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Gestión de Categorías
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 ml-12 sm:ml-0">
              Personaliza tus rubros con íconos y colores protegidos con Row Level Security
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-800 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ticket 2.1: SEI-21
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
                  Inicia sesión para gestionar tus categorías
                </h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Cada usuario tiene su propio catálogo de categorías aislado de forma segura en PostgreSQL mediante Row Level Security. Inicia sesión para crear o restaurar tus categorías por defecto.
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
            <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Total Categorías</span>
                  <p className="text-xl font-bold text-white">{totalCategories}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                  <PieChart className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">En Uso con Gastos</span>
                  <p className="text-xl font-bold text-white">{usedCategories}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Colores Activos</span>
                  <p className="text-xl font-bold text-white">{uniqueColors}</p>
                </div>
              </div>
            </div>

            {/* Actions & Search Bar */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar categoría por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSeedDefaults}
                  disabled={isSeeding || loading}
                  title="Restaura las categorías sugeridas estándar"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                  {isSeeding ? 'Restaurando...' : 'Cargar Sugeridas'}
                </button>

                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Categoría
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  <button
                    onClick={loadCategories}
                    className="mt-2 text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Reintentar cargar categorías &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-36 rounded-3xl border border-slate-800/60 bg-slate-900/30 p-5 animate-pulse flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-800" />
                      <div className="space-y-2">
                        <div className="h-4 w-28 rounded bg-slate-800" />
                        <div className="h-3 w-16 rounded bg-slate-800/60" />
                      </div>
                    </div>
                    <div className="h-3 w-20 rounded bg-slate-800/40" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && categories.length === 0 && (
              <div className="mt-12 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 mb-4">
                  <FolderOpen className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No tienes categorías aún</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                  Organiza tus gastos creando categorías personalizadas o carga el conjunto de categorías recomendadas para empezar de inmediato.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleSeedDefaults}
                    disabled={isSeeding}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Cargar Categorías Recomendadas
                  </button>
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Crear mi Primera Categoría
                  </button>
                </div>
              </div>
            )}

            {/* No Search Results */}
            {!loading && categories.length > 0 && filteredCategories.length === 0 && (
              <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/30 p-8 text-center">
                <p className="text-sm font-semibold text-slate-300">
                  No se encontraron categorías para &ldquo;{search}&rdquo;
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}

            {/* Categories Grid */}
            {!loading && filteredCategories.length > 0 && (
              <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenDeleteModal}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        categoryToEdit={categoryToEdit}
      />

      <CategoryDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        category={categoryToDelete}
      />
    </main>
  );
}

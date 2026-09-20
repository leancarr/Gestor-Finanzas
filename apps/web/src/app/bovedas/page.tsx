'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  ArrowLeft,
  DollarSign,
  Repeat,
  Target,
  Layers,
  BarChart3,
  User as UserNavIcon,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Heart,
  Home,
  RefreshCw,
  Bot,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { VaultCard } from '@/components/vaults/VaultCard';
import { CreateVaultModal } from '@/components/vaults/CreateVaultModal';
import { VaultMembersModal } from '@/components/vaults/VaultMembersModal';
import { VaultBalancesWidget } from '@/components/vaults/VaultBalancesWidget';
import {
  Vault,
  getVaults,
  deleteVault,
} from '@/utils/api/vaults';
import { useVaultStore } from '@/stores/useVaultStore';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type ActiveTab = 'vaults' | 'balances';

export default function BovedasPage() {
  const [user, setUser] = useState<User | null>(null);

  // Datos
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('vaults');
  const [selectedVaultForBalances, setSelectedVaultForBalances] = useState<Vault | null>(null);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [vaultToEdit, setVaultToEdit] = useState<Vault | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [vaultForMembers, setVaultForMembers] = useState<Vault | null>(null);

  const { activeVault, setActiveVault } = useVaultStore();

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Carga de bóvedas
  const loadVaults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVaults();
      setVaults(data);
      if (data.length > 0) {
        setSelectedVaultForBalances((prev) => prev || data[0]);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar las bóvedas compartidas.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getVaults()
      .then((data) => {
        if (isMounted) {
          setVaults(data);
          if (data.length > 0) {
            setSelectedVaultForBalances((prev) => prev || data[0]);
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Ocurrió un error al cargar las bóvedas compartidas.';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
  };

  // Handlers para acciones
  const handleOpenCreate = () => {
    setVaultToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (vault: Vault) => {
    setVaultToEdit(vault);
    setIsCreateModalOpen(true);
  };

  const handleOpenMembers = (vault: Vault) => {
    setVaultForMembers(vault);
    setIsMembersModalOpen(true);
  };

  const handleSelectBalances = (vault: Vault) => {
    setSelectedVaultForBalances(vault);
    setActiveTab('balances');
  };

  const handleDeleteVault = async (vault: Vault) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar la bóveda "${vault.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await deleteVault(vault.id);
      setVaults((prev) => prev.filter((v) => v.id !== vault.id));
      if (activeVault?.id === vault.id) {
        setActiveVault(null);
      }
      if (selectedVaultForBalances?.id === vault.id) {
        setSelectedVaultForBalances(vaults.find((v) => v.id !== vault.id) || null);
      }
      showToast('success', `Bóveda "${vault.name}" eliminada exitosamente.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al eliminar la bóveda.';
      showToast('error', msg);
    }
  };

  const handleVaultSuccess = (savedVault: Vault) => {
    setVaults((prev) => {
      const exists = prev.some((v) => v.id === savedVault.id);
      if (exists) {
        return prev.map((v) => (v.id === savedVault.id ? savedVault : v));
      }
      return [savedVault, ...prev];
    });

    if (!selectedVaultForBalances) {
      setSelectedVaultForBalances(savedVault);
    }

    showToast('success', `Bóveda "${savedVault.name}" guardada con éxito.`);
  };

  const handleMembersUpdate = (updatedVault: Vault) => {
    setVaults((prev) =>
      prev.map((v) => (v.id === updatedVault.id ? updatedVault : v)),
    );
    if (selectedVaultForBalances?.id === updatedVault.id) {
      setSelectedVaultForBalances(updatedVault);
    }
    if (vaultForMembers?.id === updatedVault.id) {
      setVaultForMembers(updatedVault);
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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl flex items-center gap-2">
                  <span>Bóvedas Compartidas</span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Modo Pareja / Familia
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Divide gastos en común, administra miembros y liquida saldos sin complicaciones
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Selector de Contexto Global */}
            <VaultSelector onOpenCreateModal={handleOpenCreate} />
            <StreakBadge />

            <Link
              href="/gastos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Gastos
            </Link>
            <Link
              href="/inversiones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Inversiones
            </Link>
            <Link
              href="/retos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Retos
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

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + Nueva Bóveda
            </button>
            <UserStatus />
          </div>
        </header>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadVaults}
              className="rounded-lg bg-rose-900/40 px-2.5 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-900/60 transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

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

        {/* Selector de Pestañas Principales */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-1.5 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setActiveTab('vaults')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'vaults'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Mis Bóvedas Compartidas</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === 'vaults'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {vaults.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('balances')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === 'balances'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="h-4 w-4" />
              <span>Saldos y Balances Compartidos</span>
            </button>
          </div>

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={loadVaults}
            disabled={isLoading}
            className="self-end sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Recargar bóvedas"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Contenido según Pestaña */}
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-xl">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="mt-3 text-xs font-semibold text-slate-400">
              Cargando bóvedas compartidas...
            </span>
          </div>
        ) : activeTab === 'vaults' ? (
          /* PESTAÑA: MIS BÓVEDAS */
          vaults.length === 0 ? (
            /* Empty state inspirador */
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center backdrop-blur-xl">
              {/* Glow ambiental */}
              <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="mx-auto max-w-lg space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-950/60 ring-1 ring-white/20">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Finanzas en pareja o familia sin discusiones
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Las Bóvedas Compartidas te permiten llevar un registro transparente de los gastos comunes (hogar, salidas, viajes) y calcular automáticamente quién le debe a quién para quedar a mano con un solo click.
                  </p>
                </div>

                {/* Tarjetas de Beneficios */}
                <div className="grid gap-3 sm:grid-cols-3 text-left">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div className="text-xs font-bold text-white">Modo Pareja</div>
                    <p className="text-[11px] text-slate-400">
                      Dividan el súper, servicios y salidas 50/50 o por cuota.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="text-xs font-bold text-white">Modo Hogar</div>
                    <p className="text-[11px] text-slate-400">
                      Presupuestos y gastos familiares con roles de visibilidad.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <Scale className="h-4 w-4" />
                    </div>
                    <div className="text-xs font-bold text-white">Compensaciones</div>
                    <p className="text-[11px] text-slate-400">
                      Algoritmo inteligente de saldos: menos transferencias.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-950/50 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear mi Primera Bóveda Compartida</span>
                </button>
              </div>
            </div>
          ) : (
            /* Grid de Bóvedas */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vaults.map((vault) => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  currentUserId={user?.id}
                  onSelectBalances={handleSelectBalances}
                  onManageMembers={handleOpenMembers}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteVault}
                />
              ))}
            </div>
          )
        ) : (
          /* PESTAÑA: SALDOS Y BALANCES COMPARTIDOS */
          <div className="space-y-6">
            {/* Selector de Bóveda para Balances */}
            {vaults.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
                <span className="text-xs font-semibold text-slate-400 mr-2">
                  Seleccionar Bóveda:
                </span>
                {vaults.map((v) => {
                  const isSelected = selectedVaultForBalances?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVaultForBalances(v)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedVaultForBalances ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{selectedVaultForBalances.name}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({selectedVaultForBalances.members?.length || 1} integrantes)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedVaultForBalances.description || 'Detalle de aportes y compensaciones'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenMembers(selectedVaultForBalances)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Ver Integrantes</span>
                  </button>
                </div>

                <VaultBalancesWidget
                  vault={selectedVaultForBalances}
                  onSettled={() => {
                    // Refrescar al liquidar
                  }}
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-xl">
                <Users className="mx-auto h-10 w-10 text-slate-500" />
                <h4 className="mt-3 text-sm font-bold text-white">
                  No hay ninguna bóveda seleccionada
                </h4>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  Crea o selecciona una bóveda compartida para calcular las compensaciones.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modales */}
        <CreateVaultModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleVaultSuccess}
          vaultToEdit={vaultToEdit}
        />

        <VaultMembersModal
          isOpen={isMembersModalOpen}
          vault={vaultForMembers}
          currentUserId={user?.id}
          onClose={() => setIsMembersModalOpen(false)}
          onUpdate={handleMembersUpdate}
        />
      </div>
    </main>
  );
}

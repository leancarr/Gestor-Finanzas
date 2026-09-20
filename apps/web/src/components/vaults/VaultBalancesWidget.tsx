'use client';

import React, { useState, useEffect } from 'react';
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  Users,
  Wallet,
  Coins,
  Loader2,
  PartyPopper,
  TrendingUp,
} from 'lucide-react';
import {
  Vault,
  VaultBalances,
  Settlement,
  getVaultBalances,
} from '@/utils/api/vaults';

interface VaultBalancesWidgetProps {
  vault: Vault;
  onSettled?: () => void;
}

export function VaultBalancesWidget({ vault, onSettled }: VaultBalancesWidgetProps) {
  const [balances, setBalances] = useState<VaultBalances | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settledList, setSettledList] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getVaultBalances(vault.id)
      .then((data) => {
        if (isMounted) {
          setBalances(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        // Silencioso
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vault.id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleMarkSettled = (settlement: Settlement, index: number) => {
    const key = `${settlement.fromUser.id}-${settlement.toUser.id}-${index}`;
    setSettledList((prev) => [...prev, key]);
    setToastMessage(
      `¡Liquidación de ${formatCurrency(settlement.amount)} entre ${settlement.fromUser.name} y ${settlement.toUser.name} registrada como saldada!`,
    );
    if (onSettled) onSettled();

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="mt-3 text-xs font-semibold text-slate-400">
          Calculando saldos y compensaciones de la bóveda...
        </span>
      </div>
    );
  }

  if (!balances || balances.memberContributions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-xl">
        <Users className="mx-auto h-10 w-10 text-slate-500" />
        <h4 className="mt-3 text-sm font-bold text-white">
          Aún no hay gastos registrados en esta bóveda
        </h4>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Los gastos compartidos que registren los miembros aparecerán aquí con el cálculo automático de aportes y compensaciones equitativas.
        </p>
      </div>
    );
  }

  const activeSettlements = balances.settlements.filter(
    (s, idx) => !settledList.includes(`${s.fromUser.id}-${s.toUser.id}-${idx}`),
  );

  return (
    <div className="space-y-6">
      {/* Toast flotante de liquidación */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/90 p-4 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards Superiores */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Gastos Compartidos */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Total Gastado en Grupo
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white">
              {formatCurrency(balances.totalExpenses)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Acumulado de todos los integrantes
            </p>
          </div>
        </div>

        {/* Cuota Equitativa por Miembro */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Cuota Justa (Fair Share)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-blue-400">
              {formatCurrency(balances.fairSharePerMember)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Por cada uno de los {balances.memberContributions.length} miembros
            </p>
          </div>
        </div>

        {/* Estado de Deudas Pendientes */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Compensaciones
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white">
              {activeSettlements.length === 0 ? (
                <span className="text-emerald-400">¡Al día!</span>
              ) : (
                <span>{activeSettlements.length} por saldar</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeSettlements.length === 0
                ? 'No hay saldos pendientes'
                : 'Transferencias para quedar en 0'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Aportes por Miembro (Izquierda) + Liquidaciones Pendientes (Derecha) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Aportes por Miembro con Barras de Progreso */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Aportes por Integrante</h4>
            </div>
            <span className="text-xs text-slate-400">
              Meta: {formatCurrency(balances.fairSharePerMember)} c/u
            </span>
          </div>

          <div className="space-y-4">
            {balances.memberContributions.map((member) => {
              const diff = member.totalPaid - balances.fairSharePerMember;
              const isAhead = diff >= 0;

              return (
                <div key={member.userId} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                        {member.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-white block leading-tight">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-white">
                        {formatCurrency(member.totalPaid)}
                      </span>
                      <div
                        className={`text-[10px] font-semibold ${
                          isAhead ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isAhead
                          ? `+${formatCurrency(diff)} a favor`
                          : `${formatCurrency(Math.abs(diff))} por aportar`}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progreso */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAhead ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(member.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{member.percentage}% del total pagado</span>
                    <span>
                      {isAhead ? 'Superó su cuota' : 'Pendiente de balance'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Liquidaciones y Deudas Claras */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                Compensaciones para Quedar a Mano
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Algoritmo de liquidación
            </span>
          </div>

          {activeSettlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PartyPopper className="h-7 w-7" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">
                  ¡Todos los saldos están al día! 🎉
                </h5>
                <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                  No hay deudas pendientes en esta bóveda. Cada integrante aportó de forma equitativa.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSettlements.map((settlement, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 transition-all hover:border-emerald-500/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Flujo Deudor -> Acreedor */}
                    <div className="flex items-center gap-3">
                      {/* Deudor */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Debe pagar
                        </span>
                        <div className="text-xs font-bold text-white">
                          {settlement.fromUser.name}
                        </div>
                      </div>

                      {/* Flecha con Badge de Monto */}
                      <div className="flex items-center gap-1.5 px-2">
                        <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0" />
                      </div>

                      {/* Acreedor */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Recibe
                        </span>
                        <div className="text-xs font-bold text-white">
                          {settlement.toUser.name}
                        </div>
                      </div>
                    </div>

                    {/* Monto & Botón Saldar */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-right">
                        <span className="text-base font-black text-amber-300">
                          {formatCurrency(settlement.amount)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMarkSettled(settlement, idx)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition cursor-pointer"
                        title="Marcar esta deuda como pagada"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Saldado</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VaultBalancesWidget;

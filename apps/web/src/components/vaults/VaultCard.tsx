'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  Crown,
  UserCheck,
  Eye,
  ArrowRight,
  UserPlus,
  Receipt,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Vault, VaultRole } from '@/utils/api/vaults';
import { useVaultStore } from '@/stores/useVaultStore';

interface VaultCardProps {
  vault: Vault;
  currentUserId?: string;
  onSelectBalances: (vault: Vault) => void;
  onManageMembers: (vault: Vault) => void;
  onEdit?: (vault: Vault) => void;
  onDelete?: (vault: Vault) => void;
}

export function VaultCard({
  vault,
  currentUserId,
  onSelectBalances,
  onManageMembers,
  onEdit,
  onDelete,
}: VaultCardProps) {
  const { activeVault, setActiveVault } = useVaultStore();
  const isActive = activeVault?.id === vault.id;

  // Determinar el rol del usuario en esta bóveda
  const userMembership = vault.members?.find((m) =>
    currentUserId ? m.userId === currentUserId : m.role === 'OWNER' || m.role === 'ADMIN',
  ) || vault.members?.[0];

  const role: VaultRole = userMembership?.role || 'MEMBER';

  const roleBadges: Record<
    VaultRole,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    OWNER: {
      label: 'Propietario',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: <Crown className="h-3 w-3" />,
    },
    ADMIN: {
      label: 'Administrador',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: <ShieldCheck className="h-3 w-3" />,
    },
    MEMBER: {
      label: 'Miembro',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <UserCheck className="h-3 w-3" />,
    },
    VIEWER: {
      label: 'Observador',
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      icon: <Eye className="h-3 w-3" />,
    },
  };

  const badgeConfig = roleBadges[role] || roleBadges.MEMBER;
  const members = vault.members || [];
  const expensesCount = vault._count?.expenses ?? 0;

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${
        isActive
          ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-gradient-to-b dark:from-emerald-950/30 dark:via-slate-900/90 dark:to-slate-950 ring-1 ring-emerald-500/30 shadow-emerald-950/20'
          : 'border-border bg-card hover:border-border hover:bg-surface/50'
      }`}
    >
      {/* Glow ambiental superior */}
      <div
        className={`pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full blur-3xl transition-opacity duration-500 ${
          isActive
            ? 'bg-emerald-500/20 opacity-100'
            : 'bg-emerald-500/10 opacity-0 group-hover:opacity-100'
        }`}
      />

      <div className="space-y-4">
        {/* Cabecera de la Tarjeta */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition ${
                isActive
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-950/60'
                  : 'border-border bg-surface text-muted-foreground group-hover:border-border group-hover:text-foreground'
              }`}
            >
              <Users className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className="font-bold text-foreground text-base tracking-tight truncate max-w-full"
                  title={vault.name}
                >
                  {vault.name}
                </h3>
                {isActive && (
                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Activa
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {vault.description || 'Sin descripción adicional'}
              </p>
            </div>
          </div>

          {/* Badge de Rol */}
          <div
            className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}
            title={`Tu rol en esta bóveda: ${badgeConfig.label}`}
          >
            {badgeConfig.icon}
            <span>{badgeConfig.label}</span>
          </div>
        </div>

        {/* Resumen de Miembros y Métricas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-3 text-xs">
          {/* Stack de Avatares */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {members.slice(0, 4).map((member, i) => (
                <div
                  key={member.id || i}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-gradient-to-tr from-emerald-600 to-teal-700 text-[10px] font-bold text-white shadow-sm"
                  title={member.user?.name || member.user?.email || 'Miembro'}
                >
                  {member.user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.name || 'Avatar'}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (member.user?.name || member.user?.email || 'M')
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
              ))}
              {members.length > 4 && (
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-surface text-[10px] font-bold text-muted-foreground">
                  +{members.length - 4}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onManageMembers(vault)}
              className="text-[11px] font-medium text-muted-foreground hover:text-emerald-500 transition cursor-pointer flex items-center gap-1"
            >
              <span>{members.length} {members.length === 1 ? 'miembro' : 'miembros'}</span>
              <UserPlus className="h-3 w-3 opacity-60" />
            </button>
          </div>

          {/* Gastos registrados */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Receipt className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-foreground">{expensesCount}</span>
            <span className="text-[11px]">{expensesCount === 1 ? 'gasto' : 'gastos'}</span>
          </div>
        </div>
      </div>

      {/* Botones de Acción Inferiores */}
      <div className="mt-5 space-y-2 pt-2 border-t border-border">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Ver Balances */}
          <button
            type="button"
            onClick={() => onSelectBalances(vault)}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 rounded-xl bg-surface hover:bg-surface/80 px-3 py-2 text-xs font-semibold text-foreground transition cursor-pointer border border-border shadow-sm"
          >
            <span>Ver Saldos & Balances</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          </button>

          {/* Botón Activar / Seleccionar */}
          <button
            type="button"
            onClick={() => setActiveVault(isActive ? null : vault)}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer border ${
              isActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-card border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-300'
            }`}
            title={isActive ? 'Desactivar modo compartido' : 'Usar como contexto activo'}
          >
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`} />
            <span>{isActive ? 'Activa' : 'Activar'}</span>
          </button>
        </div>

        {/* Acciones Secundarias: Editar o Eliminar si es OWNER/ADMIN */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-between gap-1 pt-1 text-muted-foreground">
            <span className="text-[11px] text-muted-foreground/80">Gestión</span>
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(vault)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-surface transition cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </button>
              )}
              {onDelete && (role === 'OWNER' || role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={() => onDelete(vault)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VaultCard;

'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Crown,
  ShieldCheck,
  UserCheck,
  Eye,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  Vault,
  VaultMember,
  VaultRole,
  addVaultMember,
  removeVaultMember,
} from '@/utils/api/vaults';

interface VaultMembersModalProps {
  isOpen: boolean;
  vault: Vault | null;
  currentUserId?: string;
  onClose: () => void;
  onUpdate: (updatedVault: Vault) => void;
}

export function VaultMembersModal({
  isOpen,
  vault,
  currentUserId,
  onClose,
  onUpdate,
}: VaultMembersModalProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<VaultRole>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !vault) return null;

  // Verificar si el usuario actual tiene permisos de administración
  const myMembership = vault.members?.find((m) =>
    currentUserId ? m.userId === currentUserId : m.role === 'OWNER' || m.role === 'ADMIN',
  );
  const canManage =
    !myMembership || myMembership.role === 'OWNER' || myMembership.role === 'ADMIN';

  const roleIcons: Record<VaultRole, React.ReactNode> = {
    OWNER: <Crown className="h-3 w-3 text-amber-400" />,
    ADMIN: <ShieldCheck className="h-3 w-3 text-blue-400" />,
    MEMBER: <UserCheck className="h-3 w-3 text-emerald-400" />,
    VIEWER: <Eye className="h-3 w-3 text-slate-400" />,
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError('Por favor ingresa un correo electrónico.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const newMember = await addVaultMember(vault.id, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      const updatedMembers = [...(vault.members || []), newMember];
      const updatedVault = { ...vault, members: updatedMembers };
      onUpdate(updatedVault);

      setSuccessMsg(`¡Invitación agregada con éxito para ${inviteEmail}!`);
      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al agregar miembro.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (member: VaultMember) => {
    if (member.role === 'OWNER') {
      setError('No es posible eliminar al propietario de la bóveda.');
      return;
    }

    const confirmMsg = `¿Deseas eliminar a ${member.user?.name || member.user?.email || 'este miembro'} de la bóveda?`;
    if (!window.confirm(confirmMsg)) return;

    setRemovingId(member.userId);
    setError(null);
    setSuccessMsg(null);

    try {
      await removeVaultMember(vault.id, member.userId);

      const updatedMembers = (vault.members || []).filter(
        (m) => m.userId !== member.userId,
      );
      const updatedVault = { ...vault, members: updatedMembers };
      onUpdate(updatedVault);

      setSuccessMsg('Miembro eliminado correctamente.');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al eliminar miembro.';
      setError(msg);
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Miembros de la Bóveda
              </h3>
              <p className="text-xs text-slate-400">
                {vault.name} • {vault.members?.length || 0} integrantes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario de Invitación (Solo ADMIN u OWNER) */}
        {canManage && (
          <form
            onSubmit={handleInvite}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Invitar Nuevo Miembro</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-12">
              <div className="sm:col-span-7 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as VaultRole)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="MEMBER">Miembro</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Observador</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-full flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-950/40"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Invitar'
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Los miembros con rol <b>Admin</b> pueden invitar y gestionar saldos. <b>Miembros</b> pueden registrar gastos.
            </p>
          </form>
        )}

        {/* Lista de Miembros Actuales */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Integrantes Activos</span>
            <span>{vault.members?.length || 0} en total</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {vault.members?.map((member) => {
              const isOwner = member.role === 'OWNER';
              const isRemoving = removingId === member.userId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3 hover:bg-slate-900/70 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 font-bold text-white shadow-md text-xs">
                      {member.user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.name || 'Avatar'}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        (member.user?.name || member.user?.email || 'M')
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>

                    {/* Datos */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {member.user?.name || member.user?.email || 'Usuario'}
                        </span>
                        {/* Rol badge */}
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {roleIcons[member.role]}
                          <span>{member.role}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="truncate max-w-[180px] sm:max-w-[240px]">
                          {member.user?.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {canManage && !isOwner && (
                    <button
                      type="button"
                      disabled={isRemoving}
                      onClick={() => handleRemove(member)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/40 hover:bg-rose-950/20 transition cursor-pointer disabled:opacity-50"
                      title="Eliminar miembro de la bóveda"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

export default VaultMembersModal;

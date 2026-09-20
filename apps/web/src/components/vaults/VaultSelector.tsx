'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User,
  Users,
  ChevronDown,
  Check,
  Plus,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useVaultStore } from '@/stores/useVaultStore';
import { getVaults, Vault } from '@/utils/api/vaults';

interface VaultSelectorProps {
  onOpenCreateModal?: () => void;
  className?: string;
}

export function VaultSelector({ onOpenCreateModal, className = '' }: VaultSelectorProps) {
  const { activeVault, setActiveVault, clearActiveVault } = useVaultStore();
  const [isOpen, setIsOpen] = useState(false);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar lista de bóvedas cuando se abre el menú o al montar
  useEffect(() => {
    let isMounted = true;
    getVaults()
      .then((data) => {
        if (isMounted) setVaults(data);
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
  }, [isOpen]);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPersonal = () => {
    clearActiveVault();
    setIsOpen(false);
  };

  const handleSelectVault = (vault: Vault) => {
    setActiveVault(vault);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Botón Disparador del Selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`group flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer backdrop-blur-xl ${
          activeVault
            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-950/50 shadow-sm shadow-emerald-950/30'
            : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/90 hover:text-white shadow-sm'
        }`}
        title="Cambiar entre modo Personal y Bóveda Compartida"
      >
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition ${
            activeVault
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400 group-hover:text-white'
          }`}
        >
          {activeVault ? (
            <Users className="h-3.5 w-3.5" />
          ) : (
            <User className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="flex flex-col items-start text-left">
          <span className="text-[10px] font-medium leading-none text-slate-400">
            Espacio:
          </span>
          <span className="truncate max-w-[120px] sm:max-w-[160px] font-bold text-white text-xs leading-tight">
            {activeVault ? activeVault.name : 'Personal'}
          </span>
        </div>

        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            activeVault
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {activeVault ? 'Bóveda' : 'Solo Yo'}
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown flotante con Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Espacio Activo
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Alterna entre tus finanzas personales y las compartidas
            </div>
          </div>

          <div className="py-1.5">
            {/* Opción Personal */}
            <button
              type="button"
              onClick={handleSelectPersonal}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${
                !activeVault
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Modo Personal</div>
                  <div className="text-[10px] text-slate-400">
                    Solo mis propios gastos e ingresos
                  </div>
                </div>
              </div>
              {!activeVault && <Check className="h-4 w-4 text-emerald-400" />}
            </button>
          </div>

          <div className="my-1 border-t border-slate-800/80" />

          {/* Sección Bóvedas Compartidas */}
          <div className="py-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Bóvedas Compartidas</span>
              {isLoading && <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {vaults.length === 0 && !isLoading ? (
                <div className="px-3 py-3 text-center text-xs text-slate-400">
                  No tienes bóvedas compartidas aún.
                </div>
              ) : (
                vaults.map((vault) => {
                  const isSelected = activeVault?.id === vault.id;
                  const memberCount = vault.members?.length || 1;
                  return (
                    <button
                      key={vault.id}
                      type="button"
                      onClick={() => handleSelectVault(vault)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-white truncate">{vault.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span>{memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}</span>
                            {vault._count?.expenses !== undefined && (
                              <>
                                <span>•</span>
                                <span>{vault._count.expenses} gastos</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="my-1 border-t border-slate-800/80" />

          {/* Acciones Rápidas */}
          <div className="pt-1 space-y-1">
            {onOpenCreateModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateModal();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Nueva Bóveda Compartida</span>
              </button>
            )}

            <Link
              href="/bovedas"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                Panel de Bóvedas & Saldos
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default VaultSelector;

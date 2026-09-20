'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  Sparkles,
  Loader2,
  AlertCircle,
  Home,
  Heart,
  Plane,
  Building,
} from 'lucide-react';
import { Vault, createVault, updateVault } from '@/utils/api/vaults';

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vault: Vault) => void;
  vaultToEdit?: Vault | null;
}

const PRESET_SUGGESTIONS = [
  {
    name: 'Casa & Pareja 🏡',
    description: 'Gastos compartidos del hogar, alquiler, súper y salidas en pareja.',
    icon: <Heart className="h-3.5 w-3.5 text-rose-400" />,
  },
  {
    name: 'Familia 👨‍👩‍👦',
    description: 'Presupuestos familiares, servicios, educación y compras del mes.',
    icon: <Home className="h-3.5 w-3.5 text-amber-400" />,
  },
  {
    name: 'Vacaciones & Viajes 🌴',
    description: 'Aéreos, hospedaje, excursiones y comidas durante el viaje.',
    icon: <Plane className="h-3.5 w-3.5 text-blue-400" />,
  },
  {
    name: 'Roommates / Depa 🏢',
    description: 'División equitativa de alquiler, expensas, internet y limpieza.',
    icon: <Building className="h-3.5 w-3.5 text-emerald-400" />,
  },
];

function CreateVaultModalContent({
  onClose,
  onSuccess,
  vaultToEdit,
}: Omit<CreateVaultModalProps, 'isOpen'>) {
  const [name, setName] = useState(vaultToEdit?.name ?? '');
  const [description, setDescription] = useState(vaultToEdit?.description ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la bóveda es requerido.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (vaultToEdit) {
        const updated = await updateVault(vaultToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        onSuccess(updated);
      } else {
        const created = await createVault({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar la bóveda compartida.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: (typeof PRESET_SUGGESTIONS)[0]) => {
    setName(preset.name);
    setDescription(preset.description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 z-10 space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                {vaultToEdit ? 'Editar Bóveda Compartida' : 'Nueva Bóveda Compartida'}
              </h3>
              <p className="text-xs text-slate-400">
                {vaultToEdit
                  ? 'Modifica el nombre o propósito de la bóveda'
                  : 'Crea un espacio común para dividir gastos con otros usuarios'}
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

        {/* Mensaje de Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Sugerencias Rápidas (solo al crear) */}
        {!vaultToEdit && (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Plantillas o Sugerencias Rápidas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SUGGESTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 text-left text-xs text-slate-300 hover:border-emerald-500/30 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                    {preset.icon}
                  </div>
                  <span className="font-semibold truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nombre de la Bóveda <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Casa & Pareja, Viaje a Bariloche..."
              maxLength={60}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descripción o Propósito (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Gastos del supermercado, alquiler, salidas y compras comunes."
              rows={3}
              maxLength={200}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{vaultToEdit ? 'Actualizar Bóveda' : 'Crear Bóveda'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateVaultModal(props: CreateVaultModalProps) {
  if (!props.isOpen) return null;
  return (
    <CreateVaultModalContent
      key={props.vaultToEdit ? props.vaultToEdit.id : 'create-new'}
      onClose={props.onClose}
      onSuccess={props.onSuccess}
      vaultToEdit={props.vaultToEdit}
    />
  );
}

export default CreateVaultModal;

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';
import { deleteAccountGDPR } from '@/utils/api/profile';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

const CONFIRMATION_KEYWORD = 'ELIMINAR';

export function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
}: DeleteAccountModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const isConfirmed = inputValue.trim() === CONFIRMATION_KEYWORD;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccountGDPR();
      // Redirigir a la página de autenticación con parámetro de confirmación
      router.push('/auth?deleted=true');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al purgar la cuenta y los datos asociados.';
      setError(msg);
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setInputValue('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/40 bg-slate-950/95 p-6 sm:p-8 shadow-2xl shadow-rose-950/50 backdrop-blur-xl space-y-6">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white sm:text-xl">
              ¿Eliminar cuenta permanentemente?
            </h3>
            <p className="mt-1 text-xs text-rose-300/80 font-medium">
              Conforme al Derecho al Olvido (Reglamento GDPR Art. 17)
            </p>
          </div>
        </div>

        {/* Advertencia detallada */}
        <div className="space-y-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 p-4 text-xs text-rose-200/90 leading-relaxed">
          <p className="font-semibold text-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            Esta acción es irreversible y permanente:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 ml-1">
            <li>Se eliminarán todos tus gastos e ingresos registrados.</li>
            <li>Se eliminarán todas tus categorías personalizadas y configuraciones.</li>
            <li>Se destruirán tus archivos y avatares en Supabase Storage.</li>
            <li>Se purgará la caché local y transacciones encoladas de tu navegador.</li>
            <li>Se revocará tu cuenta vinculada a <span className="font-mono text-rose-300 font-semibold">{userEmail}</span>.</li>
          </ul>
        </div>

        {/* Campo de verificación estricta */}
        <div className="space-y-2">
          <label
            htmlFor="delete-confirm-input"
            className="block text-xs font-semibold text-slate-300"
          >
            Para confirmar, escribe la palabra{' '}
            <span className="font-mono text-rose-400 font-bold tracking-wider select-all">
              {CONFIRMATION_KEYWORD}
            </span>{' '}
            en mayúsculas:
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isDeleting}
            placeholder={`Escribe ${CONFIRMATION_KEYWORD} para habilitar el botón`}
            className="w-full rounded-xl border border-rose-500/30 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition font-mono"
            autoComplete="off"
          />
        </div>

        {/* Error en caso de falla */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/50 hover:bg-rose-500 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Purgando datos y cuenta...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Eliminar mi cuenta definitivamente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

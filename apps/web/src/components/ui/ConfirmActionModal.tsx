'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmIcon?: React.ReactNode;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmIcon,
  variant = 'danger',
  isLoading = false,
}: ConfirmActionModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && !internalLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, internalLoading, onClose]);

  if (!isOpen || !mounted) return null;

  const busy = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger
    ? 'bg-red-500/10 text-red-400 ring-red-500/20'
    : isWarning
      ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
      : 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20';

  const borderCard = isDanger
    ? 'border-red-500/30'
    : isWarning
      ? 'border-amber-500/30'
      : 'border-indigo-500/30';

  const confirmBtnBg = isDanger
    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40'
    : isWarning
      ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-950/40'
      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40';

  const modalContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={() => !busy && onClose()}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md rounded-3xl border ${borderCard} bg-slate-900 p-6 sm:p-8 text-left shadow-2xl transition-all animate-in zoom-in-95 duration-150 backdrop-blur-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ring-1 mb-4`}>
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-bold text-white">{title}</h3>

        <div className="mt-2 text-xs text-slate-300 leading-relaxed">
          {description}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl ${confirmBtnBg} px-4 py-2.5 text-xs font-semibold shadow-lg transition disabled:opacity-50 cursor-pointer`}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                {confirmIcon}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ConfirmActionModal;

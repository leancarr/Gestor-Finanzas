'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, X, ScanLine } from 'lucide-react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ReceiptScannerModal } from '@/components/ai/ReceiptScannerModal';

interface AiParseResponse {
  amount: number;
  description: string;
  categoryId: string | null;
  date: string;
  type: 'EXPENSE' | 'INCOME';
}

export function MagicInput({ onSuccess }: { onSuccess?: () => void }) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<AiParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call backend AI parser
      // Gestor Guita uses proxy or direct URL? Let's assume it hits /expenses/ai-parse in the NestJS backend
      const { getApiUrl } = await import('@/utils/api/config');
      const apiUrl = getApiUrl();
      
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const res = await fetch(`${apiUrl}/expenses/ai-parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error('Error al procesar el texto con IA.');
      }

      const data: AiParseResponse = await res.json();
      setParsedData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setParsedData(null);
    setText('');
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full max-w-2xl mx-auto mb-8"
      >
        <div className="absolute left-4 text-emerald-400 animate-pulse">
          <Sparkles className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
          placeholder="Ej: Gaste 1000 en comida ayer..."
          className="w-full rounded-2xl border border-emerald-500/30 bg-slate-900/60 pl-12 pr-24 py-4 text-sm text-white placeholder-slate-400 shadow-xl backdrop-blur focus:border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
        />
        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            title="Escanear Ticket con Vision AI"
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700/60 shadow transition-all cursor-pointer flex items-center gap-1 text-xs"
          >
            <ScanLine className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
      {error && (
        <p className="text-center text-xs text-red-400 mt-2 mb-4">{error}</p>
      )}

      {/* Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={() => {
          if (onSuccess) onSuccess();
        }}
      />

      {/* Modal with ExpenseForm pre-filled */}
      {parsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg">
            <button
              onClick={handleModalClose}
              className="absolute -top-4 -right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700 shadow-xl cursor-pointer z-10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <ExpenseForm
              defaultAmount={parsedData.amount}
              defaultDescription={parsedData.description}
              defaultCategoryId={parsedData.categoryId || undefined}
              defaultType={parsedData.type}
              defaultDate={parsedData.date ? parsedData.date.split('T')[0] : undefined}
              redirectOnSuccess={false}
              onSuccess={() => {
                handleModalClose();
                if (onSuccess) onSuccess();
              }}
              onCancel={handleModalClose}
              className="w-full border-emerald-500/30 shadow-emerald-950/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}

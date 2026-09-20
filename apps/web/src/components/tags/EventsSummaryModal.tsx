'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Tag,
  Receipt,
  Layers,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import { TagSummary } from '@/utils/api/gamification';
import { ExpenseItem } from '@/utils/api/expenses';
import { TagBadge } from './TagBadge';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { formatCurrency, SupportedCurrency } from '@/utils/api/rates';

interface EventsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTag: string | null;
  onSelectTag?: (tag: string) => void;
  tagsSummary: TagSummary[];
  expenses?: ExpenseItem[];
}

export function EventsSummaryModal({
  isOpen,
  onClose,
  selectedTag,
  onSelectTag,
  tagsSummary,
  expenses = [],
}: EventsSummaryModalProps) {
  const [clickedTag, setClickedTag] = useState<string | null>(null);

  const activeTag = clickedTag ?? selectedTag ?? (tagsSummary.length > 0 ? tagsSummary[0].tag : null);

  const handleClose = useCallback(() => {
    setClickedTag(null);
    onClose();
  }, [onClose]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const currentSummary = useMemo(() => {
    if (!activeTag) return null;
    return (
      tagsSummary.find(
        (t) => t.tag.toLowerCase() === activeTag.toLowerCase()
      ) || null
    );
  }, [activeTag, tagsSummary]);

  // Gastos asociados a este hashtag
  const matchingExpenses = useMemo(() => {
    if (!activeTag) return [];
    const normalized = activeTag.toLowerCase().replace(/^#/, '');
    return expenses.filter((exp) => {
      // Chequear array de tags
      if (exp.tags && exp.tags.some((t) => t.toLowerCase().replace(/^#/, '') === normalized)) {
        return true;
      }
      // Chequear descripción por si tiene el hashtag inline
      const text = (exp.description || '').toLowerCase();
      return text.includes(`#${normalized}`) || text.includes(normalized);
    });
  }, [activeTag, expenses]);

  // Total acumulado real en pesos
  const totalAmountArs = useMemo(() => {
    if (matchingExpenses.length > 0) {
      return matchingExpenses.reduce((acc, exp) => {
        const val = typeof exp.amount === 'number' ? exp.amount : parseFloat(String(exp.amount)) || 0;
        const rate = Number(exp.exchangeRate) || 1;
        return acc + val * rate;
      }, 0);
    }
    return currentSummary?.totalAmount || 0;
  }, [matchingExpenses, currentSummary]);

  // Desglose por categoría
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; icon: string | null; color: string | null; total: number; count: number }>();

    matchingExpenses.forEach((exp) => {
      const catName = exp.category?.name || 'Varios / General';
      const catIcon = exp.category?.icon || null;
      const catColor = exp.category?.color || '#10b981';
      const val = typeof exp.amount === 'number' ? exp.amount : parseFloat(String(exp.amount)) || 0;
      const rate = Number(exp.exchangeRate) || 1;
      const arsVal = val * rate;

      const curr = map.get(catName) || { name: catName, icon: catIcon, color: catColor, total: 0, count: 0 };
      curr.total += arsVal;
      curr.count += 1;
      map.set(catName, curr);
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.total - a.total);
    return list;
  }, [matchingExpenses]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-md bg-black/70 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-emerald-950/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-md">
              <PartyPopper className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Resumen de Eventos & Hashtags</span>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                  SEI-41
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Presupuesto consolidado y costo total de viajes, festejos y proyectos especiales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body with 2 columns: Sidebar with Tags + Details */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Column 1: Event Tag Selector (col 4) */}
          <div className="md:col-span-4 space-y-3 border-b md:border-b-0 md:border-r border-slate-800/80 pb-4 md:pb-0 md:pr-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              Eventos Registrados ({tagsSummary.length})
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {tagsSummary.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-center text-xs text-slate-500">
                  No hay hashtags registrados todavía. Registrá un gasto con tags como <code>#ViajeBariloche</code>.
                </div>
              ) : (
                tagsSummary.map((item) => {
                  const isSelected = activeTag?.toLowerCase() === item.tag.toLowerCase();
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setClickedTag(item.tag)}
                      className={`w-full text-left rounded-2xl p-3 border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/15 shadow-lg shadow-indigo-950/40'
                          : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-white truncate">
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full shrink-0">
                          {item.count} ops
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Total:</span>
                        <span className="font-semibold text-emerald-400">
                          {formatCurrency(item.totalAmount, (item.currency || 'ARS') as SupportedCurrency)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Event Details & Transactions (col 8) */}
          <div className="md:col-span-8 space-y-5">
            {activeTag && currentSummary ? (
              <>
                {/* Event Hero Card */}
                <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900/70 to-slate-950 p-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <TagBadge tag={activeTag} size="md" />
                        <span className="text-xs text-slate-400 font-medium">
                          Evento / Etiqueta
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>
                          {formatDate(currentSummary.firstDate)} — {formatDate(currentSummary.lastDate)}
                        </span>
                      </div>
                    </div>

                    {onSelectTag && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTag(activeTag);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-950/50 transition cursor-pointer self-start sm:self-auto"
                      >
                        <span>Filtrar en Movimientos</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* KPIs del Evento */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Costo Total Acumulado
                      </span>
                      <p className="mt-1 text-lg font-black text-emerald-400">
                        {formatCurrency(totalAmountArs, 'ARS')}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Transacciones
                      </span>
                      <p className="mt-1 text-lg font-black text-white">
                        {matchingExpenses.length || currentSummary.count}{' '}
                        <span className="text-xs font-normal text-slate-400">gastos</span>
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">
                        Gasto Promedio
                      </span>
                      <p className="mt-1 text-lg font-black text-indigo-300">
                        {formatCurrency(
                          totalAmountArs / Math.max(1, matchingExpenses.length || currentSummary.count),
                          'ARS'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desglose por Rubros / Categorías del evento */}
                {categoryBreakdown.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-emerald-400" />
                      Distribución por Rubro en este Evento
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {categoryBreakdown.map((cat) => {
                        const pct = totalAmountArs > 0 ? Math.round((cat.total / totalAmountArs) * 100) : 0;
                        return (
                          <div
                            key={cat.name}
                            className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-inset"
                                style={{
                                  backgroundColor: `${cat.color || '#10b981'}15`,
                                  borderColor: `${cat.color || '#10b981'}30`,
                                  color: cat.color || '#10b981',
                                }}
                              >
                                <CategoryIcon name={cat.icon} className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white">{cat.name}</p>
                                <span className="text-[10px] text-slate-400">{cat.count} operaciones ({pct}%)</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-200">
                              {formatCurrency(cat.total, 'ARS')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lista de gastos asociados */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-slate-400" />
                    Gastos Agrupados ({matchingExpenses.length})
                  </h4>

                  {matchingExpenses.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-center text-xs text-slate-400">
                      Cargando transacciones detalladas de este evento...
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {matchingExpenses.map((exp) => {
                        const expVal = typeof exp.amount === 'number' ? exp.amount : parseFloat(String(exp.amount)) || 0;
                        return (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3 hover:border-slate-700 transition"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-white truncate">
                                {exp.description}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{formatDate(exp.date)}</span>
                                {exp.category && (
                                  <>
                                    <span>•</span>
                                    <span>{exp.category.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-rose-400 shrink-0">
                              - {formatCurrency(expVal, (exp.currency || 'ARS') as SupportedCurrency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/20 text-center p-6">
                <Tag className="h-10 w-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">
                  Selecciona un evento para ver su desglose
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Podrás ver el costo total de tu viaje o festejo, desglose por rubros y gastos asociados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

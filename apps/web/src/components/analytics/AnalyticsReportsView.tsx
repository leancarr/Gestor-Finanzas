'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Coins,
  PiggyBank,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  FolderOpen,
  Receipt,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { SupportedCurrency, formatCurrency } from '@/utils/api/rates';
import { AnalyticsCategoryItem } from '@/utils/api/analytics';
import { ExpenseItem } from '@/utils/api/expenses';
import { exportToCSV, exportToPDF } from '@/utils/export';
import { CategoryIcon } from '@/components/categories/CategoryIcon';

export interface AnalyticsReportsViewProps {
  periodExpenses: ExpenseItem[];
  categories: AnalyticsCategoryItem[];
  totalIncome: number;
  totalExpenses: number;
  currency: SupportedCurrency;
  periodLabel: string;
  loading?: boolean;
  vaultName?: string | null;
}

export function AnalyticsReportsView({
  periodExpenses,
  categories,
  totalIncome,
  totalExpenses,
  currency,
  periodLabel,
  loading = false,
  vaultName,
}: AnalyticsReportsViewProps) {
  const netBalance = totalIncome - totalExpenses;
  const isSurplus = netBalance >= 0;

  // Tasa de ahorro: (Ingresos - Gastos) / Ingresos * 100
  const savingRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10)
      : 0;

  const handleExportCSV = () => {
    if (periodExpenses.length === 0) {
      alert('No hay movimientos en este período para exportar.');
      return;
    }
    const safePeriod = periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    exportToCSV(periodExpenses, `Gestor_Guita_${safePeriod}`, { vaultName });
  };

  const handleExportPDF = () => {
    if (periodExpenses.length === 0) {
      alert('No hay movimientos en este período para exportar.');
      return;
    }
    exportToPDF(periodExpenses, {
      includeSummary: true,
      periodLabel,
      currency,
      customTitle: vaultName
        ? `REPORTE FINANCIERO EJECUTIVO - ${vaultName.toUpperCase()}`
        : 'REPORTE FINANCIERO EJECUTIVO',
      vaultName,
    });
  };

  const incomeCount = periodExpenses.filter((e) => e.type === 'INCOME').length;
  const expenseCount = periodExpenses.filter((e) => (e.type || 'EXPENSE') === 'EXPENSE').length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 rounded-3xl bg-white/5 border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-white/5 border border-white/10" />
          ))}
        </div>
        <div className="h-64 rounded-3xl bg-white/5 border border-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HEADER DE LA VISTA DE REPORTES CON ACCIONES DE EXPORTACIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-950/40 p-5 backdrop-blur-md shadow-lg">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              <Sparkles className="h-3 w-3" />
              Reporte Ejecutivo Consolidado
            </span>
            {vaultName && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200 shadow-sm">
                🏛️ Espacio: {vaultName}
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {periodLabel}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Balance General y Estado de Flujos
          </h2>
          <p className="text-xs text-slate-400">
            Resumen contable con cálculo de solvencia, concentración de egresos y descarga de datos.
          </p>
        </div>

        {/* Action Buttons: Exportar CSV & Exportar PDF */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={periodExpenses.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            title="Descargar movimientos estructurados en formato CSV / Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={periodExpenses.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer"
            title="Generar PDF ejecutivo formal con marca de agua y paginación"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS RESUMEN DE BALANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingresos */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Ingresos
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(totalIncome, currency)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {incomeCount} {incomeCount === 1 ? 'entrada registrada' : 'entradas registradas'}
            </p>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Gastos
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-rose-400 tracking-tight">
              {formatCurrency(totalExpenses, currency)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {expenseCount} {expenseCount === 1 ? 'egreso registrado' : 'egresos registrados'}
            </p>
          </div>
        </div>

        {/* Balance Neto */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Balance Neto
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${
                isSurplus
                  ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
              }`}
            >
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p
              className={`text-2xl font-black tracking-tight ${
                isSurplus ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isSurplus ? '+' : ''}
              {formatCurrency(netBalance, currency)}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isSurplus ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-300">
                {isSurplus ? 'Superávit Financiero' : 'Déficit en el período'}
              </span>
            </div>
          </div>
        </div>

        {/* Tasa de Ahorro % */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tasa de Ahorro
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-amber-400 tracking-tight">
              {savingRate}%
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 truncate">
                {totalIncome <= 0
                  ? 'Sin ingresos para calcular'
                  : savingRate >= 30
                  ? 'Nivel Excelente (≥ 30%)'
                  : savingRate >= 15
                  ? 'Nivel Saludable (≥ 15%)'
                  : 'Margen de ahorro ajustado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICO / LISTADO DE BARRAS HORIZONTALES PROPORCIONALES DE GASTO POR RUBRO */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Gasto por Rubro / Categoría
            </h3>
            <p className="text-xs text-slate-400">
              Distribución porcentual y barras horizontales del presupuesto consumido en el período
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-xl self-start sm:self-auto">
            {categories.length} {categories.length === 1 ? 'rubro con egresos' : 'rubros con egresos'}
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 mb-3">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              No se registraron egresos en este período
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Selecciona otro rango o registra nuevos movimientos para visualizar el gráfico.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat, idx) => {
              const catColor = cat.color || '#10b981';
              return (
                <div
                  key={cat.categoryId || idx}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 p-4 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Rubro info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset shrink-0"
                        style={{
                          backgroundColor: `${catColor}15`,
                          borderColor: `${catColor}35`,
                          color: catColor,
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">
                            {cat.categoryName}
                          </p>
                          {idx === 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              <Sparkles className="h-2.5 w-2.5" />
                              Mayor concentración
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {cat.count} {cat.count === 1 ? 'transacción' : 'transacciones'}
                        </p>
                      </div>
                    </div>

                    {/* Monto y % */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white tracking-tight">
                        {formatCurrency(cat.total, currency)}
                      </p>
                      <p className="text-xs font-semibold text-emerald-400">
                        {cat.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Barra horizontal proporcional */}
                  <div className="mt-3 h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: catColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. AUDITORÍA DETALLADA DE MOVIMIENTOS DEL PERÍODO */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Movimientos Auditados
              </h3>
              <p className="text-[11px] text-slate-400">
                Lista ordenada de transacciones del período seleccionado
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            {periodExpenses.length} {periodExpenses.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {periodExpenses.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 text-xs">
            <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
            <span>No hay movimientos registrados para la fecha o período seleccionado.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-center">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {periodExpenses.slice(0, 50).map((item) => {
                  const isIncome = item.type === 'INCOME';
                  const dateStr = item.date ? item.date.slice(0, 10) : '-';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors text-slate-200"
                    >
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap font-mono">
                        {dateStr}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {item.category?.name || 'Sin Categoría'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isIncome ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(item.amount, item.currency || currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {periodExpenses.length > 50 && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Mostrando los primeros 50 registros. Exporta en CSV o PDF para ver el detalle completo ({periodExpenses.length} movimientos).
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

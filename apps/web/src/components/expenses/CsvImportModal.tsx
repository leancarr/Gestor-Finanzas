'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Calendar,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import {
  parseCsvString,
  guessColumnMapping,
  guessInitialTypeMode,
  normalizeRows,
  ColumnMapping,
  ImportTypeMode,
  NormalizedExpenseRow,
} from '@/utils/csvParser';
import { createExpense } from '@/utils/api/expenses';
import { CategoryItem } from '@/utils/api/categories';
import { SupportedCurrency } from '@/utils/api/rates';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  categories?: CategoryItem[];
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'completed';

export function CsvImportModal({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
}: CsvImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [detectedDelimiter, setDetectedDelimiter] = useState<string>(',');
  const [error, setError] = useState<string | null>(null);

  // Column mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateColumn: '',
    descriptionColumn: '',
    amountColumn: '',
    categoryColumn: '',
    typeColumn: '',
  });

  // Import options
  const [currency, setCurrency] = useState<SupportedCurrency>('ARS');
  const [typeMode, setTypeMode] = useState<ImportTypeMode>('auto');
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');

  // Progress state
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [totalToProcess, setTotalToProcess] = useState<number>(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset modal state
  const handleReset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setFileSize('');
    setRawHeaders([]);
    setRawRows([]);
    setError(null);
    setTypeMode('auto');
    setProgressPercent(0);
    setProcessedCount(0);
    setTotalToProcess(0);
    setImportErrors([]);
  }, []);

  const handleClose = useCallback(() => {
    if (step === 'importing') return; // Do not close while importing
    handleReset();
    onClose();
  }, [step, handleReset, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step !== 'importing') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, handleClose]);

  // Read and parse selected CSV file
  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Por favor sube un archivo con extensión .csv válido.');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content || !content.trim()) {
          setError('El archivo CSV está vacío.');
          return;
        }

        const parsed = parseCsvString(content);

        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError(
            'No se encontraron filas con datos en el archivo CSV. Revisa el formato.',
          );
          return;
        }

        // Guessed mapping
        const guessed = guessColumnMapping(parsed.headers);
        setMapping(guessed);

        // Smart type mode initialization
        const initialTypeMode = guessInitialTypeMode(parsed.rows, parsed.headers, guessed);
        setTypeMode(initialTypeMode);

        // Pre-evaluación fail-fast: si el 100% de las filas son inválidas, rebotar en la pantalla de carga
        const initialNormalized = normalizeRows(
          parsed.rows,
          parsed.headers,
          guessed,
          initialTypeMode,
        );
        const validCount = initialNormalized.filter((r) => r.isValid).length;

        if (validCount === 0) {
          const sampleErrors = Array.from(
            new Set(initialNormalized.map((r) => r.validationError).filter(Boolean)),
          )
            .slice(0, 3)
            .join(' • ');

          setError(
            `El archivo no contiene filas válidas para importar (${parsed.rows.length} detectadas, 0 válidas). ${
              sampleErrors ? `Causa: ${sampleErrors}.` : ''
            } Verifique que el archivo contenga montos mayores a 0 y descripciones válidas antes de continuar.`,
          );
          return;
        }

        setRawHeaders(parsed.headers);
        setRawRows(parsed.rows);
        setDetectedDelimiter(parsed.delimiter);

        setStep('mapping');
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error inesperado al interpretar el archivo CSV.',
        );
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo en el navegador.');
    };

    reader.readAsText(file, 'utf-8');
  };

  // Normalized preview rows based on current mapping
  const normalizedRows: NormalizedExpenseRow[] = useMemo(() => {
    if (rawRows.length === 0 || rawHeaders.length === 0) return [];
    return normalizeRows(rawRows, rawHeaders, mapping, typeMode);
  }, [rawRows, rawHeaders, mapping, typeMode]);

  const validRows = useMemo(
    () => normalizedRows.filter((r) => r.isValid),
    [normalizedRows],
  );
  const invalidRowsCount = normalizedRows.length - validRows.length;
  const previewRows = useMemo(() => normalizedRows.slice(0, 10), [normalizedRows]);

  // Start the import process
  const handleStartImport = async () => {
    if (validRows.length === 0) {
      setError('No hay filas válidas para importar. Revisa el mapeo de columnas.');
      return;
    }

    setStep('importing');
    setTotalToProcess(validRows.length);
    setProcessedCount(0);
    setProgressPercent(0);
    setError(null);

    const errors: string[] = [];

    // Process in batches of 4 for optimal performance and rate-limit safety
    const BATCH_SIZE = 4;
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          try {
            // Find matched category if any
            let catId: string | null = null;
            if (row.category) {
              const matched = categories.find(
                (c) =>
                  c.name.toLowerCase().trim() === row.category?.toLowerCase().trim(),
              );
              if (matched) catId = matched.id;
            }

            if (!catId && defaultCategoryId) {
              catId = defaultCategoryId;
            }

            await createExpense({
              description: row.description,
              amount: row.amount,
              currency,
              date: row.date,
              type: row.type,
              categoryId: catId,
            });
          } catch (err: unknown) {
            const msg =
              err instanceof Error ? err.message : 'Error desconocido al guardar';
            errors.push(`Fila ${row.index} (${row.description}): ${msg}`);
          }
        }),
      );

      const processed = Math.min(i + BATCH_SIZE, validRows.length);
      setProcessedCount(processed);
      setProgressPercent(Math.round((processed / validRows.length) * 100));
    }

    setImportErrors(errors);
    setStep('completed');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'importing') {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/80 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Importación Masiva de CSV
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  SEI-57
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Carga extractos bancarios o resúmenes de tarjetas y mapea tus columnas
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'importing'}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800/80 hover:text-white transition cursor-pointer disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD CSV FILE */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 hover:border-emerald-500/60 bg-slate-900/30 hover:bg-emerald-950/10 p-12 text-center transition-all cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/40 group-hover:scale-105 text-slate-400 group-hover:text-emerald-400 shadow-xl transition-all mb-4">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Arrastra tu archivo CSV bancario aquí o haz clic para explorar
                </h4>
                <p className="text-xs text-slate-400 max-w-md mb-5">
                  Compatible con extractos de Santander, BBVA, Galicia, Mercado Pago, Brubank, Macro y planillas de cálculo.
                </p>
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <FileText className="h-4 w-4" />
                  Seleccionar archivo .csv
                </div>
              </div>

              {/* Supported formats guidance card */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
                  Formatos soportados automáticamente:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-400">
                  <div className="rounded-xl bg-slate-950/50 p-2.5 border border-slate-800/60">
                    <p className="font-semibold text-slate-200 mb-0.5">Delimitadores</p>
                    <p className="text-[11px]">Coma (<code className="text-emerald-400">,</code>), Punto y coma (<code className="text-emerald-400">;</code>) o Tabulación.</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 p-2.5 border border-slate-800/60">
                    <p className="font-semibold text-slate-200 mb-0.5">Fechas</p>
                    <p className="text-[11px]">DD/MM/YYYY, DD-MM-YYYY o formato estándar ISO YYYY-MM-DD.</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/50 p-2.5 border border-slate-800/60">
                    <p className="font-semibold text-slate-200 mb-0.5">Montos</p>
                    <p className="text-[11px]">$ 1.234,56 o 1234.56, con detección de débitos/créditos.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & PREVIEW */}
          {step === 'mapping' && (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{fileName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({fileSize})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{rawRows.length} filas detectadas</span>
                      <span>•</span>
                      <span>Delimitador: <code className="text-emerald-400 font-mono font-bold">{detectedDelimiter === '\t' ? '\\t (Tab)' : detectedDelimiter}</code></span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Cambiar archivo
                </button>
              </div>

              {/* Column Mapping Section */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
                    Mapeo de Columnas Bancarias
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Detectado automáticamente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Date Column */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      Columna de Fecha *
                    </label>
                    <select
                      value={mapping.dateColumn}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, dateColumn: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none transition cursor-pointer"
                    >
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description Column */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-emerald-400" />
                      Columna de Descripción *
                    </label>
                    <select
                      value={mapping.descriptionColumn}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          descriptionColumn: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none transition cursor-pointer"
                    >
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Column */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-400" />
                      Columna de Monto *
                    </label>
                    <select
                      value={mapping.amountColumn}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, amountColumn: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none transition cursor-pointer"
                    >
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Column (Optional) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-slate-400" />
                      Columna Categoría (Opcional)
                    </label>
                    <select
                      value={mapping.categoryColumn || ''}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          categoryColumn: e.target.value || undefined,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none transition cursor-pointer"
                    >
                      <option value="">(Ninguna / Usar categoría fija)</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Settings Bar */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Currency Selection */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400">Moneda asignada</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrency('ARS')}
                        className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold transition cursor-pointer ${
                          currency === 'ARS'
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        🇦🇷 ARS ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold transition cursor-pointer ${
                          currency === 'USD'
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        🇺🇸 USD (US$)
                      </button>
                    </div>
                  </div>

                  {/* Type Mode */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400">Tipo de movimiento</label>
                    <select
                      value={typeMode}
                      onChange={(e) => setTypeMode(e.target.value as ImportTypeMode)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition cursor-pointer"
                    >
                      <option value="all_expenses">Forzar todos como Gastos</option>
                      <option value="all_income">Forzar todos como Ingresos</option>
                      <option value="auto">Detectar por signo / tipo</option>
                    </select>
                  </div>

                  {/* Default Category */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400">
                      Categoría por defecto
                    </label>
                    <select
                      value={defaultCategoryId}
                      onChange={(e) => setDefaultCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition cursor-pointer"
                    >
                      <option value="">Sin categoría asignada</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-2.5">
                {validRows.length === 0 && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      Ninguna fila cumple con los criterios de validación con las columnas seleccionadas.
                      Ajusta el mapeo de columnas arriba para habilitar la importación.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Previsualización de Filas Detectadas
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      (Mostrando primeras {previewRows.length} de {rawRows.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                      {validRows.length} válidas
                    </span>
                    {invalidRowsCount > 0 && (
                      <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
                        {invalidRowsCount} omitidas
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-900/30">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3">Monto</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {previewRows.map((row) => (
                        <tr
                          key={row.index}
                          className={
                            row.isValid
                              ? 'hover:bg-slate-800/30 transition'
                              : 'bg-rose-950/10 text-rose-300'
                          }
                        >
                          <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                            {row.index}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-200">
                            {row.date}
                          </td>
                          <td className="py-2 px-3 font-medium text-white max-w-xs truncate">
                            {row.description}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-emerald-400">
                            {currency === 'ARS' ? '$' : 'US$'}{' '}
                            {row.amount.toLocaleString('es-AR', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-3">
                            {row.type === 'INCOME' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                <TrendingUp className="h-3 w-3" />
                                Ingreso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                                <TrendingDown className="h-3 w-3" />
                                Gasto
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Válida
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400"
                                title={row.validationError}
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                {row.validationError || 'Error'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROGRESS BAR DURING IMPORT */}
          {step === 'importing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/40">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">
                  Importando movimientos a tu cuenta...
                </h4>
                <p className="text-xs text-slate-400">
                  Registrando fila {processedCount} de {totalToProcess} con persistencia segura en base de datos.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-2">
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>{progressPercent}% completado</span>
                  <span>{processedCount} / {totalToProcess}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETED SUMMARY */}
          {step === 'completed' && (
            <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/30">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">
                  ¡Importación finalizada con éxito!
                </h4>
                <p className="text-xs text-slate-300">
                  Se crearon <strong className="text-emerald-400">{processedCount - importErrors.length}</strong> movimientos en tus registros.
                </p>
              </div>

              {importErrors.length > 0 && (
                <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-left text-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>{importErrors.length} filas no pudieron procesarse:</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-rose-300/80">
                    {importErrors.map((err, i) => (
                      <p key={i} className="text-[11px] font-mono">• {err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800/80 px-6 py-4 bg-slate-900/40 flex items-center justify-end gap-3">
          {step !== 'completed' && (
            <button
              type="button"
              onClick={handleClose}
              disabled={step === 'importing'}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-40"
            >
              Cancelar
            </button>
          )}

          {step === 'mapping' && (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={validRows.length === 0}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold transition shadow-xl ${
                validRows.length === 0
                  ? 'border border-slate-800 bg-slate-900/80 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 cursor-pointer'
              }`}
            >
              <span>
                {validRows.length === 0
                  ? 'Sin movimientos válidos para importar'
                  : `Importar ${validRows.length} Movimientos`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {step === 'completed' && (
            <button
              type="button"
              onClick={() => {
                const totalSuccess = processedCount - importErrors.length;
                handleClose();
                onSuccess(totalSuccess);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-emerald-950/50 transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finalizar y Ver Movimientos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

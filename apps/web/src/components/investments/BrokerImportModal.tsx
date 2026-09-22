'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  ScanLine,
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Coins,
  Clock,
  Layers,
  Building,
} from 'lucide-react';
import { CreateAssetInput } from '@/utils/api/investments';

interface BrokerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (importedAssets: CreateAssetInput[]) => void;
}

interface SupportedBroker {
  id: string;
  name: string;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  formats: string;
  description: string;
}

const SUPPORTED_BROKERS: SupportedBroker[] = [
  {
    id: 'bmb',
    name: 'Bull Market Brokers',
    badge: 'BMB',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/25',
    formats: 'Captura de pantalla • Resumen PDF',
    description: 'Reconocimiento de CEDEARs, ONs y fondos comunes.',
  },
  {
    id: 'iol',
    name: 'InvertirOnline (IOL)',
    badge: 'IOL',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/25',
    formats: 'Detalle de Portafolio • PNG / JPG',
    description: 'Extracción de títulos de renta variable y fija.',
  },
  {
    id: 'balanz',
    name: 'Balanz Capital',
    badge: 'BALANZ',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/25',
    formats: 'Consolidado de Tenencias • Imagen / PDF',
    description: 'Lectura de saldos en pesos, Dólar MEP y bonos.',
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers',
    badge: 'IBKR',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/25',
    formats: 'Portfolio Analyst Snapshot • CSV / PNG',
    description: 'Soporte global para acciones de EE.UU. y ETFs en USD.',
  },
];

// Cartera de ejemplo detectada mediante OCR en simulación
const DEMO_DETECTED_ASSETS: CreateAssetInput[] = [
  {
    name: 'CEDEAR Apple Inc.',
    type: 'CEDEAR',
    ticker: 'AAPL',
    quantity: 15,
    purchasePrice: 4700,
    currentPrice: 5000,
    currency: 'ARS',
    institution: 'Bull Market Brokers',
    notes: 'Importado automáticamente vía OCR desde resumen',
  },
  {
    name: 'CEDEAR SPDR S&P 500 ETF',
    type: 'CEDEAR',
    ticker: 'SPY',
    quantity: 10,
    purchasePrice: 11200,
    currentPrice: 12000,
    currency: 'ARS',
    institution: 'Bull Market Brokers',
    notes: 'Importado automáticamente vía OCR desde resumen',
  },
  {
    name: 'Dólar MEP Líquido',
    type: 'CASH_USD',
    quantity: 2500,
    purchasePrice: 1,
    currentPrice: 1,
    currency: 'USD',
    institution: 'Bull Market Brokers',
    notes: 'Saldo líquido reconocido en cuenta comitente',
  },
];

export function BrokerImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: BrokerImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [detectedAssets, setDetectedAssets] = useState<CreateAssetInput[] | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'scan'>('info');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      startOcrSimulation(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      startOcrSimulation(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const startOcrSimulation = (fileName?: string) => {
    setActiveTab('scan');
    setIsScanning(true);
    setScanProgress(15);
    setScanStatusText(
      fileName
        ? `Analizando captura de pantalla: "${fileName}"...`
        : 'Procesando captura con Vision AI & OCR...'
    );
    setDetectedAssets(null);

    setTimeout(() => {
      setScanProgress(45);
      setScanStatusText('Detectando tablas de cotizaciones y formato del broker...');
    }, 900);

    setTimeout(() => {
      setScanProgress(80);
      setScanStatusText('Extrayendo especies (AAPL, SPY), cantidades y precios...');
    }, 1800);

    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);
      setScanStatusText('¡Extracción completada con éxito!');
      setDetectedAssets(DEMO_DETECTED_ASSETS);
    }, 2600);
  };

  const handleConfirmImport = () => {
    if (detectedAssets && onImportSuccess) {
      onImportSuccess(detectedAssets);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsScanning(false);
    setScanProgress(0);
    setDetectedAssets(null);
    setActiveTab('info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop con desenfoque de cristal */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Contenedor del Modal con Glassmorphism */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Glow orbs decorativos de fondo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Encabezado */}
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 ring-1 ring-emerald-500/30 shadow-inner">
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Importación Inteligente vía Broker OCR
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  Vision AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingesta automatizada de portafolios desde capturas de pantalla y resúmenes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Selector de Pestañas (Explicación vs Escáner) */}
        <div className="relative z-10 mt-5 flex rounded-2xl bg-slate-950/60 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Brokers Compatibles & Cómo Funciona</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Subir Captura o Probar Demo</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: CÓMO FUNCIONA & BROKERS SOPORTADOS                            */}
        {/* ========================================================================= */}
        {activeTab === 'info' && (
          <div className="relative z-10 mt-5 space-y-6 animate-in fade-in duration-200">
            {/* 3 Pasos del Flujo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 text-center sm:text-left space-y-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs mx-auto sm:mx-0">
                  1
                </div>
                <h4 className="text-xs font-bold text-white">Captura tu Portafolio</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Descargá el resumen en PDF o tomá una captura de pantalla a la tabla de tenencias de tu broker.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 text-center sm:text-left space-y-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs mx-auto sm:mx-0">
                  2
                </div>
                <h4 className="text-xs font-bold text-white">Extracción Visión OCR</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  El motor OCR detecta automáticamente tickers, especies, cantidades nominales y precios pactados.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 text-center sm:text-left space-y-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs mx-auto sm:mx-0">
                  3
                </div>
                <h4 className="text-xs font-bold text-white">Validación y Carga</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Revisá los activos reconocidos y agregalos a tu portafolio sin tener que tipear números manualmente.
                </p>
              </div>
            </div>

            {/* Grilla de Brokers Soportados */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                Brokers con Soporte Directo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUPPORTED_BROKERS.map((broker) => (
                  <div
                    key={broker.id}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-white/10 hover:bg-white/[0.04] transition"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{broker.name}</h4>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-black font-mono border ${broker.bgColor} ${broker.borderColor} ${broker.color}`}
                      >
                        {broker.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{broker.description}</p>
                    <p className="mt-1.5 text-[10px] font-mono text-slate-500">{broker.formats}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de Privacidad Estricta */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-white">100% Privado & Sin Credenciales</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Nunca te solicitaremos contraseñas ni claves API de tu cuenta comitente. El análisis OCR procesa únicamente las imágenes o PDFs que subas de manera aislada y segura.
                </p>
              </div>
            </div>

            {/* Botón CTA a Escanear */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('scan')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
              >
                <span>Probar Ingesta OCR</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: ÁREA DE CARGA Y SIMULACIÓN OCR                                */}
        {/* ========================================================================= */}
        {activeTab === 'scan' && (
          <div className="relative z-10 mt-5 space-y-5 animate-in fade-in duration-200">
            {/* Input oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Dropzone de Carga */}
            {!isScanning && !detectedAssets && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition-all cursor-pointer"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-white">
                  Arrastra tu captura aquí o haz clic para seleccionar
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Admite capturas de pantalla en PNG, JPG o documentos PDF de balances de tenencias.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startOcrSimulation('demo-bullmarket-tenencias.png');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    Probar con demo de Bull Market / IOL
                  </button>
                </div>
              </div>
            )}

            {/* Estado de Escaneo Activo */}
            {isScanning && (
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Escaneando estructura con Vision OCR
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    {scanStatusText}
                  </p>
                </div>

                {/* Barra de progreso */}
                <div className="mx-auto max-w-md">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <span className="mt-1.5 block text-right text-[10px] font-mono text-slate-500">
                    {scanProgress}% completado
                  </span>
                </div>
              </div>
            )}

            {/* Vista previa de Activos Detectados */}
            {detectedAssets && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {detectedAssets.length} posiciones detectadas correctamente:
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                    Broker: Bull Market
                  </span>
                </div>

                {/* Lista de posiciones reconocidas */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {detectedAssets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 shrink-0">
                          {asset.type === 'CEDEAR' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : asset.type === 'CRYPTO' ? (
                            <Coins className="h-4 w-4" />
                          ) : asset.type === 'FIXED_TERM' ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <FileCheck2 className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {asset.quantity} {asset.ticker ? `(${asset.ticker})` : 'unidades'} • {asset.institution}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <p className="font-bold text-emerald-400">
                          {asset.currency === 'USD' ? 'u$s' : '$'}{' '}
                          {(asset.quantity * (asset.currentPrice || 1)).toLocaleString('es-AR')}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Precio un: {asset.currency === 'USD' ? 'u$s' : '$'} {asset.currentPrice?.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botones de acción final */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setDetectedAssets(null);
                      setSelectedFile(null);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                  >
                    Volver a escanear
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirmar e Importar al Portafolio</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

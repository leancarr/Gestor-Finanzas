'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Camera,
  ScanLine,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Calendar,
  Store,
  DollarSign,
  Plus,
  Trash2,
  Layers,
  FileText,
} from 'lucide-react';
import { parseReceipt, ParsedReceipt, ReceiptItem } from '@/utils/api/ai';
import { createExpense, ExpenseItem } from '@/utils/api/expenses';
import { getCategories, CategoryItem } from '@/utils/api/categories';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (expense: ExpenseItem) => void;
}

type ScanStep = 'select' | 'camera' | 'scanning' | 'preview';

export function ReceiptScannerModal({
  isOpen,
  onClose,
  onSuccess,
}: ReceiptScannerModalProps) {
  const [step, setStep] = useState<ScanStep>('select');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Analizando comprobante con Vision AI...');
  const [error, setError] = useState<string | null>(null);

  // Editable parsed data
  const [merchant, setMerchant] = useState('');
  const [total, setTotal] = useState<number>(0);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [taxAmount, setTaxAmount] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [showItemsBreakdown, setShowItemsBreakdown] = useState(true);

  // Camera handling
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up camera on unmount or step change
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCameraStream();
    setStep('select');
    setImagePreview(null);
    setError(null);
    setCameraError(null);
    onClose();
  }, [stopCameraStream, onClose]);

  // Load categories
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    getCategories()
      .then((cats) => {
        if (isMounted) setCategories(cats);
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step !== 'scanning') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, handleClose]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraStarting(true);
    setStep('camera');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está soportada en este navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo acceder a la cámara. Revisa los permisos de tu navegador.';
      setCameraError(msg);
    } finally {
      setIsCameraStarting(false);
    }
  };

  // Capture photo from video
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    stopCameraStream();
    processScannedImage(dataUrl, 'image/jpeg');
  };

  // Handle file drop / upload
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      processScannedImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Process image with Vision AI
  const processScannedImage = async (base64: string, mimeType: string) => {
    setImagePreview(base64);
    setStep('scanning');
    setError(null);

    // Dynamic scanning status progression
    setScanStatusText('Analizando comprobante con Vision AI...');
    const t1 = setTimeout(() => {
      setScanStatusText('Detectando comercio y fecha...');
    }, 600);
    const t2 = setTimeout(() => {
      setScanStatusText('Extrayendo ítems, subtotales e impuestos...');
    }, 1200);

    try {
      const result: ParsedReceipt = await parseReceipt(base64, mimeType);

      setMerchant(result.merchant || 'Comercio General');
      setTotal(result.total || 0);
      setCurrency((result.currency?.toUpperCase() === 'USD' ? 'USD' : 'ARS') as 'ARS' | 'USD');
      setDate(result.date || new Date().toISOString().split('T')[0]);
      setTaxAmount(result.taxAmount);
      setItems(result.items || []);

      // Pre-select category if suggested or match by keyword
      if (result.categoryId) {
        setCategoryId(result.categoryId);
      } else if (categories.length > 0) {
        const found = matchCategory(result.merchant, categories);
        if (found) {
          setCategoryId(found.id);
        } else {
          setCategoryId(categories[0].id);
        }
      }

      setStep('preview');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al procesar la imagen con Vision AI.',
      );
      setStep('select');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  };

  // Smart category suggestion based on merchant name
  const matchCategory = (
    merchantName: string,
    catList: CategoryItem[],
  ): CategoryItem | undefined => {
    const text = merchantName.toLowerCase();

    if (
      text.includes('coto') ||
      text.includes('carrefour') ||
      text.includes('dia') ||
      text.includes('jumbo') ||
      text.includes('disco') ||
      text.includes('vea') ||
      text.includes('supermercado') ||
      text.includes('almacen') ||
      text.includes('verduleria')
    ) {
      return catList.find((c) => c.name.toLowerCase().includes('super') || c.name.toLowerCase().includes('comida'));
    }

    if (
      text.includes('ypf') ||
      text.includes('shell') ||
      text.includes('axion') ||
      text.includes('combustible') ||
      text.includes('nafta') ||
      text.includes('peaje') ||
      text.includes('sube') ||
      text.includes('uber') ||
      text.includes('cabify')
    ) {
      return catList.find((c) => c.name.toLowerCase().includes('transporte') || c.name.toLowerCase().includes('combustible') || c.name.toLowerCase().includes('auto'));
    }

    if (
      text.includes('farmacity') ||
      text.includes('farmacia') ||
      text.includes('medic') ||
      text.includes('dr.') ||
      text.includes('hospital') ||
      text.includes('salud')
    ) {
      return catList.find((c) => c.name.toLowerCase().includes('salud') || c.name.toLowerCase().includes('farmacia'));
    }

    if (
      text.includes('cafe') ||
      text.includes('café') ||
      text.includes('starbucks') ||
      text.includes('bar') ||
      text.includes('restaurant') ||
      text.includes('mcdonald') ||
      text.includes('burger') ||
      text.includes('pizza')
    ) {
      return catList.find((c) => c.name.toLowerCase().includes('salida') || c.name.toLowerCase().includes('ocio') || c.name.toLowerCase().includes('restaurante'));
    }

    return undefined;
  };

  // Create final expense
  const handleConfirmAndCreate = async () => {
    if (!merchant.trim()) {
      setError('Por favor especifica el nombre o comercio del comprobante.');
      return;
    }
    if (!total || total <= 0) {
      setError('El monto total debe ser mayor a 0.');
      return;
    }

    setIsCreatingExpense(true);
    setError(null);

    try {
      const created = await createExpense({
        description: merchant.trim(),
        amount: total,
        currency,
        date: date || new Date().toISOString().split('T')[0],
        categoryId: categoryId || null,
        type: 'EXPENSE',
      });

      if (onSuccess) {
        onSuccess(created);
      }
      handleClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al registrar el gasto en el sistema.',
      );
    } finally {
      setIsCreatingExpense(false);
    }
  };

  // Add Item to table
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: 'Nuevo ítem', amount: 0, quantity: 1 },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item
  const handleUpdateItem = (
    index: number,
    field: keyof ReceiptItem,
    val: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: val };
        }
        return item;
      }),
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'scanning') {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ScanLine className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Escanear Comprobante
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Vision AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Extrae comercio, montos y desglose de tickets con inteligencia artificial
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'scanning' || isCreatingExpense}
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

          {/* STEP 1: SELECT MODE (UPLOAD OR CAMERA) */}
          {step === 'select' && (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 hover:border-emerald-500/60 bg-slate-900/30 hover:bg-emerald-950/10 p-10 text-center transition-all cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/40 group-hover:scale-105 text-slate-400 group-hover:text-emerald-400 shadow-xl transition-all mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Arrastra tu comprobante aquí o haz clic para subir
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Formatos soportados: JPG, PNG, WEBP. Se procesa de forma segura con IA.
                </p>
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-3.5 py-1.5 text-xs text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition">
                  Explorar archivo
                </div>
              </div>

              {/* Camera Alternative */}
              <div className="relative flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">
                      ¿Estás en tu celular o tienes cámara web?
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Captura el ticket impreso en vivo directamente con tu cámara
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  Abrir Cámara
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LIVE CAMERA FEED */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative w-full h-80 overflow-hidden rounded-3xl border border-emerald-500/40 bg-black flex items-center justify-center shadow-inner">
                {isCameraStarting && (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <span className="text-xs">Iniciando cámara...</span>
                  </div>
                )}
                {cameraError ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <p className="text-xs text-red-300">{cameraError}</p>
                    <label className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-medium text-white cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Capturar con app nativa
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    {/* Viewfinder Target Frame */}
                    <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-emerald-400/60 flex flex-col justify-between p-3">
                      <div className="flex justify-between text-[10px] text-emerald-400 font-mono tracking-wider bg-black/40 px-2 py-0.5 rounded backdrop-blur self-start">
                        ENFOQUE AUTOMÁTICO
                      </div>
                      <div className="text-center text-[11px] text-emerald-300 bg-black/50 backdrop-blur px-3 py-1 rounded-full self-center">
                        Centra el comprobante dentro del marco
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Camera Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setStep('select');
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Volver a subir
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    Capturar Foto
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: LASER SCANNING ANIMATION */}
          {step === 'scanning' && imagePreview && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <div className="relative w-72 h-80 overflow-hidden rounded-3xl border-2 border-emerald-500/50 bg-slate-900 shadow-2xl shadow-emerald-950/40">
                {/* Captured Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Ticket Escaneado"
                  className="h-full w-full object-cover filter brightness-90 contrast-110"
                />

                {/* Laser scan line overlay */}
                <div
                  className="pointer-events-none absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-laser"
                  style={{
                    animation: 'laserScan 2.2s ease-in-out infinite',
                  }}
                />

                {/* Tech grid overlay */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(5,5,5,0.7)_100%)]" />
                <div className="pointer-events-none absolute top-3 left-3 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                  OCR + VISION AI
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-center space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{scanStatusText}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Reconociendo caracteres ópticos, formato de comprobante y tipos de cambio...
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: EDITABLE PREVIEW OF EXTRACTED DATA */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Top summary badge with small thumbnail */}
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imagePreview}
                      alt="Thumbnail"
                      className="h-11 w-11 rounded-xl object-cover border border-emerald-500/30"
                    />
                  )}
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Datos extraídos con éxito
                    </span>
                    <p className="text-xs text-slate-300">
                      Revisa y edita los campos antes de confirmar el gasto
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setImagePreview(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Cambiar foto
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merchant / Description */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-emerald-400" />
                    Comercio / Descripción
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="Ej: Coto, YPF, Farmacia..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Amount Total */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    Monto Total
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={total || ''}
                      onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Currency Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Moneda
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrency('ARS')}
                      className={`flex-1 rounded-2xl border py-2.5 text-xs font-bold transition cursor-pointer ${
                        currency === 'ARS'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      🇦🇷 ARS ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`flex-1 rounded-2xl border py-2.5 text-xs font-bold transition cursor-pointer ${
                        currency === 'USD'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      🇺🇸 USD (US$)
                    </button>
                  </div>
                </div>

                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-400" />
                    Categoría (Sugerida por IA)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={categories.length === 0}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    Fecha del Comprobante
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Tax Badge if detected */}
              {taxAmount !== undefined && taxAmount > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 px-3.5 py-2 text-xs text-slate-400">
                  <span>Impuesto / IVA detectado en ticket:</span>
                  <span className="font-semibold text-slate-200">
                    ${taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Collapsible Items Breakdown */}
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowItemsBreakdown(!showItemsBreakdown)}
                  className="w-full flex items-center justify-between p-4 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span>Desglose de ítems detectados ({items.length})</span>
                  </div>
                  {showItemsBreakdown ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {showItemsBreakdown && (
                  <div className="p-4 pt-0 border-t border-slate-800/60 space-y-3">
                    {items.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-3">
                        No se discriminaron ítems individuales en este ticket.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-2 border border-slate-800/60 text-xs"
                          >
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItem(idx, 'description', e.target.value)
                              }
                              placeholder="Descripción del ítem"
                              className="flex-1 bg-transparent px-2 py-1 text-slate-200 focus:outline-none"
                            />
                            <div className="flex items-center gap-1 w-20">
                              <span className="text-slate-500 text-[10px]">Cant:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    idx,
                                    'quantity',
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-10 bg-transparent text-center text-slate-200 focus:outline-none border-b border-slate-700"
                              />
                            </div>
                            <div className="flex items-center gap-1 w-28">
                              <span className="text-slate-500 text-[10px]">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    idx,
                                    'amount',
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-20 bg-transparent text-right font-medium text-emerald-400 focus:outline-none border-b border-slate-700"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar ítem manual
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800/80 px-6 py-4 bg-slate-900/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={step === 'scanning' || isCreatingExpense}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>

          {step === 'preview' && (
            <button
              type="button"
              onClick={handleConfirmAndCreate}
              disabled={isCreatingExpense}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
            >
              {isCreatingExpense ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando gasto...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar y Crear Gasto
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

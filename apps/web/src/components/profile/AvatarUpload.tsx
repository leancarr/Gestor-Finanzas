'use client';

import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, AlertCircle, UploadCloud } from 'lucide-react';
import { uploadAvatar } from '@/utils/api/profile';

interface AvatarUploadProps {
  avatarUrl: string | null;
  name?: string | null;
  onAvatarChange: (newUrl: string | null) => void;
  disabled?: boolean;
}

export function AvatarUpload({
  avatarUrl,
  name,
  onAvatarChange,
  disabled = false,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se admiten archivos de imagen (PNG, JPG, WEBP, etc.).');
      return;
    }

    // Validación de tamaño (5MB máximo)
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen excede el límite de ${MAX_SIZE_MB}MB.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const publicUrl = await uploadAvatar(file);
      onAvatarChange(publicUrl);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al subir la imagen de avatar.';
      setError(msg);
    } finally {
      setUploading(false);
      // Limpiar el input para permitir seleccionar el mismo archivo si es necesario
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setError(null);
    onAvatarChange(null);
  };

  const initials = name
    ? name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition">
      {/* Contenedor del Avatar */}
      <div className="relative group shrink-0">
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-slate-900 shadow-xl shadow-emerald-950/40 flex items-center justify-center">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name || 'Avatar del usuario'}
              className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600/30 via-slate-800 to-slate-900 text-2xl sm:text-3xl font-bold text-emerald-400 select-none">
              {initials}
            </div>
          )}

          {/* Overlay de carga */}
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs text-white">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <span className="mt-1 text-[10px] font-medium text-slate-300">Subiendo...</span>
            </div>
          )}
        </div>

        {/* Botón flotante para cambiar imagen en móvil/hover */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 transition-all hover:scale-110 disabled:opacity-50 cursor-pointer"
          title="Cambiar foto de perfil"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* Detalles y Acciones */}
      <div className="flex-1 space-y-3 text-center sm:text-left">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            Foto de Perfil
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Supabase Storage
            </span>
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-md">
            Personaliza tu identidad visual. Admite formatos PNG, JPG o WEBP de hasta 5MB. Se sincroniza con el bucket &apos;avatars&apos; con respaldo automático.
          </p>
        </div>

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {uploading ? 'Cargando imagen...' : 'Subir nueva foto'}
          </button>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar foto
            </button>
          )}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 mt-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

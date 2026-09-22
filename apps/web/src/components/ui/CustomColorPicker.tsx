'use client';

import React from 'react';
import { Check, Palette } from 'lucide-react';

export const HARMONIC_COLORS = [
  { hex: '#10B981', name: 'Esmeralda' },
  { hex: '#22C55E', name: 'Verde' },
  { hex: '#14B8A6', name: 'Teal' },
  { hex: '#06B6D4', name: 'Cian' },
  { hex: '#0EA5E9', name: 'Cielo' },
  { hex: '#3B82F6', name: 'Azul' },
  { hex: '#6366F1', name: 'Índigo' },
  { hex: '#8B5CF6', name: 'Violeta' },
  { hex: '#A855F7', name: 'Púrpura' },
  { hex: '#F43F5E', name: 'Rosa' },
  { hex: '#F59E0B', name: 'Ámbar' },
  { hex: '#F97316', name: 'Naranja' },
];

interface CustomColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  className?: string;
  error?: string;
}

export function CustomColorPicker({
  value,
  onChange,
  label = 'Color de Identificación',
  className = '',
  error,
}: CustomColorPickerProps) {
  const selectedHex = (value || '#10B981').toLowerCase();

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Palette className="h-3.5 w-3.5 text-emerald-400" />
            <span>{label}</span>
          </label>

          {/* Active color preview chip */}
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: selectedHex }}
            />
            <span className="text-xs text-slate-400 font-medium capitalize">
              {HARMONIC_COLORS.find((c) => c.hex.toLowerCase() === selectedHex)?.name || 'Personalizado'}
            </span>
          </div>
        </div>
      )}

      {/* Grid of 12 Harmonic Colors */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 p-2 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
        {HARMONIC_COLORS.map((color) => {
          const isSelected = color.hex.toLowerCase() === selectedHex;

          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => onChange(color.hex)}
              title={color.name}
              className={`relative h-8 w-full rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-950 shadow-lg z-10'
                  : 'hover:scale-105 opacity-85 hover:opacity-100'
              }`}
              style={{
                backgroundColor: color.hex,
                boxShadow: isSelected ? `0 0 12px ${color.hex}80` : undefined,
              }}
            >
              {isSelected && (
                <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

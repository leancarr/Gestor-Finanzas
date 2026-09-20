'use client';

import React, { useState, KeyboardEvent, useMemo } from 'react';
import { Hash, Plus, Sparkles } from 'lucide-react';
import { TagBadge } from './TagBadge';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestedTags?: string[];
  className?: string;
  label?: string;
}

const DEFAULT_SUGGESTIONS = [
  '#ViajeBariloche',
  '#CenaFinDeAno',
  '#Vacaciones2026',
  '#Mudanza',
  '#Cumpleanios',
  '#Salidas',
  '#ProyectoPersonal',
];

export function TagInput({
  tags = [],
  onChange,
  placeholder = 'Ej: #ViajeBariloche, #CenaFinDeAno...',
  maxTags = 8,
  suggestedTags = DEFAULT_SUGGESTIONS,
  className = '',
  label = 'Etiquetas o Eventos (#Hashtags)',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const normalizeTag = (raw: string) => {
    let cleaned = raw.trim();
    if (!cleaned) return '';
    if (!cleaned.startsWith('#')) {
      cleaned = `#${cleaned}`;
    }
    // Permitir letras, números, guiones y guiones bajos
    return cleaned.replace(/[^\w#\u00C0-\u00FF-]/g, '');
  };

  const addTag = (raw: string) => {
    const formatted = normalizeTag(raw);
    if (!formatted || formatted === '#') return;

    if (tags.length >= maxTags) return;

    // Evitar duplicados (case-insensitive)
    const exists = tags.some((t) => t.toLowerCase() === formatted.toLowerCase());
    if (!exists) {
      onChange([...tags, formatted]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Si el input está vacío y presiona borrar, elimina el último tag
      e.preventDefault();
      removeTag(tags[tags.length - 1]);
    }
  };

  // Filtrar sugerencias que aún no han sido añadidas
  const availableSuggestions = useMemo(() => {
    return suggestedTags.filter(
      (sug) => !tags.some((t) => t.toLowerCase() === sug.toLowerCase())
    );
  }, [suggestedTags, tags]);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
          <span className="text-[11px] text-slate-500">
            {tags.length} / {maxTags} tags
          </span>
        </div>
      )}

      {/* Main Tag Input Container */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 shadow-inner focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
        {/* Render Selected Tags as Badges */}
        {tags.map((tag) => (
          <TagBadge
            key={tag}
            tag={tag}
            size="sm"
            onRemove={() => removeTag(tag)}
          />
        ))}

        {/* Text Input */}
        {tags.length < maxTags && (
          <div className="flex flex-1 items-center min-w-[150px] relative">
            <span className="text-slate-500 pl-1.5 pr-0.5 select-none font-bold text-xs">
              #
            </span>
            <input
              type="text"
              value={inputValue.startsWith('#') ? inputValue.slice(1) : inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputValue.trim()) {
                  addTag(inputValue);
                }
              }}
              placeholder={tags.length === 0 ? placeholder : 'Agregar otro tag...'}
              className="w-full bg-transparent py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {inputValue.trim() && (
              <button
                type="button"
                onClick={() => addTag(inputValue)}
                className="ml-1 inline-flex items-center gap-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer border border-emerald-500/40"
              >
                <Plus className="h-3 w-3" />
                Añadir
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suggested Quick Tags */}
      {availableSuggestions.length > 0 && tags.length < maxTags && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            <Sparkles className="h-2.5 w-2.5 text-amber-400" />
            Sugeridos:
          </span>
          {availableSuggestions.slice(0, 5).map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => addTag(sug)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/10 transition cursor-pointer"
            >
              <Hash className="h-2.5 w-2.5 text-slate-500" />
              <span>{sug.replace(/^#/, '')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

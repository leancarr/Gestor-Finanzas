'use client';

import React from 'react';
import { X, Hash } from 'lucide-react';

interface TagBadgeProps {
  tag: string;
  active?: boolean;
  onClick?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'emerald' | 'amber' | 'violet' | 'cyan';
  className?: string;
  showHashIcon?: boolean;
}

// Generador de color determinista por nombre de tag para identificar eventos visualmente
const PALETTES = [
  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40 hover:bg-emerald-500/15', active: 'bg-emerald-500/25 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', hover: 'hover:border-indigo-500/40 hover:bg-indigo-500/15', active: 'bg-indigo-500/25 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', hover: 'hover:border-cyan-500/40 hover:bg-cyan-500/15', active: 'bg-cyan-500/25 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30' },
  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', hover: 'hover:border-amber-500/40 hover:bg-amber-500/15', active: 'bg-amber-500/25 border-amber-500 text-amber-300 ring-1 ring-amber-500/30' },
  { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40 hover:bg-purple-500/15', active: 'bg-purple-500/25 border-purple-500 text-purple-300 ring-1 ring-purple-500/30' },
  { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', hover: 'hover:border-rose-500/40 hover:bg-rose-500/15', active: 'bg-rose-500/25 border-rose-500 text-rose-300 ring-1 ring-rose-500/30' },
  { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', hover: 'hover:border-teal-500/40 hover:bg-teal-500/15', active: 'bg-teal-500/25 border-teal-500 text-teal-300 ring-1 ring-teal-500/30' },
  { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', hover: 'hover:border-sky-500/40 hover:bg-sky-500/15', active: 'bg-sky-500/25 border-sky-500 text-sky-300 ring-1 ring-sky-500/30' },
];

function getPaletteForTag(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

export function TagBadge({
  tag,
  active = false,
  onClick,
  onRemove,
  size = 'sm',
  className = '',
  showHashIcon = false,
}: TagBadgeProps) {
  const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
  const palette = getPaletteForTag(cleanTag);

  const sizeClasses = {
    xs: 'text-[10px] py-0.5 px-2 gap-1 rounded-md',
    sm: 'text-xs py-1 px-2.5 gap-1.5 rounded-lg',
    md: 'text-sm py-1.5 px-3 gap-2 rounded-xl',
  }[size];

  const currentTheme = active
    ? palette.active
    : `${palette.bg} ${palette.text} ${palette.border} ${onClick ? palette.hover : ''}`;

  const Comp = onClick ? 'button' : 'span';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={() => onClick && onClick(cleanTag)}
      className={`inline-flex items-center font-medium border backdrop-blur-sm transition-all shadow-xs shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${sizeClasses} ${currentTheme} ${className}`}
      title={onClick ? `Filtrar por evento ${cleanTag}` : undefined}
    >
      {showHashIcon ? (
        <Hash className="h-3 w-3 opacity-70 shrink-0" />
      ) : null}
      <span className="truncate">{cleanTag}</span>

      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(cleanTag);
          }}
          className="ml-0.5 -mr-1 rounded-md p-0.5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={`Quitar ${cleanTag}`}
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </Comp>
  );
}

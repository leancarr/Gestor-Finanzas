'use client';

import React from 'react';
import { Tag, PartyPopper, X } from 'lucide-react';
import { TagSummary } from '@/utils/api/gamification';
import { TagBadge } from './TagBadge';

interface EventTagFilterProps {
  tagsSummary: TagSummary[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onOpenEventsModal?: () => void;
  className?: string;
}

export function EventTagFilter({
  tagsSummary = [],
  selectedTag,
  onSelectTag,
  onOpenEventsModal,
  className = '',
}: EventTagFilterProps) {
  if (tagsSummary.length === 0) {
    return null;
  }

  return (
    <div className={`relative flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-2.5 backdrop-blur-md ${className}`}>
      {/* Label Icon */}
      <div className="flex items-center gap-1.5 pl-1.5 pr-2 text-slate-400 shrink-0 border-r border-slate-800">
        <Tag className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
          Eventos:
        </span>
      </div>

      {/* Horizontal Scrollable Tags List */}
      <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
        {/* 'Todos' Pill */}
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            selectedTag === null
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          Todos
        </button>

        {/* Dynamic Event Tags */}
        {tagsSummary.map((item) => {
          const isSelected =
            selectedTag?.toLowerCase() === item.tag.toLowerCase();
          return (
            <div key={item.tag} className="shrink-0 flex items-center">
              <TagBadge
                tag={item.tag}
                active={isSelected}
                onClick={(tag) => onSelectTag(isSelected ? null : tag)}
                size="sm"
              />
            </div>
          );
        })}
      </div>

      {/* Clear Active Filter Button if a tag is selected */}
      {selectedTag && (
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white px-2 py-1 text-[10px] font-medium transition cursor-pointer shrink-0"
          title="Limpiar filtro de evento"
        >
          <X className="h-3 w-3 text-rose-400" />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      )}

      {/* Button to open EventsSummaryModal */}
      {onOpenEventsModal && (
        <button
          type="button"
          onClick={onOpenEventsModal}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 transition cursor-pointer shrink-0 shadow-xs"
          title="Ver desglose financiero y costos consolidados por evento"
        >
          <PartyPopper className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden md:inline">Resumen Eventos</span>
        </button>
      )}
    </div>
  );
}

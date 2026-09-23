'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { CategoryIcon } from '@/components/categories/CategoryIcon';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string | null;
  color?: string | null;
  badge?: string;
  type?: 'INCOME' | 'EXPENSE';
}

export interface SelectGroup {
  label: string;
  type?: 'INCOME' | 'EXPENSE';
  badgeColor?: string;
  options: SelectOption[];
}

interface CustomSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  className?: string;
  error?: string;
}

export function CustomSelect({
  value,
  onChange,
  options = [],
  groups,
  label,
  placeholder = 'Seleccionar opción...',
  disabled = false,
  required = false,
  searchable = true,
  className = '',
  error,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Group options if not already grouped and type is present
  const resolvedGroups: SelectGroup[] = React.useMemo(() => {
    if (groups && groups.length > 0) return groups;

    const incomeOptions = options.filter((o) => o.type === 'INCOME');
    const expenseOptions = options.filter((o) => o.type === 'EXPENSE');
    const otherOptions = options.filter((o) => !o.type);

    const result: SelectGroup[] = [];
    if (expenseOptions.length > 0) {
      result.push({
        label: 'Gastos (Egresos)',
        type: 'EXPENSE',
        badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        options: expenseOptions,
      });
    }
    if (incomeOptions.length > 0) {
      result.push({
        label: 'Ingresos (Entradas)',
        type: 'INCOME',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        options: incomeOptions,
      });
    }
    if (otherOptions.length > 0) {
      result.push({
        label: 'Opciones',
        badgeColor: 'text-slate-400 bg-slate-800 border-slate-700',
        options: otherOptions,
      });
    }

    return result.length > 0
      ? result
      : [{ label: 'Opciones', options }];
  }, [groups, options]);

  // Find currently selected option
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    for (const group of resolvedGroups) {
      const match = group.options.find((o) => o.value === value);
      if (match) return match;
    }
    return options.find((o) => o.value === value) || null;
  }, [value, resolvedGroups, options]);

  // Filtered groups based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchTerm.trim()) return resolvedGroups;
    const lower = searchTerm.toLowerCase();

    return resolvedGroups
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) =>
            o.label.toLowerCase().includes(lower) ||
            o.value.toLowerCase().includes(lower)
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [resolvedGroups, searchTerm]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          {label} {required && <span className="text-emerald-400">*</span>}
        </label>
      )}

      {/* Select trigger button */}
      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-3 ${
            value && !disabled ? 'pr-16' : 'pr-8'
          } rounded-2xl border bg-slate-950/80 text-xs text-white shadow-inner transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            disabled
              ? 'opacity-50 cursor-not-allowed border-slate-800'
              : isOpen
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
              : error
              ? 'border-red-500/50'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {selectedOption ? (
              <>
                {selectedOption.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: selectedOption.color }}
                  />
                )}
                {selectedOption.icon && (
                  <CategoryIcon name={selectedOption.icon} className="h-4 w-4 shrink-0 text-slate-300" />
                )}
                <span className="font-semibold text-white truncate">
                  {selectedOption.label}
                </span>
              </>
            ) : (
              <span className="text-slate-500 font-normal">{placeholder}</span>
            )}
          </div>
        </button>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-slate-800 hover:text-white transition z-10"
              title="Limpiar selección"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 pointer-events-none ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col">
          {searchable && (
            <div className="p-1.5 pb-2 border-b border-slate-800/80">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar opción..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto flex-1 p-1 space-y-3 mt-1">
            {filteredGroups.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-500">
                No se encontraron opciones
              </p>
            ) : (
              filteredGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  {/* Group header badge */}
                  <div className="px-2 py-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        group.type === 'INCOME'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : group.type === 'EXPENSE'
                          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          : 'text-slate-400 bg-slate-800 border-slate-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          group.type === 'INCOME'
                            ? 'bg-emerald-400'
                            : group.type === 'EXPENSE'
                            ? 'bg-rose-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>{group.label}</span>
                    </span>
                  </div>

                  {/* Group options */}
                  <div className="space-y-0.5">
                    {group.options.map((option) => {
                      const isOptionSelected = option.value === value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                            isOptionSelected
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {option.color && (
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: option.color }}
                              />
                            )}
                            {option.icon && (
                              <CategoryIcon
                                name={option.icon}
                                className="h-3.5 w-3.5 shrink-0 text-slate-400"
                              />
                            )}
                            <span className="truncate">{option.label}</span>
                          </div>

                          {isOptionSelected && (
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

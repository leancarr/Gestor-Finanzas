'use client';

import React from 'react';

interface CustomAmountInputProps {
  value: number | string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  currency?: string;
  currencySymbol?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number | string;
  name?: string;
  id?: string;
}

export function CustomAmountInput({
  value,
  onChange,
  label,
  placeholder = '0.00',
  currency,
  currencySymbol = '$',
  disabled = false,
  required = false,
  className = '',
  error,
  min,
  max,
  step = 'any',
  name,
  id,
}: CustomAmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-xs font-medium text-slate-300 mb-1.5"
        >
          {label} {required && <span className="text-emerald-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Currency symbol / badge */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <span className="text-sm font-semibold text-emerald-400 select-none">
            {currencySymbol}
          </span>
        </div>

        {/* Amount Input with hidden native spinners */}
        <input
          id={id || name}
          name={name}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full pl-8 pr-14 py-2.5 rounded-xl border bg-slate-900/90 text-sm font-semibold text-white placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            disabled
              ? 'opacity-50 cursor-not-allowed border-slate-800'
              : error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-slate-800 hover:border-slate-700 focus:border-emerald-500/50'
          }`}
        />

        {/* Currency code badge on the right */}
        {currency && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
              {currency}
            </span>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

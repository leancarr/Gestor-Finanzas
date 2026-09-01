'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

interface LoginButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  label?: string;
}

export function LoginButton({
  className = '',
  variant = 'primary',
  label = 'Iniciar Sesión',
}: LoginButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer';

  const variants = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 px-4 py-2',
    outline:
      'border border-slate-700 hover:border-slate-600 bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-4 py-2',
    ghost:
      'text-slate-300 hover:text-white hover:bg-slate-800/60 px-3 py-1.5',
  };

  return (
    <Link
      href="/auth"
      className={`${baseStyles} ${variants[variant]} ${className}`}
      id="login-button"
    >
      <LogIn className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

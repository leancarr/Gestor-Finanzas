'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface LogoutButtonProps {
  className?: string;
  variant?: 'danger' | 'ghost' | 'outline';
  onLoggedOut?: () => void;
}

export function LogoutButton({
  className = '',
  variant = 'ghost',
  onLoggedOut,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      if (onLoggedOut) {
        onLoggedOut();
      }
      router.refresh();
      router.push('/auth');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none cursor-pointer';

  const variants = {
    danger:
      'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2',
    outline:
      'border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800 text-slate-300 px-3.5 py-2',
    ghost:
      'text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5',
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      id="logout-button"
      title="Cerrar Sesión"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span>{loading ? 'Saliendo...' : 'Cerrar Sesión'}</span>
    </button>
  );
}

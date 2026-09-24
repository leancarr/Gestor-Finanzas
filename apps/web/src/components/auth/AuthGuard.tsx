'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const PUBLIC_PATHS = ['/', '/auth'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Las rutas públicas no requieren autenticación
    if (PUBLIC_PATHS.includes(pathname)) {
      setChecking(false);
      setIsAuthenticated(true);
      return;
    }

    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          router.replace('/auth');
        } else {
          setIsAuthenticated(true);
        }
        setChecking(false);
      })
      .catch(() => {
        router.replace('/auth');
        setChecking(false);
      });
  }, [pathname, router]);

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (checking || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-950/40 mb-3 animate-pulse">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-300">
          Verificando sesión...
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Redirigiendo a inicio de sesión si no estás autenticado.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

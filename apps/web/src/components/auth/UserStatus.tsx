'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { LoginButton } from './LoginButton';
import { LogoutButton } from './LogoutButton';
import { User as UserIcon, ShieldCheck, Settings } from 'lucide-react';

export function UserStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    // Listen for auth state changes in real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 border border-slate-800 animate-pulse">
        <div className="h-4 w-4 rounded-full bg-slate-800" />
        <span>Cargando perfil...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <LoginButton variant="primary" />
      </div>
    );
  }

  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Usuario';

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/perfil"
        className="group flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 px-3 py-1.5 text-xs shadow-inner transition cursor-pointer"
        title="Ver y editar mi perfil"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-6 w-6 rounded-lg object-cover ring-1 ring-emerald-500/40 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
        )}
        <div className="flex flex-col text-left">
          <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors truncate max-w-[110px] sm:max-w-[160px]">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
            Supabase Auth
          </span>
        </div>
        <Settings className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:rotate-45 transition ml-0.5" />
      </Link>
      <LogoutButton variant="ghost" onLoggedOut={() => setUser(null)} />
    </div>
  );
}

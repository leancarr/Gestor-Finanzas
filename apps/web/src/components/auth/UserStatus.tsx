'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getProfile } from '@/utils/api/profile';
import { LoginButton } from './LoginButton';
import { LogoutButton } from './LogoutButton';
import { User as UserIcon, ShieldCheck, Settings } from 'lucide-react';

export function UserStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadProfileAvatar = () => {
      getProfile()
        .then((data) => {
          if (data?.avatarUrl) {
            setProfileAvatar(data.avatarUrl);
          }
        })
        .catch(() => {});
    };

    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) loadProfileAvatar();
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
      if (session?.user) loadProfileAvatar();
    });

    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarUrl?: string | null }>;
      if (customEvent.detail && 'avatarUrl' in customEvent.detail) {
        setProfileAvatar(customEvent.detail.avatarUrl || null);
      } else {
        loadProfileAvatar();
      }
    };
    window.addEventListener('gestorguita_avatar_updated', handleAvatarUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('gestorguita_avatar_updated', handleAvatarUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 border border-slate-800 animate-pulse w-full">
        <div className="h-4 w-4 rounded-full bg-slate-800" />
        <span className="truncate text-[11px]">Cargando perfil...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 w-full">
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
    profileAvatar ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  return (
    <div className="flex items-center gap-1.5 w-full min-w-0">
      <Link
        href="/perfil"
        className="group flex flex-1 min-w-0 items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 px-2.5 py-1.5 text-xs shadow-inner transition cursor-pointer"
        title="Ver y editar mi perfil"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-6 w-6 rounded-lg object-cover ring-1 ring-emerald-500/40 group-hover:scale-105 transition-transform shrink-0"
          />
        ) : (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
        )}
        <div className="flex flex-col text-left min-w-0 flex-1">
          <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors truncate text-[11px]">
            {displayName}
          </span>
          <span className="text-[9px] text-slate-500 flex items-center gap-1 truncate">
            <ShieldCheck className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
            Supabase Auth
          </span>
        </div>
        <Settings className="h-3 w-3 text-slate-500 group-hover:text-emerald-400 group-hover:rotate-45 transition shrink-0 ml-auto" />
      </Link>
      <LogoutButton
        variant="ghost"
        showText={false}
        className="shrink-0 p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
        onLoggedOut={() => setUser(null)}
      />
    </div>
  );
}

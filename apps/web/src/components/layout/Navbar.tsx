'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Repeat,
  Target,
  Bot,
  LayoutDashboard,
  Award,
  Users,
  Layers,
  User as UserIcon,
} from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { StreakBadge } from '@/components/gamification/StreakBadge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Gastos', href: '/gastos', icon: DollarSign },
  { name: 'Recurrentes', href: '/suscripciones', icon: Repeat },
  { name: 'Presupuestos', href: '/presupuestos', icon: Target },
  { name: 'Metas', href: '/metas', icon: Award },
  { name: 'Inversiones', href: '/inversiones', icon: TrendingUp },
  { name: 'Analíticas', href: '/analiticas', icon: BarChart3 },
  { name: 'Asistente', href: '/asistente', icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
                <DollarSign className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition">
                  Gestor Guita
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  Finanzas Inteligentes
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Immutable Order) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard' || pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right utility cluster */}
          <div className="flex items-center gap-2.5 shrink-0">
            <VaultSelector />
            <StreakBadge />
            <Link
              href="/perfil"
              title="Mi Perfil"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            >
              <UserIcon className="h-4 w-4" />
            </Link>
            <UserStatus />
          </div>
        </div>

        {/* Mobile Subnavigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-900 scrollbar-none">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${
                  isActive
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

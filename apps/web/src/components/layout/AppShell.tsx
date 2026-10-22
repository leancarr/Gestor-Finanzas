'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Coins,
  Sparkles,
  Receipt,
  Repeat,
  LayoutDashboard,
  PieChart,
  Target,
  BarChart3,
  Users,
  Bot,
  User,
  Trash2,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrefs, PrefsProvider } from '@/lib/prefs';
import { PrefSwitches } from '@/components/landing/PrefSwitches';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { TrashModal } from '@/components/trash/TrashModal';
import { UserStatus } from '@/components/auth/UserStatus';

type NavItemKey = keyof ReturnType<typeof usePrefs>['t']['app']['items'];

interface NavItem {
  href: string;
  label: NavItemKey;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const GRUPOS: {
  titulo: 'log' | 'understand' | 'share';
  items: NavItem[];
}[] = [
  {
    titulo: 'log',
    items: [
      { href: '/gastos/nuevo', label: 'log', icon: Sparkles },
      { href: '/gastos', label: 'tx', icon: Receipt },
      { href: '/suscripciones', label: 'rec', icon: Repeat },
    ],
  },
  {
    titulo: 'understand',
    items: [
      { href: '/dashboard', label: 'home', icon: LayoutDashboard },
      { href: '/presupuestos', label: 'budgets', icon: PieChart },
      { href: '/inversiones', label: 'fx', icon: Coins },
      { href: '/metas', label: 'goals', icon: Target },
      { href: '/analiticas', label: 'reports', icon: BarChart3 },
    ],
  },
  {
    titulo: 'share',
    items: [
      { href: '/bovedas', label: 'vault', icon: Users },
      { href: '/asistente', label: 'assistant', icon: Bot },
      { href: '/perfil', label: 'profile', icon: User },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = GRUPOS.flatMap((g) => g.items);

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: keyof ReturnType<typeof usePrefs>['t']['app']['items'];
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const { t } = usePrefs();
  const activo =
    href === '/dashboard'
      ? pathname === '/dashboard'
      : href === '/gastos'
      ? pathname === '/gastos'
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'tap group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all cursor-pointer',
        activo
          ? 'bg-primary/12 text-primary font-semibold'
          : 'text-muted-foreground hover:bg-glass hover:text-foreground'
      )}
    >
      <Icon
        className={cn(
          'size-[18px] shrink-0 transition-colors',
          activo ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
        strokeWidth={1.8}
      />
      <span className="truncate">{t.app.items[label]}</span>
      {activo && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute right-3 size-1.5 rounded-full bg-primary"
        />
      )}
    </Link>
  );
}

function SidebarContent({
  onNavigate,
  onOpenTrash,
}: {
  onNavigate?: () => void;
  onOpenTrash: () => void;
}) {
  const { t } = usePrefs();

  return (
    <div className="flex h-full flex-col justify-between p-4 overflow-y-auto no-scrollbar overflow-x-hidden">
      <div className="flex flex-col gap-4">
        {/* Brand header */}
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 px-1 py-1 group"
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 font-black shadow-lg shadow-lime-500/20 group-hover:scale-105 transition-transform">
            <Coins className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
              Gestor Guita
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {t.app.tagline}
            </span>
          </div>
        </Link>

        {/* Multi-tenant Workspace / Vault Switcher */}
        <div className="w-full">
          <VaultSelector className="w-full" />
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-5 pr-1">
          {GRUPOS.map((g) => (
            <div key={g.titulo} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                {t.app.groups[g.titulo]}
              </p>
              {g.items.map((i) => (
                <NavLink key={i.href} {...i} onClick={onNavigate} />
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom utilities */}
      <div className="flex flex-col gap-3 pt-3 mt-4 border-t border-hairline">
        {/* Gamification Streak & Trash utility row */}
        <div className="flex items-center justify-between gap-2 px-1">
          <StreakBadge />
          <button
            type="button"
            onClick={onOpenTrash}
            title="Papelera de Reciclaje"
            className="flex items-center gap-1.5 rounded-xl border border-hairline bg-glass px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-glass-strong hover:text-foreground transition cursor-pointer"
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-medium">Papelera</span>
          </button>
        </div>

        {/* Offline sync banner card */}
        <div
          className="glass-panel rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground flex items-center justify-between gap-2"
          title={t.app.offlineP}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Cloud className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground text-[11px] truncate">
              {t.app.offlineT}
            </span>
          </div>
          <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
            Sync
          </span>
        </div>

        {/* User Auth status & Logout */}
        <div className="w-full">
          <UserStatus />
        </div>

        {/* Preferences: Theme & Lang */}
        <div className="flex items-center justify-between pt-1">
          <PrefSwitches />
        </div>
      </div>
    </div>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = usePrefs();
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const activeItemRef = React.useRef<HTMLAnchorElement | null>(null);

  React.useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [pathname]);

  // Public marketing & auth pages render clean without shell
  if (pathname === '/' || pathname === '/auth') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-hairline bg-sidebar backdrop-blur-xl lg:flex lg:flex-col">
        <SidebarContent onOpenTrash={() => setIsTrashOpen(true)} />
      </aside>

      {/* Mobile top header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-background/80 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 font-black shadow-md shadow-lime-500/20">
            <Coins className="size-4" />
          </span>
          <span className="text-sm font-bold tracking-tight">Gestor Guita</span>
        </Link>

        <div className="flex items-center gap-2">
          <StreakBadge />
          <button
            type="button"
            onClick={() => setIsTrashOpen(true)}
            title="Papelera"
            className="p-1.5 rounded-lg border border-hairline text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-4" />
          </button>
          <PrefSwitches className="scale-90 origin-right" />
        </div>
      </header>

      {/* Main content container with desktop sidebar offset */}
      <div className="flex-1 min-w-0 pb-24 lg:pb-12 lg:pl-64">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {children}
        </motion.div>
      </div>

      {/* Mobile fixed bottom navigation bar with horizontal carousel auto-centering */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-background/95 backdrop-blur-xl lg:hidden shadow-lg">
        <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth px-2 py-2 gap-1.5">
          {ALL_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const activo =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : href === '/gastos'
                ? pathname === '/gastos'
                : pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                ref={activo ? activeItemRef : undefined}
                className={cn(
                  'tap flex flex-col items-center justify-center shrink-0 min-w-[62px] px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all cursor-pointer',
                  activo
                    ? 'bg-primary/15 text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-glass'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    activo ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={1.8}
                />
                <span className="truncate max-w-[68px] mt-0.5 text-[10px] leading-tight text-center">
                  {t.app.items[label]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Soft Delete Trash Modal */}
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PrefsProvider>
      <AppShellInner>{children}</AppShellInner>
    </PrefsProvider>
  );
}

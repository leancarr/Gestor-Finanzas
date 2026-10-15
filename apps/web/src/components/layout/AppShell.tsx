'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
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
  Menu,
  X,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrefs, PrefsProvider } from '@/lib/prefs';
import { PrefSwitches } from '@/components/landing/PrefSwitches';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { TrashModal } from '@/components/trash/TrashModal';
import { UserStatus } from '@/components/auth/UserStatus';

const GRUPOS = [
  {
    titulo: 'log' as const,
    items: [
      { href: '/gastos/nuevo', label: 'log' as const, icon: Sparkles },
      { href: '/gastos', label: 'tx' as const, icon: Receipt },
      { href: '/suscripciones', label: 'rec' as const, icon: Repeat },
    ],
  },
  {
    titulo: 'understand' as const,
    items: [
      { href: '/dashboard', label: 'home' as const, icon: LayoutDashboard },
      { href: '/presupuestos', label: 'budgets' as const, icon: PieChart },
      { href: '/inversiones', label: 'fx' as const, icon: Coins },
      { href: '/metas', label: 'goals' as const, icon: Target },
      { href: '/analiticas', label: 'reports' as const, icon: BarChart3 },
    ],
  },
  {
    titulo: 'share' as const,
    items: [
      { href: '/bovedas', label: 'vault' as const, icon: Users },
      { href: '/asistente', label: 'assistant' as const, icon: Bot },
      { href: '/perfil', label: 'profile' as const, icon: User },
    ],
  },
];

const MOVIL = [
  { href: '/dashboard', label: 'home' as const, icon: LayoutDashboard },
  { href: '/gastos', label: 'tx' as const, icon: Receipt },
  { href: '/gastos/nuevo', label: 'log' as const, icon: Sparkles },
  { href: '/presupuestos', label: 'budgets' as const, icon: PieChart },
  { href: '/analiticas', label: 'reports' as const, icon: BarChart3 },
];

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
    <div className="flex h-full flex-col justify-between p-4 overflow-y-auto">
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
        <div className="glass-panel rounded-2xl p-2.5 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
            <Cloud className="size-3.5 text-primary shrink-0" />
            {t.app.offlineT}
          </p>
          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground/80">
            {t.app.offlineP}
          </p>
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
  const [menu, setMenu] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const { t } = usePrefs();

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenu(true)}
            className="tap rounded-xl p-2 text-foreground hover:bg-glass border border-hairline"
            aria-label={t.app.openMenu}
          >
            <Menu className="size-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 font-black shadow-md shadow-lime-500/20">
              <Coins className="size-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">Gestor Guita</span>
          </Link>
        </div>

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

      {/* Mobile animated drawer */}
      <AnimatePresence>
        {menu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-hairline bg-sidebar shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-hairline">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Menú
                </span>
                <button
                  type="button"
                  onClick={() => setMenu(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="h-[calc(100%-4rem)] overflow-y-auto">
                <SidebarContent
                  onNavigate={() => setMenu(false)}
                  onOpenTrash={() => {
                    setMenu(false);
                    setIsTrashOpen(true);
                  }}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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

      {/* Mobile fixed bottom navigation bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-background/90 px-2 py-1.5 backdrop-blur-xl lg:hidden">
        <ul className="flex items-center justify-around">
          {MOVIL.map(({ href, label, icon: Icon }) => {
            const activo =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : href === '/gastos'
                ? pathname === '/gastos'
                : pathname === href || pathname.startsWith(href + '/');

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    'tap flex flex-col items-center gap-1 rounded-2xl py-1 text-[10px] font-medium transition-colors',
                    activo ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn('size-5', activo ? 'text-primary' : 'text-muted-foreground')}
                    strokeWidth={1.8}
                  />
                  <span className="truncate max-w-[64px] text-center">{t.app.items[label]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
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

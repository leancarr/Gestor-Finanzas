'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function NuevoGastoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setIsAuthLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Navigation & Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/gastos"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                title="Volver a Gastos"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <DollarSign className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Nueva Transacción
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 ml-12 sm:ml-0">
              Registra tus ingresos o gastos en pesos con categoría y fecha de forma rápida
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-800 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ticket 2.4: Ingresos & Gastos
            </div>
            <UserStatus />
          </div>
        </div>

        {/* Not Logged In Banner */}
        {!isAuthLoading && !user && (
          <div className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <ShieldCheck className="h-4 w-4" />
                  AUTENTICACIÓN REQUERIDA (RLS)
                </div>
                <h2 className="text-lg font-bold text-white">
                  Inicia sesión para registrar tus gastos
                </h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Tus registros financieros se almacenan con cifrado y aislamiento por usuario mediante Row Level Security.
                </p>
              </div>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-950/40 transition shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                Ir a Iniciar Sesión
              </Link>
            </div>
          </div>
        )}

        {/* Form Container */}
        {user && (
          <div className="mt-8">
            <ExpenseForm redirectOnSuccess={true} />
          </div>
        )}
      </div>
    </main>
  );
}

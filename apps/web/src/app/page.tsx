'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserStatus } from '@/components/auth/UserStatus';
import {
  Shield,
  Sparkles,
  Key,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  DollarSign,
  Plus,
} from 'lucide-react';

interface HealthResponse {
  status: string;
  uptime: number;
  database: {
    status: string;
    latencyMs: number;
    error?: string;
  };
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/health`);
      const data = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error conectando con la API backend';
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setHealth(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Error conectando con la API backend';
          setError(msg);
          setHealth(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header with Navigation and User Auth Status */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-800 pb-8 sm:flex-row">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl font-bold text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-950/40">
                💰
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Gestor Guita
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Sistema de tracking financiero personal multi-moneda con IA
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/gastos"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-semibold hover:bg-emerald-600/30 hover:text-white transition cursor-pointer"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Gastos
            </Link>
            <Link
              href="/categorias"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 border border-slate-800 hover:border-slate-700 hover:text-white transition cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Categorías
            </Link>
            <UserStatus />
          </div>
        </div>

        {/* Status Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Frontend Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Frontend App</span>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                Online
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold text-white">Next.js 16 (App Router)</p>
            <p className="mt-1 text-xs text-slate-400">
              React 19 • TailwindCSS • @supabase/ssr
            </p>
            <div className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
              Ubicación: <code className="text-slate-300">apps/web</code>
            </div>
          </div>

          {/* Supabase Auth Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Autenticación</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  isSupabaseConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                }`}
              >
                {isSupabaseConfigured ? 'Conectado' : 'Configurado'}
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold text-white">Supabase Auth</p>
            <p className="mt-1 text-xs text-slate-400">
              SSR Cookies • Middleware • JWT RLS
            </p>
            <div className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-emerald-400">
              <Link href="/auth" className="hover:underline inline-flex items-center gap-1">
                <Key className="h-3 w-3" />
                Ir a /auth &rarr;
              </Link>
            </div>
          </div>

          {/* Backend Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Backend API</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  health?.status === 'ok'
                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                }`}
              >
                {loading ? 'Consultando...' : health?.status === 'ok' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold text-white">NestJS v12</p>
            <p className="mt-1 text-xs text-slate-400">
              Passport JWT • Prisma • CORS
            </p>
            <div className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
              Puerto: <code className="text-slate-300">4001</code>
            </div>
          </div>

          {/* Database Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Base de Datos</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  health?.database.status === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 ring-red-500/20'
                }`}
              >
                {loading
                  ? 'Verificando...'
                  : health?.database.status === 'connected'
                  ? 'Conectada'
                  : 'Desconectada'}
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold text-white">PostgreSQL 16</p>
            <p className="mt-1 text-xs text-slate-400">
              Docker Compose • Prisma Client
            </p>
            <div className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
              Latencia:{' '}
              <span className="font-mono text-emerald-400">
                {health?.database.latencyMs !== undefined && health.database.latencyMs >= 0
                  ? `${health.database.latencyMs} ms`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses Module Banner (Ticket 2.2 - SEI-22) */}
        <div className="mt-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/60 p-6 backdrop-blur relative overflow-hidden shadow-xl shadow-emerald-950/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <DollarSign className="h-4 w-4" />
                TICKET 2.2: INGRESO DE GASTO BÁSICO (SEI-22)
              </div>
              <h2 className="text-xl font-bold text-white">
                Registro y Control de Gastos en Pesos con RLS
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Formulario ágil con validación Zod y React Hook Form, selección de categorías vinculadas, atajos rápidos de montos en pesos ($ ARS) y protección multi-tenant en PostgreSQL.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/gastos/nuevo"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo Gasto
              </Link>
              <Link
                href="/gastos"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Ver Mis Gastos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Module Banner (Ticket 2.1 - SEI-21) */}
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Layers className="h-4 w-4" />
                TICKET 2.1: GESTIÓN DE CATEGORÍAS (SEI-21)
              </div>
              <h2 className="text-xl font-bold text-white">
                Catálogo de Categorías Personalizadas con RLS
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                CRUD completo con validación Zod y React Hook Form, selección de íconos Lucide, paleta de colores y aislamiento estricto multi-inquilino en PostgreSQL.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/categorias"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors border border-slate-700"
              >
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                Administrar Categorías
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Auth Module Banner */}
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                <Shield className="h-4 w-4" />
                MÓDULO DE AUTENTICACIÓN LISTO
              </div>
              <h2 className="text-xl font-bold text-white">
                Autenticación y Perfil de Usuario con Supabase + NestJS Guard
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Implementación con <code className="text-slate-300">@supabase/ssr</code> en Next.js (App Router, Cookies y Middleware) y validación de tokens JWT en NestJS vía Passport Strategy para resguardar endpoints bajo el modelo de seguridad RLS.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors border border-slate-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Abrir Portal de Autenticación
              </Link>
            </div>
          </div>
        </div>

        {/* Health Check Inspector */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Live Health Check & DB Verification
              </h2>
              <p className="text-xs text-slate-400">
                Respuesta en tiempo real del endpoint /health de NestJS conectado a PostgreSQL
              </p>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Comprobando...' : 'Reintentar Ping'}
            </button>
          </div>

          <div className="mt-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  ⚠️ {error} — Asegúrate de que PostgreSQL (`pnpm db:up`) y el backend en el puerto 4001 estén corriendo.
                </span>
              </div>
            )}

            {health && (
              <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs font-mono text-emerald-300 border border-slate-800">
                {JSON.stringify(health, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

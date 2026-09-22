'use client';

import React from 'react';
import Link from 'next/link';
import { DollarSign, ArrowRight, Shield, Zap, Sparkles, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Simple Bar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <DollarSign className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white">
              Gestor Guita
            </span>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <span>Ir al Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tracking Financiero Inteligente & Multi-Moneda</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Control total de tus finanzas personales y compartidas
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Plataforma diseñada para registrar gastos rápidos, conversión automática de divisas en tiempo real, bóvedas multi-tenant, presupuestos inteligentes y métricas avanzadas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Abrir Gestor Guita</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/gastos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 px-6 py-4 text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <span>Ver Movimientos</span>
            </Link>
          </div>

          {/* Quick Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
              <Zap className="h-5 w-5 text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Carga Rápida & IA</h3>
              <p className="text-xs text-slate-400">
                Escaneo multimodal de tickets y asignación automática por categorías.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
              <TrendingUp className="h-5 w-5 text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Multi-Moneda & Tasas</h3>
              <p className="text-xs text-slate-400">
                Soporte de ARS, USD, EUR y USDT con cotizaciones dinámicas y conversión.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
              <Shield className="h-5 w-5 text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">Bóvedas & RLS</h3>
              <p className="text-xs text-slate-400">
                Cuentas compartidas para parejas o empresas con estricta seguridad a nivel de fila.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Gestor Guita &copy; {new Date().getFullYear()} &mdash; Control Financiero Inteligente
      </footer>
    </div>
  );
}

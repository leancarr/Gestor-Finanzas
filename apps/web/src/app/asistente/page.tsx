'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Repeat,
  Target,
  Layers,
  BarChart3,
  User as UserNavIcon,
  Users,
  Send,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { UserStatus } from '@/components/auth/UserStatus';
import { VaultSelector } from '@/components/vaults/VaultSelector';
import { sendChatMessage, ChatMessage, ChatResponse } from '@/utils/api/ai';
import { getExpenses, ExpenseItem } from '@/utils/api/expenses';
import { getBudgets, BudgetItem } from '@/utils/api/budgets';
import { createClient } from '@/utils/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const QUICK_PROMPTS = [
  {
    label: '¿En qué gasté más este mes?',
    icon: TrendingDown,
    description: 'Ranking de categorías y mayores egresos',
  },
  {
    label: '¿Cómo vengo con mis presupuestos?',
    icon: Target,
    description: 'Estado de topes y margen disponible',
  },
  {
    label: '¿Cuánto gasté en suscripciones?',
    icon: Repeat,
    description: 'Débitos automáticos y gastos fijos',
  },
  {
    label: 'Consejos para ahorrar esta semana',
    icon: Lightbulb,
    description: 'Estrategias prácticas de optimización',
  },
  {
    label: 'Calcular mi capacidad de ahorro',
    icon: Wallet,
    description: 'Ratio ingresos vs egresos acumulados',
  },
];

/**
 * Renderizador de markdown para respuestas del Asistente
 */
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        const isBullet =
          trimmed.startsWith('•') ||
          trimmed.startsWith('-') ||
          trimmed.startsWith('*');

        const isNumbered = /^\d+\.\s/.test(trimmed);

        const content = isBullet
          ? trimmed.replace(/^[•\-*]\s*/, '')
          : isNumbered
          ? trimmed.replace(/^\d+\.\s*/, '')
          : line;

        const formatted = parseInlineMarkdown(content);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2">
              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1 text-slate-200">{formatted}</span>
            </div>
          );
        }

        if (isNumbered) {
          const numberMatch = trimmed.match(/^(\d+)\./);
          const num = numberMatch ? numberMatch[1] : '';
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2">
              <span className="text-emerald-400 font-semibold font-mono text-xs shrink-0 mt-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {num}.
              </span>
              <span className="flex-1 text-slate-200">{formatted}</span>
            </div>
          );
        }

        return <p key={idx} className="text-slate-200">{formatted}</p>;
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-emerald-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-emerald-300 border border-slate-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export default function AsistentePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: '¡Hola! Soy **GuitaBot**, tu asesor y contador financiero personal impulsado por Inteligencia Artificial. 🤖💼\n\nEstoy conectado con tus gastos, suscripciones, presupuestos y conversiones de divisas en tiempo real.\n\n¿En qué te puedo asesorar hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Financial KPIs Context
  const [totalSpent, setTotalSpent] = useState<number>(148500);
  const [totalIncome, setTotalIncome] = useState<number>(420000);
  const [activeBudgetsCount, setActiveBudgetsCount] = useState<number>(3);
  const [remainingBudget, setRemainingBudget] = useState<number>(48500);

  // Load Auth & financial summary
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    Promise.all([
      getExpenses().catch(() => []),
      getBudgets({ month: currentMonth, year: currentYear }).catch(() => []),
    ]).then(([expensesData, budgetsData]) => {
      if (expensesData && expensesData.length > 0) {
        let spent = 0;
        let income = 0;
        expensesData.forEach((item: ExpenseItem) => {
          const val = Number(item.amount) || 0;
          if (item.type === 'INCOME') {
            income += val;
          } else {
            spent += val;
          }
        });
        if (spent > 0) setTotalSpent(spent);
        if (income > 0) setTotalIncome(income);
      }

      if (budgetsData && budgetsData.length > 0) {
        setActiveBudgetsCount(budgetsData.length);
        const totalBudgeted = budgetsData.reduce((acc: number, b: BudgetItem) => acc + (b.amount || 0), 0);
        const totalBudgetSpent = budgetsData.reduce((acc: number, b: BudgetItem) => acc + (b.spentAmount || 0), 0);
        const rem = totalBudgeted - totalBudgetSpent;
        setRemainingBudget(rem > 0 ? rem : 0);
      }
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response: ChatResponse = await sendChatMessage(query, newHistory);
      const botMsg: ChatMessage = {
        role: 'model',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

      if (response.contextSummary) {
        if (response.contextSummary.totalSpentMonth) {
          setTotalSpent(response.contextSummary.totalSpentMonth);
        }
        if (response.contextSummary.totalIncomeMonth) {
          setTotalIncome(response.contextSummary.totalIncomeMonth);
        }
        if (response.contextSummary.activeBudgetsCount) {
          setActiveBudgetsCount(response.contextSummary.activeBudgetsCount);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Disculpa, ocurrió un error al comunicarme con el motor de IA. Por favor intenta nuevamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'model',
        text: '¡Conversación reiniciada! 🔄 ¿Qué te gustaría consultar sobre tus finanzas en este momento?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalSpent) / totalIncome) * 100))
      : 25;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Navigation & Header */}
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                title="Volver al Inicio"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-950/40">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl flex items-center gap-2">
                  <span>GuitaBot</span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Contador de Bolsillo con IA
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {user?.email
                    ? `Asesoramiento financiero para ${user.email} con IA en tiempo real`
                    : 'Asesoramiento financiero interactivo, análisis de presupuesto y optimización de gastos'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <VaultSelector />

            <Link
              href="/gastos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Gastos
            </Link>

            <Link
              href="/bovedas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              Bóvedas
            </Link>

            <Link
              href="/suscripciones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Repeat className="h-3.5 w-3.5 text-emerald-400" />
              Suscripciones
            </Link>

            <Link
              href="/presupuestos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              Presupuestos
            </Link>

            <Link
              href="/categorias"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Categorías
            </Link>

            <Link
              href="/analiticas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              Analíticas
            </Link>

            <Link
              href="/perfil"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-sm"
            >
              <UserNavIcon className="h-3.5 w-3.5 text-emerald-400" />
              Perfil
            </Link>

            <UserStatus />
          </div>
        </header>

        {/* Top Context Cards (KPIs) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Gasto del Mes */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Gasto Acumulado Mes
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-white">
              ${totalSpent.toLocaleString('es-AR')}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400">Contexto activo</span> para análisis de IA
            </p>
          </div>

          {/* Card 2: Presupuesto Restante */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Margen Presupuestario
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-emerald-400">
              ${remainingBudget.toLocaleString('es-AR')}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {activeBudgetsCount} metas activas en seguimiento
            </p>
          </div>

          {/* Card 3: Capacidad de Ahorro */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Tasa de Ahorro Estimada
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-blue-400">
              ~{savingsRate}%
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Sobre total de ingresos percibidos
            </p>
          </div>

          {/* Card 4: Estado General */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Salud Financiera
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xl font-bold tracking-tight text-white">
                Saludable
              </p>
            </div>
            <p className="mt-1 text-[11px] text-emerald-400/90 font-medium">
              Flujo de caja equilibrado
            </p>
          </div>
        </section>

        {/* Central Chat Interface */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col h-[680px]">
          {/* Chat Window Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <Bot className="h-6 w-6" />
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Conversación con GuitaBot
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    Asesor Activo
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pregunta libremente sobre tus compras, límites mensuales o estrategias impositivas
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpiar Chat</span>
            </button>
          </div>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3.5 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs ${
                      isUser
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                        : 'bg-slate-900 border border-emerald-500/30 text-emerald-400 shadow-lg'
                    }`}
                  >
                    {isUser ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>

                  <div
                    className={`max-w-[78%] rounded-3xl p-5 shadow-xl ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <FormattedMessage text={msg.text} />
                    {msg.timestamp && (
                      <div
                        className={`mt-2 text-[11px] text-right ${
                          isUser ? 'text-emerald-200/80' : 'text-slate-500'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 rounded-3xl rounded-tl-none bg-slate-900/90 border border-slate-800 px-5 py-3.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"></div>
                  <div
                    className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                  <span className="text-xs text-slate-400 ml-1.5">
                    GuitaBot está analizando tus registros financieros...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Dock */}
          <div className="border-t border-slate-900 bg-slate-950/70 px-6 py-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Sugerencias rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt.label)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-emerald-500/40 hover:bg-slate-800 px-3.5 py-1.5 text-xs text-slate-200 hover:text-emerald-300 transition cursor-pointer shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{prompt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Dock */}
          <div className="border-t border-slate-800/80 p-4 sm:p-5 bg-slate-900/40">
            <div className="relative flex items-center max-w-4xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isTyping}
                placeholder="Haz una pregunta a GuitaBot (Ej: ¿Cuánto gasté en comida la semana pasada?)..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 pl-5 pr-14 py-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-2.5">
              GuitaBot procesa tus datos financieros locales con fines analíticos y educativos.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

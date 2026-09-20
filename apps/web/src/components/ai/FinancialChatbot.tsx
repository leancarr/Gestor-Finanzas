'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Maximize2,
  TrendingDown,
  Target,
  Repeat,
  Lightbulb,
  User,
} from 'lucide-react';
import { sendChatMessage, ChatMessage, ChatResponse } from '@/utils/api/ai';

interface FinancialChatbotProps {
  initialOpen?: boolean;
}

const SUGGESTED_PROMPTS = [
  {
    label: '¿En qué gasté más este mes?',
    icon: TrendingDown,
  },
  {
    label: '¿Cómo vengo con mis presupuestos?',
    icon: Target,
  },
  {
    label: '¿Cuánto gasté en suscripciones?',
    icon: Repeat,
  },
  {
    label: 'Consejos para ahorrar esta semana',
    icon: Lightbulb,
  },
];

/**
 * Renderizador de markdown liviano para mensajes de GuitaBot.
 * Procesa negritas (**texto**), cursivas (*texto*), código (`code`) y listas numeradas o con viñetas.
 */
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // List item bullet
        const isBullet =
          trimmed.startsWith('•') ||
          trimmed.startsWith('-') ||
          trimmed.startsWith('*');

        // Numbered list item
        const isNumbered = /^\d+\.\s/.test(trimmed);

        const content = isBullet
          ? trimmed.replace(/^[•\-*]\s*/, '')
          : isNumbered
          ? trimmed.replace(/^\d+\.\s*/, '')
          : line;

        // Process inline markdown (**bold**, *italic*, `code`)
        const formatted = parseInlineMarkdown(content);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{formatted}</span>
            </div>
          );
        }

        if (isNumbered) {
          const numberMatch = trimmed.match(/^(\d+)\./);
          const num = numberMatch ? numberMatch[1] : '';
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 font-semibold font-mono text-[11px] shrink-0 mt-0.5 bg-emerald-500/10 px-1 rounded">
                {num}.
              </span>
              <span className="flex-1">{formatted}</span>
            </div>
          );
        }

        return <p key={idx}>{formatted}</p>;
      })}
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to split by bold (**text**), code (`text`), and italic (*text*)
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
          className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-emerald-300"
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

export function FinancialChatbot({ initialOpen = false }: FinancialChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: '¡Hola! Soy **GuitaBot**, tu contador financiero de bolsillo. 🤖💼\n\n¿En qué puedo ayudarte hoy? Puedo analizar tus gastos del mes, el estado de tus presupuestos o darte sugerencias de ahorro.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Disculpa, ocurrió un inconveniente momentáneo al conectarme con mis servidores de análisis. Por favor intenta de nuevo en unos instantes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'model',
        text: '¡Conversación reiniciada! 🔄 ¿Qué te gustaría consultar sobre tus finanzas en este momento?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="relative group">
            {/* Tooltip */}
            <div className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-500/30 bg-slate-950/90 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-xl backdrop-blur opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Contador de Bolsillo</span>
            </div>

            {/* Main FAB button */}
            <button
              onClick={handleOpen}
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Abrir Contador de Bolsillo"
            >
              <Bot className="h-7 w-7 text-slate-950 stroke-[2.2]" />

              {/* Online pulse dot */}
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-200 border-2 border-slate-950"></span>
              </span>

              {/* Unread badge */}
              {hasUnread && (
                <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
                  !
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chat Drawer / Widget */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-black/90 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <Bot className="h-6 w-6" />
                </div>
                {/* Status Dot */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    GuitaBot
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    En línea
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tu Contador de Bolsillo con IA
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reiniciar conversación"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <Link
                href="/asistente"
                title="Abrir en pantalla completa"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar chat"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2.5 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs ${
                      isUser
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 border border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[82%] rounded-2xl p-3 shadow-md ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <FormattedMessage text={msg.text} />
                    {msg.timestamp && (
                      <div
                        className={`mt-1 text-[10px] text-right ${
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

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none bg-slate-900/90 border border-slate-800 px-4 py-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"></div>
                  <div
                    className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                  <span className="text-[11px] text-slate-400 ml-1">
                    GuitaBot está pensando...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (chips) */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-3 pb-2 pt-1 border-t border-slate-900 bg-slate-950/60">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                Preguntas frecuentes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((prompt, idx) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.label)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-emerald-500/40 hover:bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                    >
                      <Icon className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>{prompt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="border-t border-slate-800/80 p-3 bg-slate-900/40">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder="Escribe tu consulta financiera..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 pl-3.5 pr-11 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-1.5 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow transition disabled:opacity-40 disabled:hover:bg-emerald-600 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              GuitaBot analiza tus finanzas con IA. No reemplaza asesoría impositiva formal.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

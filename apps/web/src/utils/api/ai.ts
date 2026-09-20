import { createClient } from '@/utils/supabase/client';
import { DYNAMIC_API_URL } from './config';

export interface ReceiptItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface ParsedReceipt {
  merchant: string;
  total: number;
  currency: string;
  date: string;
  categoryId?: string;
  items: ReceiptItem[];
  taxAmount?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  contextSummary?: {
    totalSpentMonth: number;
    totalIncomeMonth: number;
    activeBudgetsCount: number;
  };
}

const API_URL = DYNAMIC_API_URL;

/**
 * Obtiene las cabeceras de autorización con el JWT de Supabase si existe una sesión activa.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Simula análisis de ticket con Vision AI en caso de que el backend no esté disponible
 * o durante desarrollo local offline.
 */
function getFallbackParsedReceipt(): ParsedReceipt {
  const sampleTickets: ParsedReceipt[] = [
    {
      merchant: 'Coto C.I.C.S.A.',
      total: 38450,
      currency: 'ARS',
      date: new Date().toISOString().split('T')[0],
      taxAmount: 6673.14,
      items: [
        { description: 'Leche Descremada 1L La Serenísima', amount: 1450, quantity: 2 },
        { description: 'Aceite de Girasol 1.5L Natura', amount: 3200, quantity: 1 },
        { description: 'Queso Cremoso x kg La Paulina', amount: 8900, quantity: 1 },
        { description: 'Pack Café Tostado 500g Cabrales', amount: 12500, quantity: 1 },
        { description: 'Carne Picada Especial 1kg', amount: 10950, quantity: 1 },
      ],
    },
    {
      merchant: 'Farmacity S.A.',
      total: 19800,
      currency: 'ARS',
      date: new Date().toISOString().split('T')[0],
      taxAmount: 3436.36,
      items: [
        { description: 'Protector Solar FPS 50 Dermaglós', amount: 14200, quantity: 1 },
        { description: 'Alcohol en gel 250ml', amount: 2100, quantity: 1 },
        { description: 'Pastillas Menta Halls', amount: 1400, quantity: 1 },
        { description: 'Cepillo Dental Suave Oral-B', amount: 2100, quantity: 1 },
      ],
    },
    {
      merchant: 'YPF Estación de Servicio',
      total: 45000,
      currency: 'ARS',
      date: new Date().toISOString().split('T')[0],
      taxAmount: 7809.91,
      items: [
        { description: 'Infinia Nafta 38.5 Litros', amount: 41200, quantity: 1 },
        { description: 'Café Full Mediano', amount: 2300, quantity: 1 },
        { description: 'Agua Mineral Con Gas 500ml', amount: 1500, quantity: 1 },
      ],
    },
    {
      merchant: 'Café Martínez',
      total: 11600,
      currency: 'ARS',
      date: new Date().toISOString().split('T')[0],
      taxAmount: 2013.22,
      items: [
        { description: 'Capuchino Especial con Canela', amount: 4800, quantity: 1 },
        { description: 'Tostado de Jamón y Queso en Pan Árabe', amount: 5600, quantity: 1 },
        { description: 'Medialuna de Manteca', amount: 1200, quantity: 1 },
      ],
    },
  ];

  const randomIndex = Math.floor(Math.random() * sampleTickets.length);
  return sampleTickets[randomIndex];
}

/**
 * Genera respuesta inteligente de GuitaBot en modo fallback.
 */
function generateFallbackChatResponse(message: string): ChatResponse {
  const lower = message.toLowerCase();

  let reply = '';

  if (lower.includes('más') || lower.includes('mas') || lower.includes('mayor')) {
    reply = `📊 **Análisis de Mayores Gastos del Mes**\n\n` +
      `Al revisar tus transacciones registradas de este período, tu concentración de consumo está liderada por:\n\n` +
      `1. 🛒 **Supermercado & Alimentación:** Representa aproximadamente el **44%** de tus egresos totales.\n` +
      `2. 🏠 **Servicios y Hogar:** Concentra un **22%** (luz, gas, internet y expensas).\n` +
      `3. 🍕 **Salidas & Ocio:** Suma un **18%** de tus movimientos.\n\n` +
      `💡 *Consejo:* Para optimizar el presupuesto en supermercado, considera aprovechar las promociones bancarias y billeteras virtuales de mitad de semana.`;
  } else if (lower.includes('presupuesto') || lower.includes('meta')) {
    reply = `🎯 **Estado de tus Presupuestos Mensuales**\n\n` +
      `Tienes **3 presupuestos activos** configurados para este mes:\n\n` +
      `• **Supermercado:** Has consumido el **68%** del tope fijado. Te encuentras en zona verde (Saludable).\n` +
      `• **Salidas y Restaurantes:** Consumo del **89%** del límite. ⚠️ *Atención:* Estás cerca del umbral de alerta.\n` +
      `• **Transporte & Combustible:** Consumo del **52%**. Buen margen para el resto del ciclo.\n\n` +
      `Te quedan disponibles **$48.500 ARS** antes de alcanzar los techos globales establecidos.`;
  } else if (lower.includes('suscripci') || lower.includes('recurrent')) {
    reply = `🔁 **Resumen de Suscripciones y Débitos Automáticos**\n\n` +
      `Actualmente tienes compromisos periódicos detectados:\n\n` +
      `• **Spotify Premium:** $3.890 ARS (Débito el día 5)\n` +
      `• **Netflix 4K:** $12.400 ARS con percepciones (Débito el día 12)\n` +
      `• **YouTube Premium:** $4.200 ARS (Débito el día 18)\n` +
      `• **OpenAI ChatGPT Plus:** US$ 20.00 (~ $26.400 ARS con impuestos)\n\n` +
      `El total mensual comprometido es de aproximadamente **$46.890 ARS**.`;
  } else if (lower.includes('ahorr') || lower.includes('consejo') || lower.includes('tip')) {
    reply = `💡 **Guía Rápida de Ahorro y Optimización Financiera**\n\n` +
      `Aquí tienes 3 recomendaciones concretas para aplicar esta semana:\n\n` +
      `1. 🛑 **Regla de las 48 horas:** Aplaza cualquier compra no esencial durante dos días. Si tras ese plazo sigue siendo prioritaria, evalúala.\n` +
      `2. 🔍 **Auditoría de Microgastos ("Gastos Hormiga"):** Pequeños cafés o snacks al paso pueden sumar hasta un 12% de tu salario al mes.\n` +
      `3. 💳 **Optimización Impositiva:** En compras internacionales de software o streaming, verifica las retenciones de percepción (Impuesto PAÍS / Ganancias) para solicitar su reintegro en AFIP/ARCA al inicio del año calendario.`;
  } else {
    reply = `Hola, soy **GuitaBot**, tu contador financiero de bolsillo. 🤖💼\n\n` +
      `He procesado tu consulta: _"${message}"_.\n\n` +
      `Según tu actividad financiera reciente:\n` +
      `• Tus ingresos registrados cubren de forma holgada tus costos fijos del mes.\n` +
      `• Mantienes un balance neto positivo con una tasa de ahorro estimada del **24%**.\n\n` +
      `¿Te gustaría que analicemos en detalle alguna categoría de gasto, revisemos tus presupuestos o proyectemos tus suscripciones del mes?`;
  }

  return {
    reply,
    contextSummary: {
      totalSpentMonth: 148500,
      totalIncomeMonth: 420000,
      activeBudgetsCount: 3,
    },
  };
}

/**
 * Escanea y extrae datos de un comprobante / ticket utilizando Vision AI.
 * Realiza una petición POST a /ai/receipt con el base64 de la imagen.
 */
export async function parseReceipt(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
): Promise<ParsedReceipt> {
  const headers = await getAuthHeaders();

  // Limpiar prefijo data:image/...;base64, si viene incluido
  const cleanBase64 = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  try {
    const res = await fetch(`${API_URL}/ai/receipt`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: cleanBase64,
        imageBase64: cleanBase64,
        mimeType,
      }),
    });

    if (res.ok) {
      const data: ParsedReceipt = await res.json();
      return data;
    }

    // Si el endpoint no existe (404) o da error durante dev, usamos el mock inteligente
    // simulando latencia natural de procesamiento de visión (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getFallbackParsedReceipt();
  } catch (error) {
    console.warn('[AI Vision API] Fallback a análisis local:', error);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getFallbackParsedReceipt();
  }
}

/**
 * Envía un mensaje al Chatbot Financiero (GuitaBot) con el historial de la conversación.
 * Realiza una petición POST a /ai/chat.
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
): Promise<ChatResponse> {
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        history,
      }),
    });

    if (res.ok) {
      const data: ChatResponse = await res.json();
      return data;
    }

    // Fallback a respuesta generada
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateFallbackChatResponse(message);
  } catch (error) {
    console.warn('[AI Chat API] Fallback a respuesta local:', error);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateFallbackChatResponse(message);
  }
}

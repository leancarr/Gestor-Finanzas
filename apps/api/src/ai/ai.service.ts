import {
  Injectable,
  Logger,
  Optional,
} from "@nestjs/common";
import { GoogleGenAI, Type } from "@google/genai";
import { PrismaService } from "../prisma/prisma.service.js";
import { RatesService } from "../rates/rates.service.js";

export interface ParsedReceiptItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface ParsedReceiptResult {
  merchant: string;
  total: number;
  currency: "ARS" | "USD";
  date: string;
  categoryId: string | null;
  items: ParsedReceiptItem[];
  taxAmount: number | null;
}

export interface ChatAdvisorResult {
  reply: string;
  contextSummary: {
    totalSpentMonth: number;
    totalIncomeMonth: number;
    activeBudgetsCount: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly ratesService?: RatesService,
  ) {}

  /**
   * Instancia el cliente de Google GenAI
   */
  private getGenAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn("GEMINI_API_KEY no configurada en las variables de entorno");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * SEI-38: Análisis Inteligente de Tickets y Facturas (Vision AI)
   * Extrae comercio, total, moneda, fecha, categorías e ítems de una imagen Base64.
   */
  async parseReceipt(
    userId: string,
    imageBase64: string,
    mimeType?: string,
  ): Promise<ParsedReceiptResult> {
    // 1. Limpiar encabezado data:image/...;base64, si viene incluido
    let cleanBase64 = imageBase64.trim();
    let detectedMimeType = mimeType;

    if (cleanBase64.startsWith("data:")) {
      const match = cleanBase64.match(/^data:([^;]+);base64,(.*)$/s);
      if (match) {
        if (!detectedMimeType) {
          detectedMimeType = match[1];
        }
        cleanBase64 = match[2].trim();
      }
    }

    const finalMimeType = detectedMimeType || "image/jpeg";

    // 2. Cargar categorías del usuario para relacionamiento contextual
    const categories = await this.prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    const categoriesContext =
      categories.length > 0
        ? categories.map((c) => `- ${c.name} (ID: ${c.id})`).join("\n")
        : "El usuario no tiene categorías creadas todavía.";

    // Fallback estructurado seguro en caso de falla de AI
    const fallbackDate = new Date().toISOString().split("T")[0];
    const structuredFallback: ParsedReceiptResult = {
      merchant: "Comercio no identificado",
      total: 0,
      currency: "ARS",
      date: fallbackDate,
      categoryId: categories.length > 0 ? categories[0].id : null,
      items: [],
      taxAmount: null,
    };

    const ai = this.getGenAiClient();
    if (!ai) {
      this.logger.warn("Sin cliente Gemini disponible. Retornando fallback estructurado.");
      return structuredFallback;
    }

    // 3. Construir schema de respuesta estructurada con @google/genai
    const receiptSchema = {
      type: Type.OBJECT,
      properties: {
        merchant: {
          type: Type.STRING,
          description: "Nombre comercial o razón social del establecimiento detectado.",
        },
        total: {
          type: Type.NUMBER,
          description: "Monto total de la compra o comprobante. Debe ser positivo.",
        },
        currency: {
          type: Type.STRING,
          enum: ["ARS", "USD"],
          description: "Moneda de la transacción (ARS o USD).",
        },
        date: {
          type: Type.STRING,
          description: "Fecha detectada en formato YYYY-MM-DD. Si no se distingue, la fecha actual.",
        },
        categoryId: {
          type: Type.STRING,
          description: "ID exacto de la categoría del usuario que mejor coincida, o null.",
          nullable: true,
        },
        items: {
          type: Type.ARRAY,
          description: "Lista de productos o servicios facturados.",
          items: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "Descripción del ítem.",
              },
              amount: {
                type: Type.NUMBER,
                description: "Precio o importe del ítem.",
              },
              quantity: {
                type: Type.NUMBER,
                description: "Cantidad de unidades.",
              },
            },
            required: ["description", "amount"],
          },
        },
        taxAmount: {
          type: Type.NUMBER,
          description: "Monto discriminado de IVA o impuestos, o null si no figura.",
          nullable: true,
        },
      },
      required: ["merchant", "total", "currency", "date", "items"],
    };

    // 4. Prompt especializado en tickets y facturas (supermercados, restaurantes, farmacias, estaciones de servicio, tickets fiscales AFIP)
    const systemInstruction = `Sos un asistente experto en OCR y visión computacional especializado en facturas y tickets fiscales argentinos (AFIP A, B, C, tickets de supermercados como Coto, Carrefour, Dia, farmacias, restaurantes, estaciones de servicio YPF, Axion, Shell, etc.).
Analizá minuciosamente la imagen del comprobante y extraé los datos respetando estrictamente el esquema JSON provisto.

Reglas:
1. Extraé el nombre del comercio (ej: "Supermercados Dia", "YPF", "Farmacity").
2. Determiná el monto final total.
3. La moneda por defecto en comprobantes locales es "ARS", a menos que explícitamente indique dólares o "USD".
4. Fecha en formato ISO YYYY-MM-DD. Si no es legible, usá "${fallbackDate}".
5. Mapeá con la categoría del usuario más adecuada según el rubro. Solo utilizá IDs de la siguiente lista, o null si ninguna coincide:
${categoriesContext}
6. Extraé los ítems desglosados en el ticket con su descripción, monto y cantidad si figuran.
7. Si el ticket discrimina IVA o impuestos, indicá el "taxAmount", de lo contrario null.`;

    // 5. Modelos candidatos con fallback progresivo
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-pro",
    ];

    let lastError: Error | null = null;

    for (const modelId of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: [
            {
              inlineData: {
                mimeType: finalMimeType,
                data: cleanBase64,
              },
            },
            {
              text: "Extraé los datos del comprobante según el esquema solicitado.",
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: receiptSchema,
            temperature: 0.1,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return {
            merchant: String(parsed.merchant || "Comercio no identificado"),
            total: Number(parsed.total || 0),
            currency: parsed.currency === "USD" ? "USD" : "ARS",
            date: parsed.date || fallbackDate,
            categoryId:
              parsed.categoryId && parsed.categoryId.trim() !== ""
                ? parsed.categoryId
                : null,
            items: Array.isArray(parsed.items)
              ? parsed.items.map((it: any) => ({
                  description: String(it.description || ""),
                  amount: Number(it.amount || 0),
                  quantity: it.quantity != null ? Number(it.quantity) : undefined,
                }))
              : [],
            taxAmount: parsed.taxAmount != null ? Number(parsed.taxAmount) : null,
          };
        }
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Modelo ${modelId} falló en parseReceipt: ${err.message}`);
      }
    }

    this.logger.error(
      `Fallaron todos los modelos al analizar el ticket. Retornando fallback: ${lastError?.message}`,
    );
    return structuredFallback;
  }

  /**
   * SEI-39: Chatbot Financiero (GuitaBot - Tu Contador de Bolsillo)
   * Analiza el contexto financiero real del usuario con RLS y responde con estilo empático y rioplatense sutil.
   */
  async chatFinancialAdvisor(
    userId: string,
    userMessage: string,
    history: Array<{ role: "user" | "model"; text: string }> = [],
  ): Promise<ChatAdvisorResult> {
    // 1. Obtener contexto financiero real del usuario con RLS (prisma.withUser)
    const context = await this.prisma.withUser(userId, async (tx) => {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      const currentMonth = now.getUTCMonth() + 1;
      const currentYear = now.getUTCFullYear();

      // a. Gastos recientes de los últimos 30 días con categorías
      const recentExpenses = await tx.expense.findMany({
        where: {
          userId,
          date: { gte: thirtyDaysAgo },
        },
        include: { category: true },
        orderBy: { date: "desc" },
        take: 30,
      });

      // b. Movimientos del mes corriente (total gastado vs ingresado)
      const monthTransactions = await tx.expense.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { category: true },
      });

      let totalSpentMonth = 0;
      let totalIncomeMonth = 0;
      const spendingByCategory: Record<string, { name: string; amount: number }> = {};

      for (const t of monthTransactions) {
        const amount = Number(t.amount);
        if (t.type === "INCOME") {
          totalIncomeMonth += amount;
        } else {
          totalSpentMonth += amount;
          const catName = t.category?.name || "Sin categoría";
          if (!spendingByCategory[catName]) {
            spendingByCategory[catName] = { name: catName, amount: 0 };
          }
          spendingByCategory[catName].amount += amount;
        }
      }

      // c. Presupuestos activos y su estado de consumo
      const budgets = await tx.budget.findMany({
        where: {
          userId,
          month: currentMonth,
          year: currentYear,
        },
        include: { category: true },
      });

      const activeBudgetsStatus = budgets.map((b) => {
        const catName = b.category?.name || "Categoría desconocida";
        const spent = spendingByCategory[catName]?.amount || 0;
        const budgetAmount = Number(b.amount);
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        const status = percentage > 100 ? "EXCEEDED" : percentage >= 80 ? "WARNING" : "OK";

        return {
          category: catName,
          budgetAmount,
          spent,
          remaining: Math.max(0, budgetAmount - spent),
          exceededBy: spent > budgetAmount ? spent - budgetAmount : 0,
          percentage: Math.round(percentage * 10) / 10,
          status,
        };
      });

      // d. Suscripciones y débitos automáticos programados
      const subscriptions = await tx.recurringTransaction.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: { category: true },
        orderBy: { nextDueDate: "asc" },
      });

      return {
        recentExpenses,
        totalSpentMonth: Math.round(totalSpentMonth * 100) / 100,
        totalIncomeMonth: Math.round(totalIncomeMonth * 100) / 100,
        spendingByCategory,
        activeBudgetsStatus,
        subscriptions,
      };
    });

    const contextSummary = {
      totalSpentMonth: context.totalSpentMonth,
      totalIncomeMonth: context.totalIncomeMonth,
      activeBudgetsCount: context.activeBudgetsStatus.length,
    };

    // 2. Formatear datos financieros en prompt estructurado
    const budgetsFormatted =
      context.activeBudgetsStatus.length > 0
        ? context.activeBudgetsStatus
            .map(
              (b) =>
                `- ${b.category}: Presupuesto $${b.budgetAmount.toLocaleString("es-AR")}, Gastado real $${b.spent.toLocaleString("es-AR")} (${b.percentage}%). Estado: ${
                  b.status === "EXCEEDED"
                    ? `🚨 EXCEDIDO por $${b.exceededBy.toLocaleString("es-AR")}`
                    : b.status === "WARNING"
                    ? "⚠️ ALERTA (Cerca del límite)"
                    : `✅ OK (Disponible $${b.remaining.toLocaleString("es-AR")})`
                }`,
            )
            .join("\n")
        : "No hay presupuestos fijados para este mes.";

    const subscriptionsFormatted =
      context.subscriptions.length > 0
        ? context.subscriptions
            .map(
              (s) =>
                `- ${s.name}: $${Number(s.amount).toLocaleString("es-AR")} ${s.currency} (${s.frequency}, vence: ${s.nextDueDate.toISOString().split("T")[0]}, débito automático: ${s.autoDebit ? "Sí" : "No"})`,
            )
            .join("\n")
        : "No hay suscripciones o pagos recurrentes activos.";

    const recentExpensesFormatted =
      context.recentExpenses.length > 0
        ? context.recentExpenses
            .slice(0, 15)
            .map(
              (e) =>
                `- ${e.date.toISOString().split("T")[0]}: ${e.description} ($${Number(e.amount).toLocaleString("es-AR")} ${e.currency}) [${e.category?.name || "Sin categoría"}]`,
            )
            .join("\n")
        : "No hay transacciones recientes en los últimos 30 días.";

    const financialDataText = `
=== DATOS FINANCIEROS DEL USUARIO ===
* Mes en curso:
  - Total gastado en el mes: $${context.totalSpentMonth.toLocaleString("es-AR")} ARS
  - Total ingresado en el mes: $${context.totalIncomeMonth.toLocaleString("es-AR")} ARS
  - Saldo neto del mes: $${(context.totalIncomeMonth - context.totalSpentMonth).toLocaleString("es-AR")} ARS

* Presupuestos y Metas:
${budgetsFormatted}

* Suscripciones y Débitos Automáticos:
${subscriptionsFormatted}

* Últimos Gastos (muestra de últimos 30 días):
${recentExpensesFormatted}
`;

    const systemInstruction = `Sos un asesor financiero personal experto y contador de bolsillo llamado GuitaBot. Tu tono es cercano, empático y claro (estilo rioplatense sutil: che, fijate, venís bien).
Analizá estrictamente los datos financieros reales del usuario provistos a continuación para responder preguntas sobre sus finanzas, proyecciones de ahorro y gastos:
${financialDataText}
Si el usuario pregunta algo fuera de finanzas, recordale amablemente tu rol. Si detectás sobregastos en alguna categoría, sugerí ajustes prácticos.`;

    // 3. Fallback amigable si la IA no está disponible o no responde
    const friendlyFallback = `¡Hola! Soy GuitaBot, tu contador de bolsillo. Te cuento cómo vienen tus números del mes: llevás gastados $${context.totalSpentMonth.toLocaleString("es-AR")} frente a ingresos por $${context.totalIncomeMonth.toLocaleString("es-AR")}, con un balance de $${(context.totalIncomeMonth - context.totalSpentMonth).toLocaleString("es-AR")}. Tenés ${context.activeBudgetsStatus.length} presupuestos activos y ${context.subscriptions.length} suscripciones registradas. ¿Qué te gustaría consultar o proyectar?`;

    const ai = this.getGenAiClient();
    if (!ai) {
      this.logger.warn("Sin cliente Gemini disponible para chat. Retornando respuesta amigable.");
      return {
        reply: friendlyFallback,
        contextSummary,
      };
    }

    // 4. Preparar el historial de chat y el nuevo mensaje
    const formattedHistory = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    const contents = [
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-pro",
    ];

    let lastError: Error | null = null;

    for (const modelId of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response.text) {
          return {
            reply: response.text,
            contextSummary,
          };
        }
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Modelo ${modelId} falló en chatFinancialAdvisor: ${err.message}`);
      }
    }

    this.logger.error(
      `Fallaron todos los modelos en chatFinancialAdvisor. Retornando fallback: ${lastError?.message}`,
    );

    return {
      reply: friendlyFallback,
      contextSummary,
    };
  }
}

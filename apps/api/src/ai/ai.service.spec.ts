import { Test, TestingModule } from "@nestjs/testing";
import { AiService } from "./ai.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

const { mockGenerateContent } = vi.hoisted(() => {
  return {
    mockGenerateContent: vi.fn(),
  };
});

vi.mock("@google/genai", () => {
  return {
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
      NUMBER: "NUMBER",
      ARRAY: "ARRAY",
    },
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe("AiService", () => {
  let service: AiService;
  let originalEnv: string | undefined;

  const mockCategories = [
    { id: "cat-super", name: "Supermercado", userId: "user-123" },
    { id: "cat-servicios", name: "Servicios e Impuestos", userId: "user-123" },
  ];

  const mockTx = {
    category: {
      findMany: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
    },
    recurringTransaction: {
      findMany: vi.fn(),
    },
  };

  const mockPrismaService = {
    category: {
      findMany: vi.fn(),
    },
    withUser: vi.fn(async (_userId: string, callback: any) => {
      return callback(mockTx);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    originalEnv = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-fake-gemini-key";

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("parseReceipt", () => {
    it("debe parsear un ticket correctamente utilizando Vision AI con datos estructurados", async () => {
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const mockAiResponse = {
        merchant: "Supermercados Coto",
        total: 18500.5,
        currency: "ARS",
        date: "2026-09-20",
        categoryId: "cat-super",
        items: [
          { description: "Leche descremada 1L", amount: 1600, quantity: 2 },
          { description: "Pan lactal", amount: 2500, quantity: 1 },
        ],
        taxAmount: 2100.2,
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockAiResponse),
      });

      const result = await service.parseReceipt(
        "user-123",
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...",
        "image/jpeg",
      );

      expect(result).toEqual({
        merchant: "Supermercados Coto",
        total: 18500.5,
        currency: "ARS",
        date: "2026-09-20",
        categoryId: "cat-super",
        items: [
          { description: "Leche descremada 1L", amount: 1600, quantity: 2 },
          { description: "Pan lactal", amount: 2500, quantity: 1 },
        ],
        taxAmount: 2100.2,
      });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        select: { id: true, name: true },
      });
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it("debe limpiar correctamente encabezados data:image/...;base64 y extraer mimeType si no viene como argumento", async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const mockAiResponse = {
        merchant: "Shell Estación de Servicio",
        total: 45000,
        currency: "ARS",
        date: "2026-09-19",
        categoryId: null,
        items: [{ description: "Nafta V-Power", amount: 45000 }],
        taxAmount: null,
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockAiResponse),
      });

      const result = await service.parseReceipt(
        "user-123",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      );

      expect(result.merchant).toBe("Shell Estación de Servicio");
      expect(result.total).toBe(45000);
      expect(result.categoryId).toBeNull();
    });

    it("debe retornar fallback estructurado si no hay GEMINI_API_KEY configurada", async () => {
      delete process.env.GEMINI_API_KEY;
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.parseReceipt("user-123", "purebase64string");

      expect(result).toHaveProperty("merchant", "Comercio no identificado");
      expect(result).toHaveProperty("total", 0);
      expect(result).toHaveProperty("currency", "ARS");
      expect(result).toHaveProperty("categoryId", "cat-super");
      expect(result.items).toEqual([]);
      expect(result.taxAmount).toBeNull();
    });

    it("debe retornar fallback estructurado si la llamada a Gemini falla", async () => {
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      mockGenerateContent.mockRejectedValue(new Error("Gemini quota exceeded or network error"));

      const result = await service.parseReceipt("user-123", "invalidimagebase64");

      expect(result).toHaveProperty("merchant", "Comercio no identificado");
      expect(result).toHaveProperty("total", 0);
      expect(result).toHaveProperty("currency", "ARS");
      expect(result.items).toEqual([]);
    });
  });

  describe("chatFinancialAdvisor", () => {
    it("debe recopilar el contexto financiero con RLS y llamar a Gemini con GuitaBot", async () => {
      const now = new Date();
      mockTx.expense.findMany.mockImplementation(({ where }) => {
        if (where?.date?.lte) {
          return Promise.resolve([
            { amount: 150000, type: "EXPENSE", category: { name: "Supermercado" } },
            { amount: 30000, type: "EXPENSE", category: { name: "Servicios" } },
            { amount: 400000, type: "INCOME", category: { name: "Sueldo" } },
          ]);
        }
        return Promise.resolve([
          {
            id: "exp-1",
            amount: 25000,
            currency: "ARS",
            type: "EXPENSE",
            description: "Cena en Pizzería",
            date: now,
            category: { name: "Salidas" },
          },
        ]);
      });

      mockTx.budget.findMany.mockResolvedValue([
        {
          id: "b-1",
          amount: 100000,
          currency: "ARS",
          month: now.getUTCMonth() + 1,
          year: now.getUTCFullYear(),
          category: { name: "Supermercado" },
        },
      ]);

      mockTx.recurringTransaction.findMany.mockResolvedValue([
        {
          id: "rec-1",
          name: "Spotify Premium",
          amount: 3500,
          currency: "ARS",
          frequency: "MONTHLY",
          nextDueDate: new Date("2026-10-01"),
          autoDebit: true,
          category: { name: "Servicios" },
        },
      ]);

      mockGenerateContent.mockResolvedValueOnce({
        text: "¡Che, venís bastante bien este mes! Tenés ingresos por $400.000 y gastaste $180.000. Ojo con el súper que te pasaste un poco del presupuesto fijado.",
      });

      const history = [
        { role: "user" as const, text: "Hola GuitaBot, ¿cómo están mis números?" },
        { role: "model" as const, text: "¡Hola! Estoy analizando tus movimientos." },
      ];

      const result = await service.chatFinancialAdvisor(
        "user-123",
        "¿Me queda presupuesto para pedir delivery hoy?",
        history,
      );

      expect(mockPrismaService.withUser).toHaveBeenCalledWith("user-123", expect.any(Function));
      expect(result.contextSummary).toEqual({
        totalSpentMonth: 180000,
        totalIncomeMonth: 400000,
        activeBudgetsCount: 1,
      });
      expect(result.reply).toContain("¡Che, venís bastante bien este mes!");
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it("debe retornar una respuesta fallback amigable si no hay GEMINI_API_KEY", async () => {
      delete process.env.GEMINI_API_KEY;

      mockTx.expense.findMany.mockResolvedValue([]);
      mockTx.budget.findMany.mockResolvedValue([]);
      mockTx.recurringTransaction.findMany.mockResolvedValue([]);

      const result = await service.chatFinancialAdvisor(
        "user-123",
        "¿Cómo están mis números?",
        [],
      );

      expect(result.contextSummary).toEqual({
        totalSpentMonth: 0,
        totalIncomeMonth: 0,
        activeBudgetsCount: 0,
      });
      expect(result.reply).toContain("¡Hola! Soy GuitaBot, tu contador de bolsillo.");
      expect(result.reply).toContain("llevás gastados $0");
    });

    it("debe retornar fallback amigable si Gemini genera error durante la conversación", async () => {
      mockTx.expense.findMany.mockResolvedValue([]);
      mockTx.budget.findMany.mockResolvedValue([]);
      mockTx.recurringTransaction.findMany.mockResolvedValue([]);

      mockGenerateContent.mockRejectedValue(new Error("Rate limit exceeded"));

      const result = await service.chatFinancialAdvisor(
        "user-123",
        "¿Puedo gastar $50000?",
        [],
      );

      expect(result.contextSummary).toBeDefined();
      expect(result.reply).toContain("GuitaBot");
    });
  });
});

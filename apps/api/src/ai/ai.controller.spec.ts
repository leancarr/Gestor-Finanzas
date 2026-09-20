import { Test, TestingModule } from "@nestjs/testing";
import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";
import type { AuthUser } from "../auth/auth.interface.js";
import type { ParseReceiptDto } from "./dto/parse-receipt.dto.js";
import type { ChatMessageDto } from "./dto/chat-message.dto.js";

describe("AiController", () => {
  let controller: AiController;

  const mockUser: AuthUser = {
    id: "user-test-uuid",
    email: "usuario@ejemplo.com",
    role: "authenticated",
    appMetadata: {},
    userMetadata: {},
  };

  const mockAiService = {
    parseReceipt: vi.fn(),
    chatFinancialAdvisor: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("parseReceipt", () => {
    it("debe invocar al servicio parseReceipt con el userId autenticado y el payload de imagen", async () => {
      const dto: ParseReceiptDto = {
        imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mimeType: "image/jpeg",
      };

      const expectedReceipt = {
        merchant: "Carrefour Express",
        total: 12500,
        currency: "ARS" as const,
        date: "2026-09-20",
        categoryId: "cat-super",
        items: [{ description: "Café soluble", amount: 12500, quantity: 1 }],
        taxAmount: 2169.42,
      };

      mockAiService.parseReceipt.mockResolvedValue(expectedReceipt);

      const result = await controller.parseReceipt(mockUser, dto);

      expect(mockAiService.parseReceipt).toHaveBeenCalledWith(
        mockUser.id,
        dto.imageBase64,
        dto.mimeType,
      );
      expect(result).toEqual(expectedReceipt);
    });
  });

  describe("chatFinancialAdvisor", () => {
    it("debe invocar al servicio chatFinancialAdvisor con userId, mensaje e historial", async () => {
      const dto: ChatMessageDto = {
        message: "¿Cuánto llevo gastado en comida este mes?",
        history: [
          { role: "user", text: "Hola GuitaBot" },
          { role: "model", text: "¡Hola! ¿En qué te puedo ayudar?" },
        ],
      };

      const expectedResponse = {
        reply: "En el rubro de comidas llevás gastados $45.000 ARS este mes.",
        contextSummary: {
          totalSpentMonth: 95000,
          totalIncomeMonth: 350000,
          activeBudgetsCount: 2,
        },
      };

      mockAiService.chatFinancialAdvisor.mockResolvedValue(expectedResponse);

      const result = await controller.chatFinancialAdvisor(mockUser, dto);

      expect(mockAiService.chatFinancialAdvisor).toHaveBeenCalledWith(
        mockUser.id,
        dto.message,
        dto.history,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});

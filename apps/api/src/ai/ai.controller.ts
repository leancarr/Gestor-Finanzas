import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AiService } from "./ai.service.js";
import { ParseReceiptDto } from "./dto/parse-receipt.dto.js";
import { ChatMessageDto } from "./dto/chat-message.dto.js";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.interface.js";

@Controller("ai")
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * SEI-38: Procesa y analiza un ticket o factura mediante Vision AI
   */
  @Post("receipt")
  @HttpCode(HttpStatus.OK)
  async parseReceipt(
    @CurrentUser() user: AuthUser,
    @Body() parseReceiptDto: ParseReceiptDto,
  ) {
    return this.aiService.parseReceipt(
      user.id,
      parseReceiptDto.imageBase64,
      parseReceiptDto.mimeType,
    );
  }

  /**
   * SEI-39: Conversación interactiva con el contador de bolsillo (GuitaBot)
   */
  @Post("chat")
  @HttpCode(HttpStatus.OK)
  async chatFinancialAdvisor(
    @CurrentUser() user: AuthUser,
    @Body() chatMessageDto: ChatMessageDto,
  ) {
    return this.aiService.chatFinancialAdvisor(
      user.id,
      chatMessageDto.message,
      chatMessageDto.history,
    );
  }
}

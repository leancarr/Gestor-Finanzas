import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RatesModule } from "../rates/rates.module.js";

@Module({
  imports: [PrismaModule, RatesModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RatesModule } from '../rates/rates.module.js';
import { InvestmentsService } from './investments.service.js';
import { InvestmentsController } from './investments.controller.js';

@Module({
  imports: [PrismaModule, RatesModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}

import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RatesModule } from '../rates/rates.module.js';
import { TrashModule } from '../trash/trash.module.js';

@Module({
  imports: [PrismaModule, AuthModule, RatesModule, TrashModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}


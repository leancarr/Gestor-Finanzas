import { Module } from '@nestjs/common';
import { RecurringService } from './recurring.service.js';
import { RecurringController } from './recurring.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringController],
  providers: [RecurringService],
  exports: [RecurringService],
})
export class RecurringModule {}

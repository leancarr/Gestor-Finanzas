import { Module } from '@nestjs/common';
import { TrashController } from './trash.controller.js';
import { TrashService } from './trash.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [TrashController],
  providers: [TrashService],
  exports: [TrashService],
})
export class TrashModule {}

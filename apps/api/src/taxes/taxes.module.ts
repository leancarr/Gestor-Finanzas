import { Module } from '@nestjs/common';
import { TaxesService } from './taxes.service.js';
import { TaxesController } from './taxes.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [TaxesController],
  providers: [TaxesService],
  exports: [TaxesService, TaxesController],
})
export class TaxesModule {}

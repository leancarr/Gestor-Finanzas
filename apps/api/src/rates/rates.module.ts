import { Module } from '@nestjs/common';
import { RatesController } from './rates.controller.js';
import { RatesService } from './rates.service.js';

@Module({
  controllers: [RatesController],
  providers: [RatesService],
  exports: [RatesService],
})
export class RatesModule {}

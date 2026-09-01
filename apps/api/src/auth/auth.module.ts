import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SupabaseStrategy } from './strategies/supabase.strategy.js';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy, SupabaseAuthGuard],
  exports: [AuthService, SupabaseStrategy, SupabaseAuthGuard, PassportModule],
})
export class AuthModule {}

import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'disconnected';
    let latencyMs = -1;
    let error: string | null = null;

    try {
      // Execute lightweight query on Postgres via Prisma
      await this.prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - startTime;
      dbStatus = 'connected';

      return res.status(HttpStatus.OK).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          latencyMs,
        },
      });
    } catch (err: any) {
      latencyMs = Date.now() - startTime;
      error = err?.message || 'Database connection error';

      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          latencyMs,
          error,
        },
      });
    }
  }
}

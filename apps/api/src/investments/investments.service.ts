import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AssetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RatesService } from '../rates/rates.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import type {
  AssetDistribution,
  PortfolioSummary,
} from './investments.interface.js';

export interface AssetValuationResult {
  currentValArs: number;
  currentValUsd: number;
  investedValArs: number;
  investedValUsd: number;
  currentValueNative: number;
  investedValueNative: number;
}

/**
 * Función pura auxiliar para redondear a 2 decimales financieros de manera segura
 */
export function round2(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula la valuación en moneda nativa, ARS y USD de un activo específico.
 */
export function calculateAssetValuation(
  asset: {
    type: AssetType;
    quantity: any;
    purchasePrice?: any;
    currentPrice?: any;
    currency?: string | null;
    dueDate?: Date | string | null;
    interestRate?: any;
    createdAt?: Date | string | null;
  },
  rates: {
    usdBlue: number;
    usdOficial?: number;
    cryptoUsdt?: number;
    eur?: number;
  },
): AssetValuationResult {
  const qty = Number(asset.quantity) || 0;
  const purchasePrice =
    asset.purchasePrice != null ? Number(asset.purchasePrice) : null;
  const currentPrice =
    asset.currentPrice != null ? Number(asset.currentPrice) : null;
  const currency = (asset.currency || 'ARS').trim().toUpperCase();

  const usdBlue = rates.usdBlue > 0 ? rates.usdBlue : 1180;
  const cryptoUsdt =
    rates.cryptoUsdt && rates.cryptoUsdt > 0 ? rates.cryptoUsdt : usdBlue;
  const eur = rates.eur && rates.eur > 0 ? rates.eur : 1250;

  let investedValueNative = 0;
  let currentValueNative = 0;

  if (asset.type === AssetType.CASH_ARS || asset.type === AssetType.CASH_USD) {
    investedValueNative = qty;
    currentValueNative = qty;
  } else if (asset.type === AssetType.FIXED_TERM) {
    // Para Plazo Fijo, quantity o purchasePrice representan el capital principal depositado
    let principal = qty;
    if (purchasePrice !== null && purchasePrice > 0) {
      if (qty === 1 || purchasePrice > 2) {
        principal = purchasePrice;
      } else {
        principal = qty * purchasePrice;
      }
    }
    investedValueNative = principal;

    // Si tiene dueDate e interestRate, calcular interés acumulado o proyectado al vencimiento
    if (asset.dueDate && asset.interestRate != null) {
      const startDate = asset.createdAt ? new Date(asset.createdAt) : new Date();
      const due = new Date(asset.dueDate);
      let termDays = Math.round(
        (due.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (termDays <= 0) {
        termDays = Math.round(
          (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
      }
      if (termDays <= 0) {
        termDays = 30; // Plazo mínimo / estándar de 30 días
      }

      const tna = Number(asset.interestRate); // % Tasa Nominal Anual
      const interest = principal * (tna / 100) * (termDays / 365);
      currentValueNative = principal + interest;
    } else if (currentPrice !== null && currentPrice > 0) {
      if (qty === 1 || currentPrice > 2) {
        currentValueNative = currentPrice;
      } else {
        currentValueNative = qty * currentPrice;
      }
    } else {
      currentValueNative = principal;
    }
  } else {
    // CEDEAR, CRYPTO, OTHER
    const effectivePurchase =
      purchasePrice !== null ? purchasePrice : currentPrice !== null ? currentPrice : 1;
    const effectiveCurrent =
      currentPrice !== null ? currentPrice : purchasePrice !== null ? purchasePrice : 1;

    investedValueNative = qty * effectivePurchase;
    currentValueNative = qty * effectiveCurrent;
  }

  // Conversión multimoneda (ARS y USD)
  let currentValArs = 0;
  let currentValUsd = 0;
  let investedValArs = 0;
  let investedValUsd = 0;

  if (currency === 'USD') {
    const rateToArs = asset.type === AssetType.CRYPTO ? cryptoUsdt : usdBlue;
    currentValUsd = currentValueNative;
    investedValUsd = investedValueNative;
    currentValArs = currentValUsd * rateToArs;
    investedValArs = investedValUsd * rateToArs;
  } else if (currency === 'USDT') {
    currentValUsd = currentValueNative;
    investedValUsd = investedValueNative;
    currentValArs = currentValUsd * cryptoUsdt;
    investedValArs = investedValUsd * cryptoUsdt;
  } else if (currency === 'EUR') {
    currentValArs = currentValueNative * eur;
    investedValArs = investedValueNative * eur;
    currentValUsd = usdBlue > 0 ? currentValArs / usdBlue : 0;
    investedValUsd = usdBlue > 0 ? investedValArs / usdBlue : 0;
  } else {
    // ARS por defecto
    currentValArs = currentValueNative;
    investedValArs = investedValueNative;
    currentValUsd = usdBlue > 0 ? currentValArs / usdBlue : 0;
    investedValUsd = usdBlue > 0 ? investedValArs / usdBlue : 0;
  }

  return {
    currentValArs,
    currentValUsd,
    investedValArs,
    investedValUsd,
    currentValueNative,
    investedValueNative,
  };
}

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratesService: RatesService,
  ) {}

  /**
   * Crea un nuevo activo en el portafolio del usuario bajo contexto RLS.
   */
  async create(userId: string, dto: CreateAssetDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const created = await tx.asset.create({
        data: {
          name: dto.name.trim(),
          type: dto.type,
          ticker: dto.ticker ? dto.ticker.trim().toUpperCase() : null,
          quantity: dto.quantity,
          purchasePrice: dto.purchasePrice != null ? dto.purchasePrice : null,
          currentPrice: dto.currentPrice != null ? dto.currentPrice : null,
          currency: dto.currency ? dto.currency.trim().toUpperCase() : 'ARS',
          institution: dto.institution ? dto.institution.trim() : null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          interestRate: dto.interestRate != null ? dto.interestRate : null,
          notes: dto.notes ? dto.notes.trim() : null,
          userId,
        },
      });

      this.logger.log(
        `Activo creado: ${created.name} (${created.type}) para usuario ${userId}`,
      );
      return created;
    });
  }

  /**
   * Obtiene todos los activos del usuario, opcionalmente filtrados por tipo.
   */
  async findAll(userId: string, type?: AssetType) {
    return this.prisma.withUser(userId, async (tx) => {
      return tx.asset.findMany({
        where: {
          userId,
          ...(type ? { type } : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  }

  /**
   * Obtiene un activo específico por su ID.
   */
  async findOne(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const asset = await tx.asset.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!asset) {
        throw new NotFoundException(`Activo con ID ${id} no encontrado`);
      }

      return asset;
    });
  }

  /**
   * Actualiza un activo existente del usuario bajo contexto RLS.
   */
  async update(userId: string, id: string, dto: UpdateAssetDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.asset.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Activo con ID ${id} no encontrado`);
      }

      const updated = await tx.asset.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.ticker !== undefined && {
            ticker: dto.ticker ? dto.ticker.trim().toUpperCase() : null,
          }),
          ...(dto.quantity !== undefined && { quantity: dto.quantity }),
          ...(dto.purchasePrice !== undefined && {
            purchasePrice: dto.purchasePrice != null ? dto.purchasePrice : null,
          }),
          ...(dto.currentPrice !== undefined && {
            currentPrice: dto.currentPrice != null ? dto.currentPrice : null,
          }),
          ...(dto.currency !== undefined && {
            currency: dto.currency ? dto.currency.trim().toUpperCase() : 'ARS',
          }),
          ...(dto.institution !== undefined && {
            institution: dto.institution ? dto.institution.trim() : null,
          }),
          ...(dto.dueDate !== undefined && {
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          }),
          ...(dto.interestRate !== undefined && {
            interestRate: dto.interestRate != null ? dto.interestRate : null,
          }),
          ...(dto.notes !== undefined && {
            notes: dto.notes ? dto.notes.trim() : null,
          }),
        },
      });

      this.logger.log(`Activo ${id} actualizado para usuario ${userId}`);
      return updated;
    });
  }

  /**
   * Elimina un activo del usuario bajo contexto RLS.
   */
  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.asset.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Activo con ID ${id} no encontrado`);
      }

      await tx.asset.delete({
        where: { id },
      });

      this.logger.log(`Activo ${id} eliminado para usuario ${userId}`);
      return { success: true, id };
    });
  }

  /**
   * Obtiene el resumen consolidado del portafolio (Net Worth, P&L, Distribución y Cotizaciones).
   */
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    // 1. Obtener activos del usuario bajo contexto RLS
    const assets = await this.prisma.withUser(userId, async (tx) => {
      return tx.asset.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    // 2. Consultar cotizaciones en tiempo real mediante RatesService
    const ratesResponse = await this.ratesService.getRates();

    const usdBlue =
      ratesResponse.rates?.USD_BLUE?.sell ??
      ratesResponse.usd?.blue?.sell ??
      1180;
    const usdOficial =
      ratesResponse.rates?.USD_OFICIAL?.sell ??
      ratesResponse.usd?.oficial?.sell ??
      1050;
    const usdMep =
      ratesResponse.rates?.USD_MEP?.sell ??
      ratesResponse.usd?.mep?.sell ??
      usdBlue;
    const cryptoUsdt =
      ratesResponse.rates?.USDT?.sell ??
      ratesResponse.usdt?.sell ??
      usdBlue;
    const eur =
      ratesResponse.rates?.EUR?.sell ??
      ratesResponse.eur?.sell ??
      1250;

    // 3. Valuación consolidada y cálculo de distribución
    let totalNetWorthArs = 0;
    let totalNetWorthUsd = 0;
    let totalInvestedArs = 0;
    let totalInvestedUsd = 0;

    const distributionMap: Record<
      AssetType,
      { totalArs: number; totalUsd: number }
    > = {
      [AssetType.CASH_ARS]: { totalArs: 0, totalUsd: 0 },
      [AssetType.CASH_USD]: { totalArs: 0, totalUsd: 0 },
      [AssetType.FIXED_TERM]: { totalArs: 0, totalUsd: 0 },
      [AssetType.CEDEAR]: { totalArs: 0, totalUsd: 0 },
      [AssetType.CRYPTO]: { totalArs: 0, totalUsd: 0 },
      [AssetType.OTHER]: { totalArs: 0, totalUsd: 0 },
    };

    for (const asset of assets) {
      const val = calculateAssetValuation(asset, {
        usdBlue,
        usdOficial,
        cryptoUsdt,
        eur,
      });

      totalNetWorthArs += val.currentValArs;
      totalNetWorthUsd += val.currentValUsd;
      totalInvestedArs += val.investedValArs;
      totalInvestedUsd += val.investedValUsd;

      if (distributionMap[asset.type]) {
        distributionMap[asset.type].totalArs += val.currentValArs;
        distributionMap[asset.type].totalUsd += val.currentValUsd;
      }
    }

    const totalProfitLossArs = totalNetWorthArs - totalInvestedArs;
    const totalProfitLossUsd = totalNetWorthUsd - totalInvestedUsd;
    const profitLossPercentage =
      totalInvestedArs > 0 ? (totalProfitLossArs / totalInvestedArs) * 100 : 0;

    const distribution: AssetDistribution[] = (
      Object.keys(distributionMap) as AssetType[]
    )
      .map((type) => {
        const { totalArs, totalUsd } = distributionMap[type];
        const percentage =
          totalNetWorthArs > 0 ? round2((totalArs / totalNetWorthArs) * 100) : 0;
        return {
          type,
          totalArs: round2(totalArs),
          totalUsd: round2(totalUsd),
          percentage,
        };
      })
      .filter((d) => d.totalArs > 0 || d.totalUsd > 0);

    return {
      totalNetWorthArs: round2(totalNetWorthArs),
      totalNetWorthUsd: round2(totalNetWorthUsd),
      totalInvestedArs: round2(totalInvestedArs),
      totalInvestedUsd: round2(totalInvestedUsd),
      totalProfitLossArs: round2(totalProfitLossArs),
      totalProfitLossUsd: round2(totalProfitLossUsd),
      profitLossPercentage: round2(profitLossPercentage),
      distribution,
      rates: {
        usdArs: usdBlue,
        usdOficial,
        usdBlue,
        usdMep,
        cryptoUsdt,
        source: ratesResponse.source || 'live',
        lastUpdated: ratesResponse.timestamp || new Date().toISOString(),
      },
    };
  }
}

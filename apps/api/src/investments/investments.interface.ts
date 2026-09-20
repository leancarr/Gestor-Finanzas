import { AssetType } from '@prisma/client';

export interface AssetDistribution {
  type: AssetType;
  totalArs: number;
  totalUsd: number;
  percentage: number;
}

export interface AppliedRates {
  usdArs: number;
  usdOficial?: number;
  usdBlue?: number;
  usdMep?: number;
  cryptoUsdt?: number;
  source?: string;
  lastUpdated?: string;
}

export interface PortfolioSummary {
  totalNetWorthArs: number;
  totalNetWorthUsd: number;
  totalInvestedArs: number;
  totalInvestedUsd: number;
  totalProfitLossArs: number;
  totalProfitLossUsd: number;
  profitLossPercentage: number;
  distribution: AssetDistribution[];
  rates: AppliedRates;
}

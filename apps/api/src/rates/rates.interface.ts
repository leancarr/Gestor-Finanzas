export interface RateItem {
  currency: string;
  name: string;
  type?: string;
  buy: number;
  sell: number;
  average: number;
  updatedAt: string;
  isFallback?: boolean;
}

export interface UsdRates {
  oficial: RateItem;
  blue: RateItem;
  mep: RateItem;
  tarjeta: RateItem;
  [key: string]: RateItem;
}

export interface RatesResponse {
  usd: UsdRates;
  eur: RateItem;
  usdt: RateItem;
  ars: RateItem;
  rates: {
    USD_OFICIAL: RateItem;
    USD_BLUE: RateItem;
    USD_MEP: RateItem;
    USD_TARJETA: RateItem;
    EUR: RateItem;
    USDT: RateItem;
    ARS: RateItem;
    [key: string]: RateItem;
  };
  source: 'live' | 'cache' | 'fallback' | 'partial';
  cached: boolean;
  timestamp: string;
}

export interface ConversionResult {
  amount: number;
  from: string;
  fromCurrency: string;
  to: string;
  toCurrency: string;
  rateType: string;
  rate: number;
  result: number;
  rateDetails: {
    fromRateInArs: number;
    toRateInArs: number;
    quoteUsed: 'sell' | 'buy' | 'average';
    source: string;
  };
  timestamp: string;
}

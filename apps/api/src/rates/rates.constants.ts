import type { RateItem } from './rates.interface.js';

export const DEFAULT_RATES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos en milisegundos

export const SUPPORTED_CURRENCIES = ['ARS', 'USD', 'EUR', 'USDT'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const SUPPORTED_USD_RATE_TYPES = ['blue', 'oficial', 'mep', 'tarjeta'] as const;
export type SupportedUsdRateType = (typeof SUPPORTED_USD_RATE_TYPES)[number];

export const STATIC_FALLBACK_RATES: {
  USD_OFICIAL: RateItem;
  USD_BLUE: RateItem;
  USD_MEP: RateItem;
  USD_TARJETA: RateItem;
  EUR: RateItem;
  USDT: RateItem;
  ARS: RateItem;
} = {
  USD_OFICIAL: {
    currency: 'USD',
    name: 'Dólar Oficial',
    type: 'oficial',
    buy: 1040,
    sell: 1080,
    average: 1060,
    updatedAt: '2026-09-01T00:00:00.000Z',
    isFallback: true,
  },
  USD_BLUE: {
    currency: 'USD',
    name: 'Dólar Blue',
    type: 'blue',
    buy: 1210,
    sell: 1230,
    average: 1220,
    updatedAt: '2026-09-01T00:00:00.000Z',
    isFallback: true,
  },
  USD_MEP: {
    currency: 'USD',
    name: 'Dólar MEP (Bolsa)',
    type: 'mep',
    buy: 1190,
    sell: 1205,
    average: 1197.5,
    updatedAt: '2026-09-01T00:00:00.000Z',
    isFallback: true,
  },
  USD_TARJETA: {
    currency: 'USD',
    name: 'Dólar Tarjeta',
    type: 'tarjeta',
    buy: 1700,
    sell: 1730,
    average: 1715,
    updatedAt: '2026-09-01T00:00:00.000Z',
    isFallback: true,
  },
  EUR: {
    currency: 'EUR',
    name: 'Euro Oficial',
    type: 'oficial',
    buy: 1140,
    sell: 1210,
    average: 1175,
    updatedAt: '2026-09-01T00:00:00.000Z',
    isFallback: true,
  },
  USDT: {
    currency: 'USDT',
    name: 'USDT (Binance / CryptoYa)',
    type: 'crypto',
    buy: 1220,
    sell: 1240,
    average: 1230,
    updatedAt: '2026-09-01T00:00:00.000Z',
    isFallback: true,
  },
  ARS: {
    currency: 'ARS',
    name: 'Peso Argentino',
    type: 'fiat',
    buy: 1,
    sell: 1,
    average: 1,
    updatedAt: '2026-09-01T00:00:00.000Z',
    isFallback: false,
  },
};

export type SupportedCurrency = 'ARS' | 'USD' | 'EUR' | 'USDT';

export interface CurrencyInfo {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  flag: string;
  description: string;
  defaultRateToArs: number;
}

export const CURRENCY_LIST: Record<SupportedCurrency, CurrencyInfo> = {
  ARS: {
    code: 'ARS',
    name: 'Pesos Argentinos',
    symbol: '$',
    flag: '🇦🇷',
    description: 'Moneda local de curso legal',
    defaultRateToArs: 1,
  },
  USD: {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: 'US$',
    flag: '🇺🇸',
    description: 'Dólar Oficial / MEP',
    defaultRateToArs: 1180,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    description: 'Euro Oficial',
    defaultRateToArs: 1285,
  },
  USDT: {
    code: 'USDT',
    name: 'Tether USD',
    symbol: '₮',
    flag: '🌐',
    description: 'Criptodólar estable 1:1',
    defaultRateToArs: 1195,
  },
};

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['ARS', 'USD', 'EUR', 'USDT'];

export const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  ARS: 1,
  USD: 1180,
  EUR: 1285,
  USDT: 1195,
};

export interface RatesResponse {
  base: SupportedCurrency;
  rates: Record<SupportedCurrency, number>;
  lastUpdated: string;
  source?: 'api' | 'fallback';
}

export interface ConvertResponse {
  amount: number;
  from: SupportedCurrency;
  to: SupportedCurrency;
  result: number;
  rate: number;
  lastUpdated: string;
  isFallback: boolean;
}

export type TaxSchemeType = 'IVA_21' | 'DIGITAL_SERVICES' | 'TARJETA_60' | 'IVA_10_5';

export interface TaxItemBreakdown {
  id: string;
  name: string;
  ratePercent: number;
  amount: number;
  amountArs: number;
  description: string;
}

export interface TaxCalculationResult {
  baseAmount: number;
  currency: SupportedCurrency;
  rateToArs: number;
  baseAmountArs: number;
  scheme: TaxSchemeType;
  schemeName: string;
  items: TaxItemBreakdown[];
  totalTaxes: number;
  totalTaxesArs: number;
  totalAmount: number;
  totalAmountArs: number;
  effectiveTaxPercentage: number;
}

export const TAX_SCHEME_DEFINITIONS: Record<
  TaxSchemeType,
  {
    name: string;
    description: string;
    taxes: Array<{ id: string; name: string; ratePercent: number; description: string }>;
  }
> = {
  DIGITAL_SERVICES: {
    name: 'Servicios Digitales Exterior (59%)',
    description: 'Aplica a consumos en moneda extranjera (Netflix, Spotify, AWS, software, Steam).',
    taxes: [
      { id: 'iva_digital', name: 'IVA Digital', ratePercent: 21, description: 'Impuesto al Valor Agregado sobre servicios del exterior' },
      { id: 'pais_digital', name: 'Impuesto PAÍS Reducido', ratePercent: 8, description: 'Tasa reducida para servicios digitales' },
      { id: 'ganancias', name: 'Percepción Ganancias (RG 5463)', ratePercent: 30, description: 'Percepción a cuenta de Ganancias / Bienes Personales' },
    ],
  },
  IVA_21: {
    name: 'IVA Estándar (21%)',
    description: 'IVA general sobre compras y servicios comerciales en moneda local o divisas.',
    taxes: [
      { id: 'iva_21', name: 'IVA General', ratePercent: 21, description: 'Alícuota general del 21%' },
    ],
  },
  TARJETA_60: {
    name: 'Dólar Tarjeta / Turista (60%)',
    description: 'Consumos generales y viajes al exterior con tarjetas argentinas.',
    taxes: [
      { id: 'pais_general', name: 'Impuesto PAÍS', ratePercent: 30, description: 'Impuesto para una Argentina Inclusiva y Solidaria' },
      { id: 'percepcion_rg', name: 'Percepción Ganancias (RG 5463)', ratePercent: 30, description: 'Percepción a cuenta del 30%' },
    ],
  },
  IVA_10_5: {
    name: 'IVA Reducido (10.5%)',
    description: 'Bienes de capital, electrónica específica, transporte o insumos gravados al 10.5%.',
    taxes: [
      { id: 'iva_10_5', name: 'IVA Diferencial', ratePercent: 10.5, description: 'Alícuota reducida al 10.5%' },
    ],
  },
};

import { DYNAMIC_API_URL } from './config';
const API_URL = DYNAMIC_API_URL;

function extractRateNumber(item: unknown, fallback: number): number {
  if (typeof item === 'number' && !isNaN(item)) return item;
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    if (typeof obj.sell === 'number' && !isNaN(obj.sell)) return obj.sell;
    if (typeof obj.average === 'number' && !isNaN(obj.average)) return obj.average;
    if (typeof obj.buy === 'number' && !isNaN(obj.buy)) return obj.buy;
  }
  return fallback;
}

/**
 * Consulta las tasas de cambio desde /rates o devuelve el fallback local.
 */
export async function getRates(base: SupportedCurrency = 'ARS'): Promise<RatesResponse> {
  try {
    const res = await fetch(`${API_URL}/rates?base=${base}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      if (data) {
        const usdRate = extractRateNumber(
          data.rates?.USD ?? data.usd?.blue ?? data.rates?.USD_BLUE ?? data.usd?.oficial,
          FALLBACK_RATES.USD,
        );
        const eurRate = extractRateNumber(
          data.rates?.EUR ?? data.eur,
          FALLBACK_RATES.EUR,
        );
        const usdtRate = extractRateNumber(
          data.rates?.USDT ?? data.usdt,
          FALLBACK_RATES.USDT,
        );

        return {
          base: data.base || base,
          rates: {
            ARS: 1,
            USD: usdRate,
            EUR: eurRate,
            USDT: usdtRate,
          },
          lastUpdated: data.lastUpdated || data.timestamp || new Date().toISOString(),
          source: (data.source as 'api' | 'fallback') || 'api',
        };
      }
    }
  } catch {
    // Fallback silencioso en caso de error de red o timeout
  }

  return {
    base: 'ARS',
    rates: { ...FALLBACK_RATES },
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
  };
}

/**
 * Convierte un monto entre dos monedas usando /rates/convert con fallback instantáneo.
 */
export async function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
): Promise<ConvertResponse> {
  if (from === to) {
    return {
      amount,
      from,
      to,
      result: amount,
      rate: 1,
      lastUpdated: new Date().toISOString(),
      isFallback: false,
    };
  }

  try {
    const url = new URL(`${API_URL}/rates/convert`);
    url.searchParams.set('amount', String(amount));
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data.result === 'number' && typeof data.rate === 'number') {
        return {
          amount,
          from,
          to,
          result: data.result,
          rate: data.rate,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          isFallback: false,
        };
      }
    }
  } catch {
    // Fallback local
  }

  const fromRateInArs = FALLBACK_RATES[from] || 1;
  const toRateInArs = FALLBACK_RATES[to] || 1;
  const amountInArs = amount * fromRateInArs;
  const converted = amountInArs / toRateInArs;
  const rate = fromRateInArs / toRateInArs;

  return {
    amount,
    from,
    to,
    result: Math.round(converted * 100) / 100,
    rate: Math.round(rate * 10000) / 10000,
    lastUpdated: new Date().toISOString(),
    isFallback: true,
  };
}

/**
 * Conversión síncrona local para cálculo instantáneo en la UI.
 */
export function convertCurrencyLocal(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: Record<SupportedCurrency, number> = FALLBACK_RATES,
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? FALLBACK_RATES[from] ?? 1;
  const toRate = rates[to] ?? FALLBACK_RATES[to] ?? 1;
  const inArs = amount * fromRate;
  const res = inArs / toRate;
  return Math.round(res * 100) / 100;
}

/**
 * Calcula el desglose impositivo detallado sobre un monto base.
 */
export function calculateTaxes(
  baseAmount: number,
  currency: SupportedCurrency = 'ARS',
  scheme: TaxSchemeType = currency === 'ARS' ? 'IVA_21' : 'DIGITAL_SERVICES',
  rates: Record<SupportedCurrency, number> = FALLBACK_RATES,
): TaxCalculationResult {
  const safeAmount = Math.max(0, isNaN(baseAmount) ? 0 : baseAmount);
  const rateToArs = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  const baseAmountArs = Math.round(safeAmount * rateToArs * 100) / 100;

  const definition = TAX_SCHEME_DEFINITIONS[scheme] || TAX_SCHEME_DEFINITIONS.IVA_21;

  let totalTaxes = 0;
  let totalTaxPercent = 0;

  const items: TaxItemBreakdown[] = definition.taxes.map((tax) => {
    const taxAmount = Math.round((safeAmount * (tax.ratePercent / 100)) * 100) / 100;
    const taxAmountArs = Math.round((baseAmountArs * (tax.ratePercent / 100)) * 100) / 100;
    totalTaxes += taxAmount;
    totalTaxPercent += tax.ratePercent;

    return {
      id: tax.id,
      name: tax.name,
      ratePercent: tax.ratePercent,
      amount: taxAmount,
      amountArs: taxAmountArs,
      description: tax.description,
    };
  });

  const totalTaxesRounded = Math.round(totalTaxes * 100) / 100;
  const totalAmount = Math.round((safeAmount + totalTaxesRounded) * 100) / 100;
  const totalTaxesArs = Math.round((baseAmountArs * (totalTaxPercent / 100)) * 100) / 100;
  const totalAmountArs = Math.round((baseAmountArs + totalTaxesArs) * 100) / 100;

  return {
    baseAmount: safeAmount,
    currency,
    rateToArs,
    baseAmountArs,
    scheme,
    schemeName: definition.name,
    items,
    totalTaxes: totalTaxesRounded,
    totalTaxesArs,
    totalAmount,
    totalAmountArs,
    effectiveTaxPercentage: totalTaxPercent,
  };
}

/**
 * Obtiene el símbolo oficial o comúnmente usado para cada moneda.
 */
export function getCurrencySymbol(currency: SupportedCurrency | string): string {
  const code = (currency || 'ARS').toUpperCase() as SupportedCurrency;
  return CURRENCY_LIST[code]?.symbol || '$';
}

/**
 * Formatea un valor monetario según la moneda especificada.
 */
export function formatCurrency(
  amount: number | string,
  currency: SupportedCurrency | string = 'ARS',
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return '$ 0,00';

  const code = (currency || 'ARS').toUpperCase() as SupportedCurrency;
  if (code === 'USDT') {
    return `₮ ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)}`;
  }

  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    const symbol = CURRENCY_LIST[code]?.symbol || '$';
    return `${symbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)}`;
  }
}

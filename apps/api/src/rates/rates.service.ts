import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  DEFAULT_RATES_CACHE_TTL_MS,
  STATIC_FALLBACK_RATES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_USD_RATE_TYPES,
  type SupportedCurrency,
  type SupportedUsdRateType,
} from './rates.constants.js';
import type {
  ConversionResult,
  RateItem,
  RatesResponse,
  UsdRates,
} from './rates.interface.js';

interface DolarApiItem {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

interface CriptoYaBinanceItem {
  ask: number;
  totalAsk?: number;
  bid: number;
  totalBid?: number;
  time?: number;
}

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  private cachedRates: RatesResponse | null = null;
  private lastFetchTime: number = 0;
  private ttlMs: number = DEFAULT_RATES_CACHE_TTL_MS;

  /**
   * Configura el tiempo de vida (TTL) del caché en milisegundos
   */
  setTtlMs(ttl: number): void {
    this.ttlMs = ttl;
  }

  /**
   * Limpia el caché en memoria (útil para pruebas y recarga forzada)
   */
  clearCache(): void {
    this.cachedRates = null;
    this.lastFetchTime = 0;
  }

  /**
   * Devuelve el estado actual de la caché
   */
  getCacheStatus() {
    const isCached =
      this.cachedRates !== null && Date.now() - this.lastFetchTime < this.ttlMs;
    return {
      isCached,
      lastFetchTime: this.lastFetchTime
        ? new Date(this.lastFetchTime).toISOString()
        : null,
      ageMs: this.lastFetchTime ? Date.now() - this.lastFetchTime : null,
      ttlMs: this.ttlMs,
    };
  }

  /**
   * Helper genérico para peticiones HTTP con AbortSignal y timeout
   */
  private async fetchWithTimeout<T>(
    url: string,
    timeoutMs = 4000,
  ): Promise<T | null> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        this.logger.warn(`API ${url} retornó estado HTTP ${response.status}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      this.logger.warn(
        `Fallo al consultar ${url}: ${err?.message || 'Error de conexión o timeout'}`,
      );
      return null;
    }
  }

  /**
   * Obtiene cotizaciones de dólares desde DolarApi (oficial, blue, mep, tarjeta)
   */
  private async fetchDolarRates(): Promise<UsdRates | null> {
    const data = await this.fetchWithTimeout<DolarApiItem[]>(
      'https://dolarapi.com/v1/dolares',
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const findCasa = (casaName: string) =>
      data.find(
        (item) =>
          item.casa?.toLowerCase() === casaName.toLowerCase() ||
          item.nombre?.toLowerCase() === casaName.toLowerCase(),
      );

    const oficialRaw = findCasa('oficial');
    const blueRaw = findCasa('blue');
    const mepRaw = findCasa('bolsa') || findCasa('mep');
    const tarjetaRaw = findCasa('tarjeta');

    if (!oficialRaw && !blueRaw) {
      return null;
    }

    const parseRateItem = (
      raw: DolarApiItem | undefined,
      fallback: RateItem,
      type: string,
      customName: string,
    ): RateItem => {
      if (!raw || typeof raw.compra !== 'number' || typeof raw.venta !== 'number') {
        return fallback;
      }
      return {
        currency: 'USD',
        name: customName,
        type,
        buy: raw.compra,
        sell: raw.venta,
        average: Number(((raw.compra + raw.venta) / 2).toFixed(2)),
        updatedAt: raw.fechaActualizacion || new Date().toISOString(),
        isFallback: false,
      };
    };

    return {
      oficial: parseRateItem(
        oficialRaw,
        STATIC_FALLBACK_RATES.USD_OFICIAL,
        'oficial',
        'Dólar Oficial',
      ),
      blue: parseRateItem(
        blueRaw,
        STATIC_FALLBACK_RATES.USD_BLUE,
        'blue',
        'Dólar Blue',
      ),
      mep: parseRateItem(
        mepRaw,
        STATIC_FALLBACK_RATES.USD_MEP,
        'mep',
        'Dólar MEP (Bolsa)',
      ),
      tarjeta: parseRateItem(
        tarjetaRaw,
        STATIC_FALLBACK_RATES.USD_TARJETA,
        'tarjeta',
        'Dólar Tarjeta',
      ),
    };
  }

  /**
   * Obtiene la cotización del Euro desde DolarApi
   */
  private async fetchEuroRate(): Promise<RateItem | null> {
    const data = await this.fetchWithTimeout<DolarApiItem | DolarApiItem[]>(
      'https://dolarapi.com/v1/cotizaciones/eur',
    );

    if (!data) return null;

    const raw = Array.isArray(data)
      ? data.find(
          (item) =>
            item.moneda?.toUpperCase() === 'EUR' ||
            item.casa?.toLowerCase() === 'oficial',
        ) || data[0]
      : data;

    if (!raw || typeof raw.compra !== 'number' || typeof raw.venta !== 'number') {
      return null;
    }

    return {
      currency: 'EUR',
      name: 'Euro Oficial',
      type: 'oficial',
      buy: raw.compra,
      sell: raw.venta,
      average: Number(((raw.compra + raw.venta) / 2).toFixed(2)),
      updatedAt: raw.fechaActualizacion || new Date().toISOString(),
      isFallback: false,
    };
  }

  /**
   * Obtiene la cotización de USDT en pesos desde CriptoYa (Binance P2P / Spot)
   */
  private async fetchUsdtRate(): Promise<RateItem | null> {
    const data = await this.fetchWithTimeout<CriptoYaBinanceItem>(
      'https://criptoya.com/api/binance/usdt/ars',
    );

    if (!data || typeof data.ask !== 'number' || typeof data.bid !== 'number') {
      return null;
    }

    const timestamp = data.time
      ? new Date(data.time > 1e11 ? data.time : data.time * 1000).toISOString()
      : new Date().toISOString();

    return {
      currency: 'USDT',
      name: 'USDT (Binance / CryptoYa)',
      type: 'crypto',
      buy: data.bid,
      sell: data.ask,
      average: Number(((data.ask + data.bid) / 2).toFixed(2)),
      updatedAt: timestamp,
      isFallback: false,
    };
  }

  /**
   * Obtiene las cotizaciones actuales de todas las divisas con soporte de caché y fallback
   */
  async getRates(forceRefresh = false): Promise<RatesResponse> {
    const now = Date.now();

    // 1. Si no se fuerza refresh y existe caché vigente, devolverlo inmediatamente
    if (
      !forceRefresh &&
      this.cachedRates &&
      now - this.lastFetchTime < this.ttlMs
    ) {
      return {
        ...this.cachedRates,
        cached: true,
        source: 'cache',
      };
    }

    // 2. Consultar servicios externos en paralelo con resiliencia individual
    const [dolarResult, euroResult, usdtResult] = await Promise.allSettled([
      this.fetchDolarRates(),
      this.fetchEuroRate(),
      this.fetchUsdtRate(),
    ]);

    const liveUsd =
      dolarResult.status === 'fulfilled' ? dolarResult.value : null;
    const liveEur = euroResult.status === 'fulfilled' ? euroResult.value : null;
    const liveUsdt = usdtResult.status === 'fulfilled' ? usdtResult.value : null;

    const usd: UsdRates = liveUsd || {
      oficial: STATIC_FALLBACK_RATES.USD_OFICIAL,
      blue: STATIC_FALLBACK_RATES.USD_BLUE,
      mep: STATIC_FALLBACK_RATES.USD_MEP,
      tarjeta: STATIC_FALLBACK_RATES.USD_TARJETA,
    };

    const eur: RateItem = liveEur || STATIC_FALLBACK_RATES.EUR;
    const usdt: RateItem = liveUsdt || STATIC_FALLBACK_RATES.USDT;
    const ars: RateItem = STATIC_FALLBACK_RATES.ARS;

    // 3. Determinar la fuente de los datos
    const allLive = !!(liveUsd && liveEur && liveUsdt);
    const allFallback = !liveUsd && !liveEur && !liveUsdt;
    const source: 'live' | 'fallback' | 'partial' = allLive
      ? 'live'
      : allFallback
        ? 'fallback'
        : 'partial';

    const timestamp = new Date().toISOString();

    const ratesResponse: RatesResponse = {
      usd,
      eur,
      usdt,
      ars,
      rates: {
        USD_OFICIAL: usd.oficial,
        USD_BLUE: usd.blue,
        USD_MEP: usd.mep,
        USD_TARJETA: usd.tarjeta,
        EUR: eur,
        USDT: usdt,
        ARS: ars,
      },
      source,
      cached: false,
      timestamp,
    };

    // 4. Guardar en memoria caché
    this.cachedRates = ratesResponse;
    this.lastFetchTime = now;

    return ratesResponse;
  }

  /**
   * Obtiene la tasa de cambio en pesos argentinos (ARS) para 1 unidad de la divisa
   */
  private getRateInArs(
    rates: RatesResponse,
    currency: SupportedCurrency,
    rateType: SupportedUsdRateType,
  ): number {
    switch (currency) {
      case 'ARS':
        return 1;
      case 'EUR':
        return rates.eur.sell;
      case 'USDT':
        return rates.usdt.sell;
      case 'USD': {
        const usdRate = rates.usd[rateType] ?? rates.usd.blue;
        return usdRate.sell;
      }
      default:
        return 1;
    }
  }

  /**
   * Realiza la conversión precisa entre dos divisas
   * @param amount Monto a convertir
   * @param from Divisa de origen (ARS, USD, EUR, USDT)
   * @param to Divisa de destino (ARS, USD, EUR, USDT)
   * @param rateType Tipo de cotización USD opcional (blue, oficial, mep, tarjeta)
   */
  async convert(
    amount: number,
    from: string,
    to: string,
    rateType?: string,
  ): Promise<ConversionResult> {
    // 1. Validar el monto
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('El monto debe ser un número válido mayor a 0');
    }

    // 2. Normalizar y validar divisas
    const fromClean = (from || '').trim().toUpperCase() as SupportedCurrency;
    const toClean = (to || '').trim().toUpperCase() as SupportedCurrency;

    if (!fromClean || !toClean) {
      throw new BadRequestException(
        'Las divisas de origen (from) y destino (to) son obligatorias',
      );
    }

    if (!SUPPORTED_CURRENCIES.includes(fromClean)) {
      throw new BadRequestException(
        `Moneda no soportada: '${fromClean}'. Monedas válidas: ${SUPPORTED_CURRENCIES.join(', ')}`,
      );
    }

    if (!SUPPORTED_CURRENCIES.includes(toClean)) {
      throw new BadRequestException(
        `Moneda no soportada: '${toClean}'. Monedas válidas: ${SUPPORTED_CURRENCIES.join(', ')}`,
      );
    }

    // 3. Normalizar y validar el tipo de cotización
    let normalizedRateType = (rateType || 'blue').trim().toLowerCase();
    if (normalizedRateType === 'bolsa') {
      normalizedRateType = 'mep';
    }

    if (
      (fromClean === 'USD' || toClean === 'USD') &&
      !SUPPORTED_USD_RATE_TYPES.includes(normalizedRateType as SupportedUsdRateType)
    ) {
      throw new BadRequestException(
        `Tipo de cotización no válido para USD: '${normalizedRateType}'. Opciones disponibles: ${SUPPORTED_USD_RATE_TYPES.join(', ')}`,
      );
    }

    // 4. Caso trivial: Misma moneda
    if (fromClean === toClean) {
      return {
        amount,
        from: fromClean,
        fromCurrency: fromClean,
        to: toClean,
        toCurrency: toClean,
        rateType: normalizedRateType,
        rate: 1,
        result: amount,
        rateDetails: {
          fromRateInArs: 1,
          toRateInArs: 1,
          quoteUsed: 'sell',
          source: 'identity',
        },
        timestamp: new Date().toISOString(),
      };
    }

    // 5. Obtener cotizaciones vigentes
    const rates = await this.getRates();

    const fromRateInArs = this.getRateInArs(
      rates,
      fromClean,
      normalizedRateType as SupportedUsdRateType,
    );
    const toRateInArs = this.getRateInArs(
      rates,
      toClean,
      normalizedRateType as SupportedUsdRateType,
    );

    // 6. Calcular tipo de cambio efectivo y resultado
    const effectiveRate = fromRateInArs / toRateInArs;
    const rawResult = amount * effectiveRate;

    // Precisión: 2 decimales para ARS, 4 decimales para USD, EUR, USDT
    const precision = toClean === 'ARS' ? 2 : 4;
    const result = Number(rawResult.toFixed(precision));
    const formattedRate = Number(effectiveRate.toFixed(6));

    return {
      amount,
      from: fromClean,
      fromCurrency: fromClean,
      to: toClean,
      toCurrency: toClean,
      rateType: normalizedRateType,
      rate: formattedRate,
      result,
      rateDetails: {
        fromRateInArs,
        toRateInArs,
        quoteUsed: 'sell',
        source: rates.source,
      },
      timestamp: rates.timestamp,
    };
  }
}

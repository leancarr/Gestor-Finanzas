import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RatesService } from './rates.service.js';
import { STATIC_FALLBACK_RATES } from './rates.constants.js';

describe('RatesService', () => {
  let service: RatesService;

  const mockDolarApiResponse = [
    {
      moneda: 'USD',
      casa: 'oficial',
      nombre: 'Oficial',
      compra: 1050,
      venta: 1090,
      fechaActualizacion: '2026-09-18T12:00:00.000Z',
    },
    {
      moneda: 'USD',
      casa: 'blue',
      nombre: 'Blue',
      compra: 1220,
      venta: 1240,
      fechaActualizacion: '2026-09-18T12:00:00.000Z',
    },
    {
      moneda: 'USD',
      casa: 'bolsa',
      nombre: 'Bolsa',
      compra: 1195,
      venta: 1210,
      fechaActualizacion: '2026-09-18T12:00:00.000Z',
    },
    {
      moneda: 'USD',
      casa: 'tarjeta',
      nombre: 'Tarjeta',
      compra: 1710,
      venta: 1744,
      fechaActualizacion: '2026-09-18T12:00:00.000Z',
    },
  ];

  const mockEuroApiResponse = {
    moneda: 'EUR',
    casa: 'oficial',
    nombre: 'Euro Oficial',
    compra: 1150,
    venta: 1220,
    fechaActualizacion: '2026-09-18T12:00:00.000Z',
  };

  const mockCriptoYaResponse = {
    ask: 1250,
    bid: 1230,
    time: 1726660800,
  };

  const setupMockFetch = (options?: {
    dolarFails?: boolean;
    euroFails?: boolean;
    usdtFails?: boolean;
  }) => {
    return vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();

      if (urlStr.includes('dolarapi.com/v1/dolares')) {
        if (options?.dolarFails) {
          return Promise.reject(new Error('DolarApi connection refused'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockDolarApiResponse),
        });
      }

      if (urlStr.includes('dolarapi.com/v1/cotizaciones/eur')) {
        if (options?.euroFails) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({}),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockEuroApiResponse),
        });
      }

      if (urlStr.includes('criptoya.com/api/binance/usdt/ars')) {
        if (options?.usdtFails) {
          return Promise.reject(new Error('CryptoYa timeout'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockCriptoYaResponse),
        });
      }

      return Promise.reject(new Error(`Unhandled URL in mock: ${urlStr}`));
    });
  };

  beforeEach(async () => {
    vi.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RatesService],
    }).compile();

    service = module.get<RatesService>(RatesService);
    service.clearCache();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRates', () => {
    it('should return live rates when all external APIs succeed', async () => {
      globalThis.fetch = setupMockFetch();

      const result = await service.getRates();

      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
      expect(result.source).toBe('live');
      expect(result.cached).toBe(false);

      // USD
      expect(result.usd.oficial.buy).toBe(1050);
      expect(result.usd.oficial.sell).toBe(1090);
      expect(result.usd.blue.buy).toBe(1220);
      expect(result.usd.blue.sell).toBe(1240);
      expect(result.usd.mep.buy).toBe(1195);
      expect(result.usd.mep.sell).toBe(1210);
      expect(result.usd.tarjeta.sell).toBe(1744);

      // EUR
      expect(result.eur.buy).toBe(1150);
      expect(result.eur.sell).toBe(1220);

      // USDT
      expect(result.usdt.buy).toBe(1230); // bid
      expect(result.usdt.sell).toBe(1250); // ask

      // ARS
      expect(result.ars.sell).toBe(1);
    });

    it('should utilize in-memory cache on subsequent calls within TTL', async () => {
      const mockFetch = setupMockFetch();
      globalThis.fetch = mockFetch;

      const firstCall = await service.getRates();
      expect(firstCall.cached).toBe(false);
      expect(firstCall.source).toBe('live');
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Segunda llamada dentro del TTL
      const secondCall = await service.getRates();
      expect(secondCall.cached).toBe(true);
      expect(secondCall.source).toBe('cache');
      expect(secondCall.usd.blue.sell).toBe(1240);
      // No debe haber llamado a fetch nuevamente
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const cacheStatus = service.getCacheStatus();
      expect(cacheStatus.isCached).toBe(true);
      expect(cacheStatus.ageMs).toBeGreaterThanOrEqual(0);
    });

    it('should bypass cache when forceRefresh is true', async () => {
      const mockFetch = setupMockFetch();
      globalThis.fetch = mockFetch;

      await service.getRates();
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Llamada forzada
      const refreshed = await service.getRates(true);
      expect(refreshed.cached).toBe(false);
      expect(refreshed.source).toBe('live');
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });

    it('should refresh rates when TTL expires', async () => {
      const mockFetch = setupMockFetch();
      globalThis.fetch = mockFetch;
      service.setTtlMs(50); // 50ms TTL para la prueba

      await service.getRates();
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Esperar a que el TTL expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      await service.getRates();
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });

  describe('fallback and resilience', () => {
    it('should fallback to static default rates when all external APIs fail', async () => {
      globalThis.fetch = setupMockFetch({
        dolarFails: true,
        euroFails: true,
        usdtFails: true,
      });

      const result = await service.getRates();

      expect(result.source).toBe('fallback');
      expect(result.cached).toBe(false);

      expect(result.usd.oficial.sell).toBe(STATIC_FALLBACK_RATES.USD_OFICIAL.sell);
      expect(result.usd.blue.sell).toBe(STATIC_FALLBACK_RATES.USD_BLUE.sell);
      expect(result.usd.mep.sell).toBe(STATIC_FALLBACK_RATES.USD_MEP.sell);
      expect(result.usd.tarjeta.sell).toBe(STATIC_FALLBACK_RATES.USD_TARJETA.sell);
      expect(result.eur.sell).toBe(STATIC_FALLBACK_RATES.EUR.sell);
      expect(result.usdt.sell).toBe(STATIC_FALLBACK_RATES.USDT.sell);
      expect(result.ars.sell).toBe(1);
    });

    it('should handle partial failures with source "partial"', async () => {
      // Dolar y Euro funcionan, USDT falla
      globalThis.fetch = setupMockFetch({
        dolarFails: false,
        euroFails: false,
        usdtFails: true,
      });

      const result = await service.getRates();

      expect(result.source).toBe('partial');
      expect(result.usd.blue.sell).toBe(1240); // Live
      expect(result.eur.sell).toBe(1220); // Live
      expect(result.usdt.sell).toBe(STATIC_FALLBACK_RATES.USDT.sell); // Fallback
    });
  });

  describe('convert', () => {
    beforeEach(() => {
      globalThis.fetch = setupMockFetch();
    });

    it('should convert ARS to USD using blue rate by default', async () => {
      // 124000 ARS / 1240 (blue sell) = 100 USD
      const result = await service.convert(124000, 'ARS', 'USD');

      expect(result.amount).toBe(124000);
      expect(result.from).toBe('ARS');
      expect(result.to).toBe('USD');
      expect(result.rateType).toBe('blue');
      expect(result.result).toBe(100);
      expect(result.rate).toBeCloseTo(1 / 1240, 6);
    });

    it('should convert USD to ARS using specified rate types', async () => {
      // Oficial: 100 USD * 1090 = 109000 ARS
      const oficialRes = await service.convert(100, 'USD', 'ARS', 'oficial');
      expect(oficialRes.result).toBe(109000);
      expect(oficialRes.rate).toBe(1090);

      // Blue: 100 USD * 1240 = 124000 ARS
      const blueRes = await service.convert(100, 'USD', 'ARS', 'blue');
      expect(blueRes.result).toBe(124000);
      expect(blueRes.rate).toBe(1240);

      // MEP / Bolsa: 100 USD * 1210 = 121000 ARS
      const mepRes = await service.convert(100, 'USD', 'ARS', 'mep');
      expect(mepRes.result).toBe(121000);

      const bolsaRes = await service.convert(100, 'USD', 'ARS', 'bolsa');
      expect(bolsaRes.result).toBe(121000);
      expect(bolsaRes.rateType).toBe('mep');

      // Tarjeta: 100 USD * 1744 = 174400 ARS
      const tarjetaRes = await service.convert(100, 'USD', 'ARS', 'tarjeta');
      expect(tarjetaRes.result).toBe(174400);
    });

    it('should convert EUR to ARS and ARS to EUR', async () => {
      // 100 EUR * 1220 = 122000 ARS
      const eurToArs = await service.convert(100, 'EUR', 'ARS');
      expect(eurToArs.result).toBe(122000);
      expect(eurToArs.rate).toBe(1220);

      // 122000 ARS / 1220 = 100 EUR
      const arsToEur = await service.convert(122000, 'ARS', 'EUR');
      expect(arsToEur.result).toBe(100);
    });

    it('should convert USDT to ARS and ARS to USDT', async () => {
      // 100 USDT * 1250 = 125000 ARS
      const usdtToArs = await service.convert(100, 'USDT', 'ARS');
      expect(usdtToArs.result).toBe(125000);
      expect(usdtToArs.rate).toBe(1250);

      // 125000 ARS / 1250 = 100 USDT
      const arsToUsdt = await service.convert(125000, 'ARS', 'USDT');
      expect(arsToUsdt.result).toBe(100);
    });

    it('should cross-convert between non-ARS currencies (e.g., USDT to USD blue)', async () => {
      // 100 USDT = 125000 ARS. 125000 ARS / 1240 (blue) = 100.8065 USD
      const result = await service.convert(100, 'USDT', 'USD', 'blue');
      expect(result.from).toBe('USDT');
      expect(result.to).toBe('USD');
      expect(result.result).toBe(100.8065);
    });

    it('should return identity when converting to same currency', async () => {
      const result = await service.convert(500, 'USD', 'USD');
      expect(result.result).toBe(500);
      expect(result.rate).toBe(1);
    });

    it('should be case-insensitive on currency codes and rate types', async () => {
      const result = await service.convert(100, 'usd', 'ars', 'BLUE');
      expect(result.from).toBe('USD');
      expect(result.to).toBe('ARS');
      expect(result.rateType).toBe('blue');
      expect(result.result).toBe(124000);
    });

    it('should throw BadRequestException when amount is <= 0 or invalid', async () => {
      await expect(service.convert(0, 'USD', 'ARS')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.convert(-50, 'USD', 'ARS')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.convert(NaN, 'USD', 'ARS')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when currency is unsupported', async () => {
      await expect(service.convert(100, 'GBP', 'ARS')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.convert(100, 'USD', 'XYZ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when USD rateType is invalid', async () => {
      await expect(service.convert(100, 'USD', 'ARS', 'crypto_fake')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

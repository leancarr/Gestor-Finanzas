import { Test, TestingModule } from '@nestjs/testing';
import { RatesController } from './rates.controller.js';
import { RatesService } from './rates.service.js';
import type { RatesResponse, ConversionResult } from './rates.interface.js';

describe('RatesController', () => {
  let controller: RatesController;
  let service: RatesService;

  const mockRatesResponse: RatesResponse = {
    usd: {
      oficial: {
        currency: 'USD',
        name: 'Dólar Oficial',
        type: 'oficial',
        buy: 1050,
        sell: 1090,
        average: 1070,
        updatedAt: '2026-09-18T12:00:00.000Z',
      },
      blue: {
        currency: 'USD',
        name: 'Dólar Blue',
        type: 'blue',
        buy: 1220,
        sell: 1240,
        average: 1230,
        updatedAt: '2026-09-18T12:00:00.000Z',
      },
      mep: {
        currency: 'USD',
        name: 'Dólar MEP',
        type: 'mep',
        buy: 1195,
        sell: 1210,
        average: 1202.5,
        updatedAt: '2026-09-18T12:00:00.000Z',
      },
      tarjeta: {
        currency: 'USD',
        name: 'Dólar Tarjeta',
        type: 'tarjeta',
        buy: 1710,
        sell: 1744,
        average: 1727,
        updatedAt: '2026-09-18T12:00:00.000Z',
      },
    },
    eur: {
      currency: 'EUR',
      name: 'Euro Oficial',
      type: 'oficial',
      buy: 1150,
      sell: 1220,
      average: 1185,
      updatedAt: '2026-09-18T12:00:00.000Z',
    },
    usdt: {
      currency: 'USDT',
      name: 'USDT',
      type: 'crypto',
      buy: 1230,
      sell: 1250,
      average: 1240,
      updatedAt: '2026-09-18T12:00:00.000Z',
    },
    ars: {
      currency: 'ARS',
      name: 'Peso Argentino',
      type: 'fiat',
      buy: 1,
      sell: 1,
      average: 1,
      updatedAt: '2026-09-18T12:00:00.000Z',
    },
    rates: {} as any,
    source: 'live',
    cached: false,
    timestamp: '2026-09-18T12:00:00.000Z',
  };

  const mockConversionResult: ConversionResult = {
    amount: 100,
    from: 'USD',
    fromCurrency: 'USD',
    to: 'ARS',
    toCurrency: 'ARS',
    rateType: 'blue',
    rate: 1240,
    result: 124000,
    rateDetails: {
      fromRateInArs: 1240,
      toRateInArs: 1,
      quoteUsed: 'sell',
      source: 'live',
    },
    timestamp: '2026-09-18T12:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatesController],
      providers: [
        {
          provide: RatesService,
          useValue: {
            getRates: vi.fn().mockResolvedValue(mockRatesResponse),
            convert: vi.fn().mockResolvedValue(mockConversionResult),
          },
        },
      ],
    }).compile();

    controller = module.get<RatesController>(RatesController);
    service = module.get<RatesService>(RatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRates', () => {
    it('should call ratesService.getRates with false when refresh is not requested', async () => {
      const res = await controller.getRates();
      expect(service.getRates).toHaveBeenCalledWith(false);
      expect(res).toEqual(mockRatesResponse);
    });

    it('should call ratesService.getRates with true when refresh=true', async () => {
      await controller.getRates('true');
      expect(service.getRates).toHaveBeenCalledWith(true);
    });
  });

  describe('convert', () => {
    it('should call ratesService.convert with DTO data on POST', async () => {
      const dto = {
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'ARS',
        rateType: 'blue',
      };

      const res = await controller.convert(dto);
      expect(service.convert).toHaveBeenCalledWith(100, 'USD', 'ARS', 'blue');
      expect(res).toEqual(mockConversionResult);
    });
  });

  describe('convertGet', () => {
    it('should call ratesService.convert with Query data on GET', async () => {
      const query = {
        amount: 50,
        fromCurrency: 'EUR',
        toCurrency: 'ARS',
        rateType: undefined,
      };

      await controller.convertGet(query);
      expect(service.convert).toHaveBeenCalledWith(50, 'EUR', 'ARS', undefined);
    });
  });
});

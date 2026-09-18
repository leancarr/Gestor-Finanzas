import { Test, TestingModule } from '@nestjs/testing';
import { TaxesController } from './taxes.controller.js';
import { TaxesService } from './taxes.service.js';
import {
  TaxCalculationResult,
  TaxCurrency,
  TaxOperationType,
} from './taxes.interface.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';

describe('TaxesController', () => {
  let controller: TaxesController;
  let service: TaxesService;

  const mockResult: TaxCalculationResult = {
    baseAmount: 100,
    taxAmount: 21,
    totalAmount: 121,
    currency: TaxCurrency.ARS,
    breakdown: [{ name: 'IVA (21%)', rate: 0.21, amount: 21 }],
  };

  const mockTaxesService = {
    calculate: vi.fn().mockReturnValue(mockResult),
    getTaxRates: vi.fn().mockReturnValue([]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxesController],
      providers: [
        {
          provide: TaxesService,
          useValue: mockTaxesService,
        },
      ],
    }).compile();

    controller = module.get<TaxesController>(TaxesController);
    service = module.get<TaxesService>(TaxesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('debe tener aplicado el guard SupabaseAuthGuard en el controlador', () => {
    const guards = Reflect.getMetadata('__guards__', TaxesController);
    expect(guards).toBeDefined();
    expect(guards).toContain(SupabaseAuthGuard);
  });

  describe('calculate', () => {
    it('debe delegar el cálculo al TaxesService', () => {
      const dto = {
        amount: 100,
        currency: TaxCurrency.ARS,
        operationType: TaxOperationType.STANDARD,
      };

      const result = controller.calculate(dto);

      expect(mockTaxesService.calculate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getRates', () => {
    it('debe delegar la consulta de tasas al TaxesService', () => {
      controller.getRates(TaxCurrency.ARS, TaxOperationType.STANDARD);

      expect(mockTaxesService.getTaxRates).toHaveBeenCalledWith(
        TaxCurrency.ARS,
        TaxOperationType.STANDARD,
      );
    });
  });
});

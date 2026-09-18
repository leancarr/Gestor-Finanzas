import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TaxesService } from './taxes.service.js';
import {
  DEFAULT_TAX_DEFINITIONS,
  TAX_NAMES,
  TaxCurrency,
  TaxOperationType,
  TaxType,
} from './taxes.interface.js';

describe('TaxesService', () => {
  let service: TaxesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxesService],
    }).compile();

    service = module.get<TaxesService>(TaxesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Cálculo Estándar en Moneda Local (ARS - IVA 21%)', () => {
    it('debe calcular el 21% de IVA para operaciones estándar en ARS con números redondos', () => {
      const result = service.calculate({
        amount: 100,
        currency: TaxCurrency.ARS,
        operationType: TaxOperationType.STANDARD,
      });

      expect(result.baseAmount).toBe(100);
      expect(result.taxAmount).toBe(21);
      expect(result.totalAmount).toBe(121);
      expect(result.currency).toBe(TaxCurrency.ARS);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0]).toEqual({
        name: TAX_NAMES.IVA,
        rate: 0.21,
        amount: 21,
      });
    });

    it('debe inferir ARS y STANDARD por defecto si no se especifican', () => {
      const result = service.calculate({
        amount: 200,
      });

      expect(result.baseAmount).toBe(200);
      expect(result.taxAmount).toBe(42);
      expect(result.totalAmount).toBe(242);
      expect(result.currency).toBe(TaxCurrency.ARS);
      expect(result.breakdown[0].name).toBe(TAX_NAMES.IVA);
    });

    it('debe aceptar baseAmount en lugar de amount como alias transparente', () => {
      const result = service.calculate({
        baseAmount: 1000,
        currency: TaxCurrency.ARS,
      });

      expect(result.baseAmount).toBe(1000);
      expect(result.taxAmount).toBe(210);
      expect(result.totalAmount).toBe(1210);
    });
  });

  describe('Cálculo Internacional (IVA 21% + Impuesto PAIS / Percepciones 30%)', () => {
    it('debe desglosar IVA (21%) y PAIS / Percepciones (30%) en operaciones INTERNATIONAL para USD', () => {
      const result = service.calculate({
        amount: 100,
        currency: TaxCurrency.USD,
        operationType: TaxOperationType.INTERNATIONAL,
      });

      expect(result.baseAmount).toBe(100);
      expect(result.taxAmount).toBe(51); // 21 + 30
      expect(result.totalAmount).toBe(151);
      expect(result.currency).toBe(TaxCurrency.USD);
      expect(result.breakdown).toHaveLength(2);

      const iva = result.breakdown.find((b) => b.name === TAX_NAMES.IVA);
      const pais = result.breakdown.find((b) => b.name === TAX_NAMES.PAIS);

      expect(iva).toBeDefined();
      expect(iva?.rate).toBe(0.21);
      expect(iva?.amount).toBe(21);

      expect(pais).toBeDefined();
      expect(pais?.rate).toBe(0.30);
      expect(pais?.amount).toBe(30);
    });

    it('debe aplicar desglose completo de 51% para EUR en compras internacionales', () => {
      const result = service.calculate({
        amount: 50,
        currency: TaxCurrency.EUR,
        operationType: TaxOperationType.INTERNATIONAL,
      });

      expect(result.baseAmount).toBe(50);
      expect(result.taxAmount).toBe(25.5); // 50 * 0.21 (10.5) + 50 * 0.30 (15)
      expect(result.totalAmount).toBe(75.5);
      expect(result.breakdown).toEqual([
        { name: TAX_NAMES.IVA, rate: 0.21, amount: 10.5 },
        { name: TAX_NAMES.PAIS, rate: 0.30, amount: 15 },
      ]);
    });
  });

  describe('Operaciones Libres de Impuestos (TAX_FREE)', () => {
    it('debe devolver 0 impuestos y desglose Libre de Impuestos cuando se selecciona TAX_FREE', () => {
      const result = service.calculate({
        amount: 500,
        currency: TaxCurrency.USD,
        operationType: TaxOperationType.TAX_FREE,
      });

      expect(result.baseAmount).toBe(500);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(500);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0]).toEqual({
        name: TAX_NAMES.TAX_FREE,
        rate: 0,
        amount: 0,
      });
    });

    it('debe devolver TAX_FREE cuando se pasa explícitamente taxTypes con TAX_FREE', () => {
      const result = service.calculate({
        amount: 350,
        currency: TaxCurrency.ARS,
        taxTypes: [TaxType.TAX_FREE],
      });

      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(350);
      expect(result.breakdown[0].name).toBe(TAX_NAMES.TAX_FREE);
    });
  });

  describe('Soporte Cripto (USDT)', () => {
    it('debe tratar USDT por defecto como Libre de Impuestos (0%)', () => {
      const result = service.calculate({
        amount: 1500,
        currency: TaxCurrency.USDT,
      });

      expect(result.baseAmount).toBe(1500);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1500);
      expect(result.currency).toBe(TaxCurrency.USDT);
      expect(result.breakdown[0].name).toBe(TAX_NAMES.TAX_FREE);
    });

    it('debe permitir aplicar régimen internacional a USDT si se solicita explícitamente', () => {
      const result = service.calculate({
        amount: 100,
        currency: TaxCurrency.USDT,
        operationType: TaxOperationType.INTERNATIONAL,
      });

      expect(result.taxAmount).toBe(51);
      expect(result.totalAmount).toBe(151);
      expect(result.breakdown).toHaveLength(2);
    });
  });

  describe('Precisión Decimal y Redondeo Financiero', () => {
    it('debe redondear correctamente montos impares evitando centavos espurios (ej: 33.33)', () => {
      const result = service.calculate({
        amount: 33.33,
        currency: TaxCurrency.ARS,
        operationType: TaxOperationType.INTERNATIONAL,
      });

      // 33.33 * 0.21 = 6.9993 -> 7.00
      // 33.33 * 0.30 = 9.9990 -> 10.00
      // Total tax = 17.00
      // Total amount = 33.33 + 17.00 = 50.33
      expect(result.baseAmount).toBe(33.33);
      expect(result.taxAmount).toBe(17.00);
      expect(result.totalAmount).toBe(50.33);

      const iva = result.breakdown.find((b) => b.name === TAX_NAMES.IVA);
      const pais = result.breakdown.find((b) => b.name === TAX_NAMES.PAIS);
      expect(iva?.amount).toBe(7.00);
      expect(pais?.amount).toBe(10.00);
    });

    it('debe redondear correctamente 99.99 con IVA y PAIS', () => {
      const result = service.calculate({
        amount: 99.99,
        currency: TaxCurrency.USD,
        operationType: TaxOperationType.INTERNATIONAL,
      });

      // 99.99 * 0.21 = 20.9979 -> 21.00
      // 99.99 * 0.30 = 29.9970 -> 30.00
      // Total tax = 51.00
      // Total = 150.99
      expect(result.baseAmount).toBe(99.99);
      expect(result.taxAmount).toBe(51.00);
      expect(result.totalAmount).toBe(150.99);
    });

    it('debe redondear 1.005 exactamente a 1.01 gracias a Number.EPSILON', () => {
      expect(service.round(1.005, 2)).toBe(1.01);
      expect(service.round(1.004, 2)).toBe(1.00);
      expect(service.round(10.555, 2)).toBe(10.56);
    });

    it('debe soportar precisión configurable de decimales (ej: 4 decimales para cripto)', () => {
      const result = service.calculate({
        amount: 12.3456,
        currency: TaxCurrency.USDT,
        operationType: TaxOperationType.INTERNATIONAL,
        decimals: 4,
      });

      // 12.3456 * 0.21 = 2.592576 -> 2.5926
      // 12.3456 * 0.30 = 3.70368  -> 3.7037
      // taxAmount = 2.5926 + 3.7037 = 6.2963
      // total = 12.3456 + 6.2963 = 18.6419
      expect(result.baseAmount).toBe(12.3456);
      expect(result.taxAmount).toBe(6.2963);
      expect(result.totalAmount).toBe(18.6419);
    });
  });

  describe('Filtro por taxTypes Específicos', () => {
    it('debe aplicar únicamente IVA cuando solo se pide IVA', () => {
      const result = service.calculate({
        amount: 100,
        currency: TaxCurrency.ARS,
        taxTypes: [TaxType.IVA],
      });

      expect(result.taxAmount).toBe(21);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].name).toBe(TAX_NAMES.IVA);
    });

    it('debe aplicar únicamente Impuesto PAIS cuando solo se pide PAIS', () => {
      const result = service.calculate({
        amount: 100,
        currency: TaxCurrency.USD,
        taxTypes: [TaxType.PAIS],
      });

      expect(result.taxAmount).toBe(30);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].name).toBe(TAX_NAMES.PAIS);
    });

    it('debe aplicar ambos impuestos cuando se especifican IVA y PAIS', () => {
      const result = service.calculate({
        amount: 100,
        currency: TaxCurrency.USD,
        taxTypes: [TaxType.IVA, TaxType.PAIS],
      });

      expect(result.taxAmount).toBe(51);
      expect(result.breakdown).toHaveLength(2);
    });
  });

  describe('Tasas Personalizadas (customRates)', () => {
    it('debe calcular impuestos definidos ad-hoc por el usuario', () => {
      const result = service.calculate({
        amount: 1000,
        currency: TaxCurrency.ARS,
        customRates: [
          { name: 'Ingresos Brutos CABA', rate: 0.03 },
          { name: 'Tasa de Sellos', rate: 0.012 },
        ],
      });

      expect(result.baseAmount).toBe(1000);
      expect(result.breakdown).toEqual([
        { name: 'Ingresos Brutos CABA', rate: 0.03, amount: 30 },
        { name: 'Tasa de Sellos', rate: 0.012, amount: 12 },
      ]);
      expect(result.taxAmount).toBe(42);
      expect(result.totalAmount).toBe(1042);
    });

    it('debe normalizar automáticamente tasas ingresadas como porcentaje entero (ej: 21 en vez de 0.21)', () => {
      const result = service.calculate({
        amount: 100,
        customRates: [{ name: 'IVA Especial', rate: 21 }],
      });

      expect(result.breakdown[0].rate).toBe(0.21);
      expect(result.breakdown[0].amount).toBe(21);
      expect(result.taxAmount).toBe(21);
    });
  });

  describe('Configuración Dinámica de Matriz Impositiva', () => {
    afterEach(() => {
      service.resetTaxRates();
    });

    it('debe permitir sobrescribir y consultar las tasas impositivas configuradas', () => {
      // Sobrescribir ARS STANDARD para incluir una tasa municipal además del IVA
      service.setTaxRates(TaxCurrency.ARS, TaxOperationType.STANDARD, [
        DEFAULT_TAX_DEFINITIONS.IVA,
        { name: 'Tasa Municipal', rate: 0.02 },
      ]);

      const result = service.calculate({
        amount: 100,
        currency: TaxCurrency.ARS,
        operationType: TaxOperationType.STANDARD,
      });

      expect(result.taxAmount).toBe(23); // 21 + 2
      expect(result.totalAmount).toBe(123);
      expect(result.breakdown).toHaveLength(2);

      // Verificar que getTaxRates devuelva las nuevas tasas
      const rates = service.getTaxRates(TaxCurrency.ARS, TaxOperationType.STANDARD);
      expect(rates).toHaveLength(2);
    });

    it('debe restaurar los valores por defecto al ejecutar resetTaxRates', () => {
      service.setTaxRates(TaxCurrency.ARS, TaxOperationType.STANDARD, []);
      expect(
        service.getTaxRates(TaxCurrency.ARS, TaxOperationType.STANDARD),
      ).toHaveLength(0);

      service.resetTaxRates();
      expect(
        service.getTaxRates(TaxCurrency.ARS, TaxOperationType.STANDARD),
      ).toHaveLength(1);
    });
  });

  describe('Validaciones y Casos de Error', () => {
    it('debe lanzar BadRequestException si el monto es menor o igual a cero', () => {
      expect(() =>
        service.calculate({
          amount: 0,
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.calculate({
          amount: -50,
        }),
      ).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si el monto no está definido', () => {
      expect(() => service.calculate({} as any)).toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si la moneda no es soportada', () => {
      expect(() =>
        service.calculate({
          amount: 100,
          currency: 'GBP' as any,
        }),
      ).toThrow(BadRequestException);
    });

    it('debe aceptar monedas en minúsculas normalizándolas automáticamente', () => {
      const result = service.calculate({
        amount: 100,
        currency: 'usd' as any,
        operationType: TaxOperationType.STANDARD,
      });

      expect(result.currency).toBe(TaxCurrency.USD);
      expect(result.taxAmount).toBe(21);
    });
  });
});

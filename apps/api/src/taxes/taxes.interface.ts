export enum TaxCurrency {
  ARS = 'ARS',
  USD = 'USD',
  EUR = 'EUR',
  USDT = 'USDT',
}

export enum TaxOperationType {
  STANDARD = 'STANDARD',
  INTERNATIONAL = 'INTERNATIONAL',
  TAX_FREE = 'TAX_FREE',
  CUSTOM = 'CUSTOM',
}

export enum TaxType {
  IVA = 'IVA',
  PAIS = 'PAIS',
  TAX_FREE = 'TAX_FREE',
}

export interface TaxBreakdownItem {
  name: string;
  rate: number;
  amount: number;
}

export interface TaxCalculationResult {
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: TaxCurrency | string;
  breakdown: TaxBreakdownItem[];
}

export interface TaxRateDefinition {
  name: string;
  rate: number;
  description?: string;
}

export type TaxRateMatrix = Record<
  TaxCurrency,
  Record<TaxOperationType, TaxRateDefinition[]>
>;

export const TAX_NAMES = {
  IVA: 'IVA (21%)',
  PAIS: 'Impuesto PAIS / Percepciones (30%)',
  TAX_FREE: 'Libre de impuestos',
} as const;

export const DEFAULT_TAX_DEFINITIONS: Record<string, TaxRateDefinition> = {
  IVA: {
    name: TAX_NAMES.IVA,
    rate: 0.21,
    description: 'Impuesto al Valor Agregado (21%)',
  },
  PAIS: {
    name: TAX_NAMES.PAIS,
    rate: 0.30,
    description: 'Impuesto PAIS y Percepciones de Ganancias / Bienes Personales (30%)',
  },
  TAX_FREE: {
    name: TAX_NAMES.TAX_FREE,
    rate: 0.0,
    description: 'Operación exenta o libre de impuestos',
  },
};

export const DEFAULT_TAX_RATE_MATRIX: TaxRateMatrix = {
  [TaxCurrency.ARS]: {
    [TaxOperationType.STANDARD]: [DEFAULT_TAX_DEFINITIONS.IVA],
    [TaxOperationType.INTERNATIONAL]: [
      DEFAULT_TAX_DEFINITIONS.IVA,
      DEFAULT_TAX_DEFINITIONS.PAIS,
    ],
    [TaxOperationType.TAX_FREE]: [DEFAULT_TAX_DEFINITIONS.TAX_FREE],
    [TaxOperationType.CUSTOM]: [],
  },
  [TaxCurrency.USD]: {
    [TaxOperationType.STANDARD]: [DEFAULT_TAX_DEFINITIONS.IVA],
    [TaxOperationType.INTERNATIONAL]: [
      DEFAULT_TAX_DEFINITIONS.IVA,
      DEFAULT_TAX_DEFINITIONS.PAIS,
    ],
    [TaxOperationType.TAX_FREE]: [DEFAULT_TAX_DEFINITIONS.TAX_FREE],
    [TaxOperationType.CUSTOM]: [],
  },
  [TaxCurrency.EUR]: {
    [TaxOperationType.STANDARD]: [DEFAULT_TAX_DEFINITIONS.IVA],
    [TaxOperationType.INTERNATIONAL]: [
      DEFAULT_TAX_DEFINITIONS.IVA,
      DEFAULT_TAX_DEFINITIONS.PAIS,
    ],
    [TaxOperationType.TAX_FREE]: [DEFAULT_TAX_DEFINITIONS.TAX_FREE],
    [TaxOperationType.CUSTOM]: [],
  },
  [TaxCurrency.USDT]: {
    [TaxOperationType.STANDARD]: [DEFAULT_TAX_DEFINITIONS.TAX_FREE],
    [TaxOperationType.INTERNATIONAL]: [
      DEFAULT_TAX_DEFINITIONS.IVA,
      DEFAULT_TAX_DEFINITIONS.PAIS,
    ],
    [TaxOperationType.TAX_FREE]: [DEFAULT_TAX_DEFINITIONS.TAX_FREE],
    [TaxOperationType.CUSTOM]: [],
  },
};

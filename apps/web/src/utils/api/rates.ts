export type SupportedCurrency =
  | 'ARS'
  | 'USD'
  | 'EUR'
  | 'USDT'
  | 'MXN'
  | 'COP'
  | 'CLP'
  | 'PEN'
  | 'PYG'
  | 'VES'
  | 'GTQ'
  | 'CRC'
  | 'HNL';

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
    description: 'Moneda oficial de Argentina',
    defaultRateToArs: 1,
  },
  USD: {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: 'US$',
    flag: '🇺🇸',
    description: 'Dólar Oficial / MEP / Divisa Global',
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
  MXN: {
    code: 'MXN',
    name: 'Pesos Mexicanos',
    symbol: 'Mex$',
    flag: '🇲🇽',
    description: 'Moneda oficial de México',
    defaultRateToArs: 63.78,
  },
  COP: {
    code: 'COP',
    name: 'Pesos Colombianos',
    symbol: 'COL$',
    flag: '🇨🇴',
    description: 'Moneda oficial de Colombia',
    defaultRateToArs: 0.28,
  },
  CLP: {
    code: 'CLP',
    name: 'Pesos Chilenos',
    symbol: 'CLP$',
    flag: '🇨🇱',
    description: 'Moneda oficial de Chile',
    defaultRateToArs: 1.24,
  },
  PEN: {
    code: 'PEN',
    name: 'Soles Peruanos',
    symbol: 'S/',
    flag: '🇵🇪',
    description: 'Moneda oficial de Perú',
    defaultRateToArs: 314,
  },
  PYG: {
    code: 'PYG',
    name: 'Guaraníes Paraguayos',
    symbol: '₲',
    flag: '🇵🇾',
    description: 'Moneda oficial de Paraguay',
    defaultRateToArs: 0.157,
  },
  VES: {
    code: 'VES',
    name: 'Bolívares Digitales',
    symbol: 'Bs.',
    flag: '🇻🇪',
    description: 'Moneda oficial de Venezuela',
    defaultRateToArs: 32.3,
  },
  GTQ: {
    code: 'GTQ',
    name: 'Quetzales Guatemaltecos',
    symbol: 'Q',
    flag: '🇬🇹',
    description: 'Moneda oficial de Guatemala',
    defaultRateToArs: 152.2,
  },
  CRC: {
    code: 'CRC',
    name: 'Colones Costarricenses',
    symbol: '₡',
    flag: '🇨🇷',
    description: 'Moneda oficial de Costa Rica',
    defaultRateToArs: 2.29,
  },
  HNL: {
    code: 'HNL',
    name: 'Lempiras Hondureños',
    symbol: 'L',
    flag: '🇭🇳',
    description: 'Moneda oficial de Honduras',
    defaultRateToArs: 47.7,
  },
};

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  'ARS',
  'USD',
  'EUR',
  'USDT',
  'MXN',
  'COP',
  'CLP',
  'PEN',
  'PYG',
  'VES',
  'GTQ',
  'CRC',
  'HNL',
];

export const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  ARS: 1,
  USD: 1180,
  EUR: 1285,
  USDT: 1195,
  MXN: 63.78,
  COP: 0.28,
  CLP: 1.24,
  PEN: 314,
  PYG: 0.157,
  VES: 32.3,
  GTQ: 152.2,
  CRC: 2.29,
  HNL: 47.7,
};

export interface RatesResponse {
  base: SupportedCurrency;
  rates: Record<SupportedCurrency, number>;
  lastUpdated: string;
  source?: 'api' | 'fallback';
}

export interface DolarQuoteDetail {
  currency: string;
  name: string;
  type?: string;
  buy: number;
  sell: number;
  average: number;
  updatedAt: string;
  isFallback?: boolean;
}

export interface DetailedRatesResponse {
  base: SupportedCurrency;
  rates: Record<SupportedCurrency, number>;
  usd: {
    blue: DolarQuoteDetail;
    mep: DolarQuoteDetail;
    oficial: DolarQuoteDetail;
    tarjeta: DolarQuoteDetail;
    [key: string]: DolarQuoteDetail;
  };
  eur: DolarQuoteDetail;
  usdt: DolarQuoteDetail;
  lastUpdated: string;
  source: 'api' | 'fallback';
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

export type SupportedCountryCode =
  | 'AR'
  | 'MX'
  | 'CO'
  | 'EC'
  | 'PY'
  | 'PE'
  | 'CL'
  | 'VE'
  | 'GT'
  | 'SV'
  | 'CR'
  | 'HN'
  | 'ES'
  | 'US';

export interface CountryConfig {
  code: SupportedCountryCode;
  name: string;
  flag: string;
  currency: SupportedCurrency;
  currencyName: string;
  taxSchemes: TaxSchemeType[];
  defaultTaxScheme: TaxSchemeType;
}

export type TaxSchemeType =
  // Argentina
  | 'IVA_21'
  | 'DIGITAL_SERVICES'
  | 'TARJETA_60'
  | 'IVA_10_5'
  // México
  | 'IVA_MX_16'
  | 'DIGITAL_MX_8'
  | 'IVA_FRONTERIZO_8'
  // Colombia
  | 'IVA_CO_19'
  | 'IVA_CO_5'
  | 'RETE_FUENTE_CO'
  // Ecuador
  | 'IVA_EC_15'
  | 'IVA_EC_5'
  | 'IVA_EC_0'
  // Paraguay
  | 'IVA_PY_10'
  | 'IVA_PY_5'
  // Perú
  | 'IGV_PE_18'
  | 'DETRACCION_PE_4'
  | 'PERCEPCION_PE_2'
  // Chile
  | 'IVA_CL_19'
  | 'RETENCION_CL_13_75'
  | 'DIGITAL_CL_19'
  // Venezuela
  | 'IVA_VE_16'
  | 'IGTF_VE_3'
  | 'IVA_VE_8'
  // Guatemala
  | 'IVA_GT_12'
  | 'ISR_GT_5'
  | 'PEQ_CONTRIB_GT_5'
  // El Salvador
  | 'IVA_SV_13'
  | 'PERCEPCION_SV_1'
  | 'PAGO_CUENTA_SV_1_75'
  // Costa Rica
  | 'IVA_CR_13'
  | 'IVA_CR_4'
  | 'IVA_CR_2'
  | 'IVA_CR_1'
  // Honduras
  | 'IVA_HN_15'
  | 'ISV_HN_18'
  // España
  | 'IVA_ES_21'
  | 'IVA_ES_10'
  | 'IVA_ES_4'
  // Estados Unidos / Global
  | 'SALES_TAX_US_8'
  | 'SALES_TAX_US_5'
  | 'NO_TAX_US';

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
  // Argentina
  DIGITAL_SERVICES: {
    name: 'Servicios Digitales Exterior (59%)',
    description: 'Consumos en moneda extranjera (Netflix, Spotify, AWS, software, Steam).',
    taxes: [
      { id: 'iva_digital', name: 'IVA Digital', ratePercent: 21, description: 'Impuesto al Valor Agregado sobre servicios del exterior' },
      { id: 'pais_digital', name: 'Impuesto PAÍS Reducido', ratePercent: 8, description: 'Tasa reducida para servicios digitales' },
      { id: 'ganancias', name: 'Percepción Ganancias (RG 5463)', ratePercent: 30, description: 'Percepción a cuenta de Ganancias / Bienes Personales' },
    ],
  },
  IVA_21: {
    name: 'IVA Estándar (21%)',
    description: 'IVA general sobre compras y servicios comerciales en Argentina.',
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

  // México
  IVA_MX_16: {
    name: 'IVA General México (16%)',
    description: 'Impuesto al Valor Agregado estándar aplicado en México.',
    taxes: [
      { id: 'iva_mx_16', name: 'IVA General', ratePercent: 16, description: 'Tasa estándar del 16%' },
    ],
  },
  DIGITAL_MX_8: {
    name: 'Servicios Digitales / ISR (8%)',
    description: 'Retención de plataformas tecnológicas y servicios digitales en México.',
    taxes: [
      { id: 'isr_digital_mx', name: 'Retención ISR/IVA Plataformas', ratePercent: 8, description: 'Retención digital simplificada' },
    ],
  },
  IVA_FRONTERIZO_8: {
    name: 'IVA Fronterizo (8%)',
    description: 'Estímulo fiscal para la región fronteriza norte y sur de México.',
    taxes: [
      { id: 'iva_fronterizo', name: 'IVA Reducido Fronterizo', ratePercent: 8, description: 'Tasa reducida con estímulo fiscal' },
    ],
  },

  // Colombia
  IVA_CO_19: {
    name: 'IVA General Colombia (19%)',
    description: 'Tarifa general de IVA en Colombia.',
    taxes: [
      { id: 'iva_co_19', name: 'IVA General', ratePercent: 19, description: 'Alícuota general del 19%' },
    ],
  },
  IVA_CO_5: {
    name: 'IVA Reducido (5%)',
    description: 'Tarifa preferencial para alimentos básicos y bienes agropecuarios en Colombia.',
    taxes: [
      { id: 'iva_co_5', name: 'IVA Diferencial', ratePercent: 5, description: 'Tasa reducida del 5%' },
    ],
  },
  RETE_FUENTE_CO: {
    name: 'Retención en la Fuente (2.5%)',
    description: 'Retención en la fuente por compras y servicios generales.',
    taxes: [
      { id: 'retefuente_co', name: 'ReteFuente', ratePercent: 2.5, description: 'Retención sobre el pago a proveedores' },
    ],
  },

  // Ecuador
  IVA_EC_15: {
    name: 'IVA General Ecuador (15%)',
    description: 'Tarifa general vigente de IVA en Ecuador.',
    taxes: [
      { id: 'iva_ec_15', name: 'IVA General', ratePercent: 15, description: 'Alícuota general vigente del 15%' },
    ],
  },
  IVA_EC_5: {
    name: 'IVA Construcción (5%)',
    description: 'Tarifa reducida para materiales de construcción y vivienda.',
    taxes: [
      { id: 'iva_ec_5', name: 'IVA Reducido Construcción', ratePercent: 5, description: 'Tarifa especial del 5%' },
    ],
  },
  IVA_EC_0: {
    name: 'IVA Tarifa 0%',
    description: 'Canasta básica familiar, medicinas y educación en Ecuador.',
    taxes: [
      { id: 'iva_ec_0', name: 'Tarifa Exenta 0%', ratePercent: 0, description: 'Exento de IVA' },
    ],
  },

  // Paraguay
  IVA_PY_10: {
    name: 'IVA General Paraguay (10%)',
    description: 'Alícuota general de IVA para bienes y servicios en Paraguay.',
    taxes: [
      { id: 'iva_py_10', name: 'IVA General', ratePercent: 10, description: 'Tasa estándar del 10%' },
    ],
  },
  IVA_PY_5: {
    name: 'IVA Reducido (5%)',
    description: 'Productos canasta familiar, farmacéuticos y alquiler habitacional.',
    taxes: [
      { id: 'iva_py_5', name: 'IVA Reducido Canasta', ratePercent: 5, description: 'Alícuota del 5%' },
    ],
  },

  // Perú
  IGV_PE_18: {
    name: 'IGV Estándar Perú (18%)',
    description: 'Impuesto General a las Ventas (16% IGV + 2% IPM) en Perú.',
    taxes: [
      { id: 'igv_pe', name: 'IGV Base', ratePercent: 16, description: 'Impuesto General a las Ventas' },
      { id: 'ipm_pe', name: 'IPM Municipal', ratePercent: 2, description: 'Impuesto de Promoción Municipal' },
    ],
  },
  DETRACCION_PE_4: {
    name: 'Detracción de Servicios (4%)',
    description: 'Sistema de Pago de Obligaciones Tributarias (SPOT) del 4%.',
    taxes: [
      { id: 'detraccion_pe', name: 'Detracción SPOT', ratePercent: 4, description: 'Depósito en cuenta Banco de la Nación' },
    ],
  },
  PERCEPCION_PE_2: {
    name: 'Percepción IGV (2%)',
    description: 'Régimen de percepción para ventas internas gravadas.',
    taxes: [
      { id: 'percepcion_pe', name: 'Percepción SUNAT', ratePercent: 2, description: 'Percepción anticipada de IGV' },
    ],
  },

  // Chile
  IVA_CL_19: {
    name: 'IVA General Chile (19%)',
    description: 'Impuesto al Valor Agregado estándar para consumos y servicios en Chile.',
    taxes: [
      { id: 'iva_cl_19', name: 'IVA General', ratePercent: 19, description: 'Alícuota general del 19%' },
    ],
  },
  RETENCION_CL_13_75: {
    name: 'Retención Boleta Honorarios (13.75%)',
    description: 'Retención fiscal vigente para boletas de honorarios profesionales.',
    taxes: [
      { id: 'retencion_cl', name: 'Retención SII', ratePercent: 13.75, description: 'Retención anual obligatoria' },
    ],
  },
  DIGITAL_CL_19: {
    name: 'IVA Servicios Digitales (19%)',
    description: 'Aplica a servicios extranjeros remotos y streaming en Chile.',
    taxes: [
      { id: 'iva_digital_cl', name: 'IVA Plataformas Digitales', ratePercent: 19, description: 'Tasa del 19%' },
    ],
  },

  // Venezuela
  IVA_VE_16: {
    name: 'IVA General Venezuela (16%)',
    description: 'Alícuota general de IVA en Venezuela.',
    taxes: [
      { id: 'iva_ve_16', name: 'IVA General', ratePercent: 16, description: 'Tasa general del 16%' },
    ],
  },
  IGTF_VE_3: {
    name: 'IGTF Divisas (3%)',
    description: 'Impuesto a las Grandes Transacciones Financieras en divisas o criptomonedas.',
    taxes: [
      { id: 'igtf_ve', name: 'IGTF Pago Divisa', ratePercent: 3, description: '3% sobre pagos en moneda extranjera' },
    ],
  },
  IVA_VE_8: {
    name: 'IVA Reducido (8%)',
    description: 'Alícuota reducida para transporte y operaciones específicas.',
    taxes: [
      { id: 'iva_ve_8', name: 'IVA Reducido', ratePercent: 8, description: 'Tasa reducida del 8%' },
    ],
  },

  // Guatemala
  IVA_GT_12: {
    name: 'IVA General Guatemala (12%)',
    description: 'Impuesto al Valor Agregado general en Guatemala.',
    taxes: [
      { id: 'iva_gt_12', name: 'IVA General', ratePercent: 12, description: 'Tasa general del 12%' },
    ],
  },
  ISR_GT_5: {
    name: 'ISR Régimen Opcional (5%)',
    description: 'Régimen Opcional Simplificado sobre Ingresos de Actividades Lucrativas.',
    taxes: [
      { id: 'isr_gt_5', name: 'ISR Mensual', ratePercent: 5, description: 'Retención definitiva del 5%' },
    ],
  },
  PEQ_CONTRIB_GT_5: {
    name: 'Pequeño Contribuyente (5%)',
    description: 'Régimen simplificado de Pequeño Contribuyente SAT.',
    taxes: [
      { id: 'peq_contrib_gt', name: 'Tarifa Única Simplificada', ratePercent: 5, description: 'Tarifa del 5%' },
    ],
  },

  // El Salvador
  IVA_SV_13: {
    name: 'IVA General El Salvador (13%)',
    description: 'Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios.',
    taxes: [
      { id: 'iva_sv_13', name: 'IVA General', ratePercent: 13, description: 'Tasa del 13%' },
    ],
  },
  PERCEPCION_SV_1: {
    name: 'Percepción IVA (1%)',
    description: 'Percepción a grandes contribuyentes y compras mayoristas.',
    taxes: [
      { id: 'percepcion_sv', name: 'Percepción', ratePercent: 1, description: 'Percepción del 1%' },
    ],
  },
  PAGO_CUENTA_SV_1_75: {
    name: 'Pago a Cuenta Renta (1.75%)',
    description: 'Anticipo mensual de Impuesto sobre la Renta.',
    taxes: [
      { id: 'pago_cuenta_sv', name: 'Pago a Cuenta', ratePercent: 1.75, description: 'Anticipo del 1.75%' },
    ],
  },

  // Costa Rica
  IVA_CR_13: {
    name: 'IVA General Costa Rica (13%)',
    description: 'Tarifa general de IVA en Costa Rica.',
    taxes: [
      { id: 'iva_cr_13', name: 'IVA General', ratePercent: 13, description: 'Tasa estándar del 13%' },
    ],
  },
  IVA_CR_4: {
    name: 'IVA Servicios de Salud (4%)',
    description: 'Servicios de salud privados y boletos aéreos.',
    taxes: [
      { id: 'iva_cr_4', name: 'IVA Salud', ratePercent: 4, description: 'Tasa reducida del 4%' },
    ],
  },
  IVA_CR_2: {
    name: 'IVA Medicamentos (2%)',
    description: 'Medicamentos y educación privada.',
    taxes: [
      { id: 'iva_cr_2', name: 'IVA Medicamentos/Educación', ratePercent: 2, description: 'Tasa reducida del 2%' },
    ],
  },
  IVA_CR_1: {
    name: 'IVA Canasta Básica (1%)',
    description: 'Productos de la Canasta Básica Tributaria e insumos agropecuarios.',
    taxes: [
      { id: 'iva_cr_1', name: 'IVA Canasta Básica', ratePercent: 1, description: 'Tasa preferencial del 1%' },
    ],
  },

  // Honduras
  IVA_HN_15: {
    name: 'ISV General Honduras (15%)',
    description: 'Impuesto Sobre Ventas general en Honduras.',
    taxes: [
      { id: 'isv_hn_15', name: 'ISV General', ratePercent: 15, description: 'Tasa general del 15%' },
    ],
  },
  ISV_HN_18: {
    name: 'ISV Especial / Licores (18%)',
    description: 'Tarifa especial para licores, cigarrillos y boletos aéreos de primera clase.',
    taxes: [
      { id: 'isv_hn_18', name: 'ISV Especial', ratePercent: 18, description: 'Tasa especial del 18%' },
    ],
  },

  // España
  IVA_ES_21: {
    name: 'IVA General España (21%)',
    description: 'Tipo general de IVA en España.',
    taxes: [
      { id: 'iva_es_21', name: 'IVA General', ratePercent: 21, description: 'Alícuota general del 21%' },
    ],
  },
  IVA_ES_10: {
    name: 'IVA Reducido (10%)',
    description: 'Alimentos, transporte de viajeros y hostelería.',
    taxes: [
      { id: 'iva_es_10', name: 'IVA Reducido', ratePercent: 10, description: 'Tipo reducido del 10%' },
    ],
  },
  IVA_ES_4: {
    name: 'IVA Superreducido (4%)',
    description: 'Alimentos básicos de primera necesidad, libros y medicamentos.',
    taxes: [
      { id: 'iva_es_4', name: 'IVA Superreducido', ratePercent: 4, description: 'Tipo superreducido del 4%' },
    ],
  },

  // Estados Unidos / Global
  SALES_TAX_US_8: {
    name: 'Sales Tax Promedio USA (8.25%)',
    description: 'Impuesto sobre ventas estatal y local combinado promedio en EE.UU.',
    taxes: [
      { id: 'sales_tax_us_8', name: 'State & Local Sales Tax', ratePercent: 8.25, description: 'Sales Tax promedio' },
    ],
  },
  SALES_TAX_US_5: {
    name: 'Sales Tax Reducido (5%)',
    description: 'Impuesto sobre ventas en jurisdicciones con tasas bajas.',
    taxes: [
      { id: 'sales_tax_us_5', name: 'Reduced Sales Tax', ratePercent: 5, description: 'Tasa reducida del 5%' },
    ],
  },
  NO_TAX_US: {
    name: 'Sin Impuestos / Tax-Free (0%)',
    description: 'Estados sin Sales Tax (Delaware, Oregon, Montana, etc.) o artículos exentos.',
    taxes: [
      { id: 'no_tax_us', name: 'Tax Free', ratePercent: 0, description: '0% Impuesto' },
    ],
  },
};

export const SUPPORTED_COUNTRIES: Record<SupportedCountryCode, CountryConfig> = {
  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    currencyName: 'Pesos Argentinos (ARS)',
    taxSchemes: ['IVA_21', 'DIGITAL_SERVICES', 'TARJETA_60', 'IVA_10_5'],
    defaultTaxScheme: 'IVA_21',
  },
  MX: {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    currency: 'MXN',
    currencyName: 'Pesos Mexicanos (MXN)',
    taxSchemes: ['IVA_MX_16', 'DIGITAL_MX_8', 'IVA_FRONTERIZO_8'],
    defaultTaxScheme: 'IVA_MX_16',
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    currencyName: 'Pesos Colombianos (COP)',
    taxSchemes: ['IVA_CO_19', 'IVA_CO_5', 'RETE_FUENTE_CO'],
    defaultTaxScheme: 'IVA_CO_19',
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    currency: 'USD',
    currencyName: 'Dólar Estadounidense (USD)',
    taxSchemes: ['IVA_EC_15', 'IVA_EC_5', 'IVA_EC_0'],
    defaultTaxScheme: 'IVA_EC_15',
  },
  PY: {
    code: 'PY',
    name: 'Paraguay',
    flag: '🇵🇾',
    currency: 'PYG',
    currencyName: 'Guaraníes Paraguayos (PYG)',
    taxSchemes: ['IVA_PY_10', 'IVA_PY_5'],
    defaultTaxScheme: 'IVA_PY_10',
  },
  PE: {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    currency: 'PEN',
    currencyName: 'Soles Peruanos (PEN)',
    taxSchemes: ['IGV_PE_18', 'DETRACCION_PE_4', 'PERCEPCION_PE_2'],
    defaultTaxScheme: 'IGV_PE_18',
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    currencyName: 'Pesos Chilenos (CLP)',
    taxSchemes: ['IVA_CL_19', 'RETENCION_CL_13_75', 'DIGITAL_CL_19'],
    defaultTaxScheme: 'IVA_CL_19',
  },
  VE: {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    currency: 'VES',
    currencyName: 'Bolívares Digitales (VES)',
    taxSchemes: ['IVA_VE_16', 'IGTF_VE_3', 'IVA_VE_8'],
    defaultTaxScheme: 'IVA_VE_16',
  },
  GT: {
    code: 'GT',
    name: 'Guatemala',
    flag: '🇬🇹',
    currency: 'GTQ',
    currencyName: 'Quetzales Guatemaltecos (GTQ)',
    taxSchemes: ['IVA_GT_12', 'ISR_GT_5', 'PEQ_CONTRIB_GT_5'],
    defaultTaxScheme: 'IVA_GT_12',
  },
  SV: {
    code: 'SV',
    name: 'El Salvador',
    flag: '🇸🇻',
    currency: 'USD',
    currencyName: 'Dólar Estadounidense (USD)',
    taxSchemes: ['IVA_SV_13', 'PERCEPCION_SV_1', 'PAGO_CUENTA_SV_1_75'],
    defaultTaxScheme: 'IVA_SV_13',
  },
  CR: {
    code: 'CR',
    name: 'Costa Rica',
    flag: '🇨🇷',
    currency: 'CRC',
    currencyName: 'Colones Costarricenses (CRC)',
    taxSchemes: ['IVA_CR_13', 'IVA_CR_4', 'IVA_CR_2', 'IVA_CR_1'],
    defaultTaxScheme: 'IVA_CR_13',
  },
  HN: {
    code: 'HN',
    name: 'Honduras',
    flag: '🇭🇳',
    currency: 'HNL',
    currencyName: 'Lempiras Hondureños (HNL)',
    taxSchemes: ['IVA_HN_15', 'ISV_HN_18'],
    defaultTaxScheme: 'IVA_HN_15',
  },
  ES: {
    code: 'ES',
    name: 'España',
    flag: '🇪🇸',
    currency: 'EUR',
    currencyName: 'Euros (EUR)',
    taxSchemes: ['IVA_ES_21', 'IVA_ES_10', 'IVA_ES_4'],
    defaultTaxScheme: 'IVA_ES_21',
  },
  US: {
    code: 'US',
    name: 'Estados Unidos (Global)',
    flag: '🇺🇸',
    currency: 'USD',
    currencyName: 'Dólar Estadounidense (USD)',
    taxSchemes: ['SALES_TAX_US_8', 'SALES_TAX_US_5', 'NO_TAX_US'],
    defaultTaxScheme: 'SALES_TAX_US_8',
  },
};

export const ACTIVE_COUNTRY_STORAGE_KEY = 'gestorguita_user_country';

export function getActiveCountry(): CountryConfig {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(ACTIVE_COUNTRY_STORAGE_KEY) as SupportedCountryCode | null;
    if (saved && SUPPORTED_COUNTRIES[saved]) {
      return SUPPORTED_COUNTRIES[saved];
    }
  }
  return SUPPORTED_COUNTRIES.AR;
}

export function setActiveCountry(code: SupportedCountryCode): CountryConfig {
  const config = SUPPORTED_COUNTRIES[code] || SUPPORTED_COUNTRIES.AR;
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_COUNTRY_STORAGE_KEY, config.code);
    window.dispatchEvent(
      new CustomEvent('gestorguita_country_updated', {
        detail: config,
      })
    );
  }
  return config;
}

export function getCurrenciesForCountry(countryCode?: SupportedCountryCode): SupportedCurrency[] {
  const config = countryCode ? SUPPORTED_COUNTRIES[countryCode] : getActiveCountry();
  const base = config.currency;
  const standard: SupportedCurrency[] = ['USD', 'EUR', 'USDT'];
  const list: SupportedCurrency[] = [base, ...standard.filter((c) => c !== base)];
  return list;
}

export function getTaxSchemesForCountry(countryCode?: SupportedCountryCode): TaxSchemeType[] {
  const config = countryCode ? SUPPORTED_COUNTRIES[countryCode] : getActiveCountry();
  return config.taxSchemes;
}

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
            ...FALLBACK_RATES,
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
 * Consulta las cotizaciones detalladas completas (Blue, MEP, Oficial, Tarjeta, Cripto).
 */
export async function getFullRates(): Promise<DetailedRatesResponse> {
  const fallbackDetail = (name: string, type: string, rate: number): DolarQuoteDetail => ({
    currency: 'USD',
    name,
    type,
    buy: Math.round(rate * 0.98 * 100) / 100,
    sell: rate,
    average: Math.round(rate * 0.99 * 100) / 100,
    updatedAt: new Date().toISOString(),
    isFallback: true,
  });

  const fallbackResult: DetailedRatesResponse = {
    base: 'ARS',
    rates: { ...FALLBACK_RATES },
    usd: {
      blue: fallbackDetail('Dólar Blue', 'blue', FALLBACK_RATES.USD),
      mep: fallbackDetail('Dólar MEP / Bolsa', 'mep', 1160),
      oficial: fallbackDetail('Dólar Oficial', 'oficial', 980),
      tarjeta: fallbackDetail('Dólar Tarjeta', 'tarjeta', 1568),
    },
    eur: {
      currency: 'EUR',
      name: 'Euro Oficial',
      type: 'oficial',
      buy: Math.round(FALLBACK_RATES.EUR * 0.98 * 100) / 100,
      sell: FALLBACK_RATES.EUR,
      average: Math.round(FALLBACK_RATES.EUR * 0.99 * 100) / 100,
      updatedAt: new Date().toISOString(),
      isFallback: true,
    },
    usdt: {
      currency: 'USDT',
      name: 'Dólar Cripto (USDT)',
      type: 'crypto',
      buy: Math.round(FALLBACK_RATES.USDT * 0.98 * 100) / 100,
      sell: FALLBACK_RATES.USDT,
      average: Math.round(FALLBACK_RATES.USDT * 0.99 * 100) / 100,
      updatedAt: new Date().toISOString(),
      isFallback: true,
    },
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
  };

  try {
    const res = await fetch(`${API_URL}/rates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.usd) {
        return {
          base: 'ARS',
          rates: {
            ...FALLBACK_RATES,
            ARS: 1,
            USD: data.usd?.blue?.sell || FALLBACK_RATES.USD,
            EUR: data.eur?.sell || FALLBACK_RATES.EUR,
            USDT: data.usdt?.sell || FALLBACK_RATES.USDT,
          },
          usd: {
            blue: data.usd?.blue || fallbackResult.usd.blue,
            mep: data.usd?.mep || fallbackResult.usd.mep,
            oficial: data.usd?.oficial || fallbackResult.usd.oficial,
            tarjeta: data.usd?.tarjeta || fallbackResult.usd.tarjeta,
          },
          eur: data.eur || fallbackResult.eur,
          usdt: data.usdt || fallbackResult.usdt,
          lastUpdated: data.timestamp || data.lastUpdated || new Date().toISOString(),
          source: (data.source as 'api' | 'fallback') || 'api',
        };
      }
    }
  } catch {
    // Retorna fallbackResult si falla la conexión
  }

  return fallbackResult;
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
  currency?: SupportedCurrency,
  scheme?: TaxSchemeType,
  rates: Record<SupportedCurrency, number> = FALLBACK_RATES,
): TaxCalculationResult {
  const activeCountry = getActiveCountry();
  const effectiveCurrency = currency ?? activeCountry.currency;
  const effectiveScheme =
    scheme ??
    (effectiveCurrency === activeCountry.currency
      ? activeCountry.defaultTaxScheme
      : activeCountry.defaultTaxScheme);

  const safeAmount = Math.max(0, isNaN(baseAmount) ? 0 : baseAmount);
  const rateToArs = rates[effectiveCurrency] ?? FALLBACK_RATES[effectiveCurrency] ?? 1;
  const baseAmountArs = Math.round(safeAmount * rateToArs * 100) / 100;

  const definition =
    (effectiveScheme && TAX_SCHEME_DEFINITIONS[effectiveScheme]) ||
    TAX_SCHEME_DEFINITIONS[activeCountry.defaultTaxScheme] ||
    TAX_SCHEME_DEFINITIONS.IVA_21;

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
    currency: effectiveCurrency,
    rateToArs,
    baseAmountArs,
    scheme: effectiveScheme,
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

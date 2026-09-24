import { createClient } from '@/utils/supabase/client';
import { DYNAMIC_API_URL } from './config';
import { FALLBACK_RATES, getRates } from './rates';

export type AssetType =
  | 'CASH_ARS'
  | 'CASH_USD'
  | 'FIXED_TERM'
  | 'CEDEAR'
  | 'CRYPTO'
  | 'OTHER'
  | 'STOCK'
  | 'CURRENCY';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  ticker?: string;
  quantity: number;
  purchasePrice?: number;
  currentPrice?: number;
  currency: string; // 'ARS' | 'USD'
  institution?: string;
  dueDate?: string;
  interestRate?: number; // % TNA
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDistribution {
  type: AssetType;
  totalArs: number;
  totalUsd: number;
  percentage: number;
}

export interface PortfolioSummary {
  totalNetWorthArs: number;
  totalNetWorthUsd: number;
  totalInvestedArs: number;
  totalInvestedUsd: number;
  totalProfitLossArs: number;
  totalProfitLossUsd: number;
  profitLossPercentage: number;
  distribution: AssetDistribution[];
  rates: {
    usdArs: number;
    usdMep?: number;
    usdBlue?: number;
    cryptoUsdt?: number;
    source?: string;
    lastUpdated?: string;
  };
}

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  ticker?: string;
  quantity: number;
  purchasePrice?: number;
  currentPrice?: number;
  currency: string;
  institution?: string;
  dueDate?: string;
  interestRate?: number;
  notes?: string;
}

export type UpdateAssetInput = Partial<CreateAssetInput>;

const API_URL = DYNAMIC_API_URL;

/**
 * Cabeceras de autorización con JWT de Supabase
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Clave de almacenamiento y mock inicial para desarrollo offline / local
 */
const MOCK_INVESTMENTS_STORAGE_KEY = 'gestorguita_mock_investments_v3';

export const INITIAL_MOCK_ASSETS: Asset[] = [
  {
    id: 'asset-aapl',
    name: 'CEDEAR Apple (AAPL)',
    type: 'CEDEAR',
    ticker: 'AAPL',
    quantity: 25,
    purchasePrice: 4200,
    currentPrice: 4850,
    currency: 'ARS',
    institution: 'Bull Market Brokers',
    notes: '25 acciones CEDEAR Apple Inc.',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-spy',
    name: 'CEDEAR SPY (S&P 500)',
    type: 'CEDEAR',
    ticker: 'SPY',
    quantity: 15,
    purchasePrice: 11500,
    currentPrice: 12850,
    currency: 'ARS',
    institution: 'IOL InvertirOnline',
    notes: '15 acciones ETF SPDR S&P 500',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-plazo-fijo-galicia',
    name: 'Plazo Fijo Tradicional',
    type: 'FIXED_TERM',
    quantity: 2000000,
    purchasePrice: 2000000,
    currentPrice: 2060821,
    currency: 'ARS',
    institution: 'Banco Galicia',
    interestRate: 37,
    dueDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    notes: 'Plazo Fijo a 30 días, TNA 37%',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-dolar-mep',
    name: 'Dólar MEP',
    type: 'CASH_USD',
    quantity: 3500,
    purchasePrice: 1,
    currentPrice: 1,
    currency: 'USD',
    institution: 'Balanz',
    notes: '3.500 USD disponibles en cuenta comitente',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-bitcoin',
    name: 'Bitcoin BTC',
    type: 'CRYPTO',
    ticker: 'BTC',
    quantity: 0.065,
    purchasePrice: 58500,
    currentPrice: 64500,
    currency: 'USD',
    institution: 'Hardware Wallet (Trezor)',
    notes: '0.065 BTC reserva en custodia fría',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Sanitiza la lista de activos purgando cualquier valor anómalo o de prueba astronómico
 */
export function sanitizeAssets(assets: Asset[]): Asset[] {
  return assets.filter((asset) => {
    const qty = Number(asset.quantity) || 0;
    const currentPrice = Number(asset.currentPrice) || Number(asset.purchasePrice) || 0;
    const isUsd = (asset.currency || 'ARS').toUpperCase() === 'USD';
    const approxArs = isUsd ? qty * currentPrice * 1200 : qty * currentPrice;

    // Purgar activos con valuación astronómica (> 100.000 millones ARS o > 100M USD) o cantidades irreales
    if (approxArs > 100_000_000_000 || qty > 500_000_000) {
      return false;
    }
    const nameLower = (asset.name || '').toLowerCase();
    const notesLower = (asset.notes || '').toLowerCase();
    if (
      nameLower.includes('trillon') ||
      nameLower.includes('trillón') ||
      notesLower.includes('trillon') ||
      notesLower.includes('trillón')
    ) {
      return false;
    }
    return true;
  });
}

function getLocalAssets(): Asset[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_ASSETS;
  try {
    // Purgar versiones previas con posibles mocks astronómicos
    if (localStorage.getItem('gestorguita_mock_investments_data')) {
      localStorage.removeItem('gestorguita_mock_investments_data');
    }

    const raw = localStorage.getItem(MOCK_INVESTMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = sanitizeAssets(parsed);
        if (sanitized.length > 0) return sanitized;
      }
    }
  } catch {
    // fallback a iniciales
  }
  saveLocalAssets(INITIAL_MOCK_ASSETS);
  return INITIAL_MOCK_ASSETS;
}

function saveLocalAssets(assets: Asset[]) {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = sanitizeAssets(assets);
    localStorage.setItem(MOCK_INVESTMENTS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Silently ignore storage quota or private mode issues
  }
}

/**
 * Calcula localmente el resumen del portafolio (Net Worth, P&L y Distribución)
 */
export async function calculateLocalPortfolioSummary(assets: Asset[]): Promise<PortfolioSummary> {
  let usdRate = FALLBACK_RATES.USD || 1180;
  let mepRate = usdRate;
  let blueRate = Math.round(usdRate * 1.025);
  let cryptoRate = FALLBACK_RATES.USDT || 1195;

  try {
    const liveRates = await getRates('ARS');
    if (liveRates?.rates) {
      if (typeof liveRates.rates.USD === 'number' && !isNaN(liveRates.rates.USD)) {
        usdRate = liveRates.rates.USD;
        mepRate = usdRate;
        blueRate = Math.round(usdRate * 1.025);
      }
      if (typeof liveRates.rates.USDT === 'number' && !isNaN(liveRates.rates.USDT)) {
        cryptoRate = liveRates.rates.USDT;
      }
    }
  } catch {
    // Usa los fallback rates
  }

  let totalNetWorthArs = 0;
  let totalInvestedArs = 0;

  const distributionMap: Record<string, { totalArs: number; totalUsd: number }> = {
    CASH_ARS: { totalArs: 0, totalUsd: 0 },
    CASH_USD: { totalArs: 0, totalUsd: 0 },
    FIXED_TERM: { totalArs: 0, totalUsd: 0 },
    CEDEAR: { totalArs: 0, totalUsd: 0 },
    CRYPTO: { totalArs: 0, totalUsd: 0 },
    OTHER: { totalArs: 0, totalUsd: 0 },
  };

  assets.forEach((asset) => {
    const qty = Number(asset.quantity) || 0;
    const currentPrice = Number(asset.currentPrice) || Number(asset.purchasePrice) || 0;
    const purchasePrice = Number(asset.purchasePrice) || currentPrice;

    const rawType = asset.type as string;
    const normalizedType =
      rawType === 'STOCK'
        ? 'CEDEAR'
        : rawType === 'CURRENCY'
          ? 'CASH_USD'
          : rawType in distributionMap
            ? rawType
            : 'OTHER';

    const isUsd = (asset.currency || 'ARS').toUpperCase() === 'USD';

    let currentValArs = 0;
    let investedValArs = 0;

    if (isUsd) {
      const currentValUsd = qty * currentPrice;
      const investedValUsd = qty * purchasePrice;
      currentValArs = currentValUsd * usdRate;
      investedValArs = investedValUsd * usdRate;

      distributionMap[normalizedType].totalUsd += currentValUsd;
      distributionMap[normalizedType].totalArs += currentValArs;
    } else {
      currentValArs = qty * currentPrice;
      investedValArs = qty * purchasePrice;
      const currentValUsd = currentValArs / usdRate;

      distributionMap[normalizedType].totalArs += currentValArs;
      distributionMap[normalizedType].totalUsd += currentValUsd;
    }

    totalNetWorthArs += currentValArs;
    totalInvestedArs += investedValArs;
  });

  const totalNetWorthUsd = usdRate > 0 ? totalNetWorthArs / usdRate : 0;
  const totalInvestedUsd = usdRate > 0 ? totalInvestedArs / usdRate : 0;
  const totalProfitLossArs = totalNetWorthArs - totalInvestedArs;
  const totalProfitLossUsd = totalNetWorthUsd - totalInvestedUsd;
  const profitLossPercentage =
    totalInvestedArs > 0 ? (totalProfitLossArs / totalInvestedArs) * 100 : 0;

  const distribution: AssetDistribution[] = (Object.keys(distributionMap) as AssetType[])
    .map((type) => {
      const { totalArs, totalUsd } = distributionMap[type];
      const percentage =
        totalNetWorthArs > 0 ? Math.round((totalArs / totalNetWorthArs) * 1000) / 10 : 0;
      return {
        type,
        totalArs: Math.round(totalArs),
        totalUsd: Math.round(totalUsd * 100) / 100,
        percentage,
      };
    })
    .filter((d) => d.totalArs > 0);

  return {
    totalNetWorthArs: Math.round(totalNetWorthArs),
    totalNetWorthUsd: Math.round(totalNetWorthUsd * 100) / 100,
    totalInvestedArs: Math.round(totalInvestedArs),
    totalInvestedUsd: Math.round(totalInvestedUsd * 100) / 100,
    totalProfitLossArs: Math.round(totalProfitLossArs),
    totalProfitLossUsd: Math.round(totalProfitLossUsd * 100) / 100,
    profitLossPercentage: Math.round(profitLossPercentage * 100) / 100,
    distribution,
    rates: {
      usdArs: usdRate,
      usdMep: mepRate,
      usdBlue: blueRate,
      cryptoUsdt: cryptoRate,
      source: 'Gestor-Finanzas Engine',
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Obtener todos los activos con filtro opcional por tipo
 */
export async function getAssets(type?: AssetType): Promise<Asset[]> {
  try {
    const headers = await getAuthHeaders();
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    const res = await fetch(`${API_URL}/investments${query}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizeAssets(data);
        saveLocalAssets(sanitized);
        if (!type) return sanitized;
        if (type === 'CEDEAR' || (type as string) === 'STOCK') {
          return sanitized.filter((a) => a.type === 'CEDEAR' || (a.type as string) === 'STOCK');
        }
        if (type === 'CASH_USD' || type === 'CASH_ARS' || (type as string) === 'CURRENCY') {
          return sanitized.filter(
            (a) => a.type === 'CASH_USD' || a.type === 'CASH_ARS' || (a.type as string) === 'CURRENCY'
          );
        }
        return sanitized.filter((a) => a.type === type);
      }
    }
  } catch {
    // Fallback silencioso a localStorage
  }

  const local = getLocalAssets();
  if (type) {
    if (type === 'CEDEAR' || (type as string) === 'STOCK') {
      return local.filter((a) => a.type === 'CEDEAR' || (a.type as string) === 'STOCK');
    }
    if (type === 'CASH_USD' || type === 'CASH_ARS' || (type as string) === 'CURRENCY') {
      return local.filter(
        (a) => a.type === 'CASH_USD' || a.type === 'CASH_ARS' || (a.type as string) === 'CURRENCY'
      );
    }
    return local.filter((a) => a.type === type);
  }
  return local;
}

/**
 * Obtener un activo específico por ID
 */
export async function getAsset(id: string): Promise<Asset> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/investments/${id}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback local
  }

  const local = getLocalAssets();
  const found = local.find((a) => a.id === id);
  if (!found) {
    throw new Error(`Activo con ID ${id} no encontrado.`);
  }
  return found;
}

/**
 * Obtener resumen financiero del portafolio (Net Worth, P&L, Distribución y Cotizaciones)
 */
export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/investments/summary`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback local
  }

  const localAssets = getLocalAssets();
  return await calculateLocalPortfolioSummary(localAssets);
}

/**
 * Crear un nuevo activo en el portafolio
 */
export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const newAsset: Asset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    type: input.type,
    ticker: input.ticker?.trim().toUpperCase() || undefined,
    quantity: Number(input.quantity) || 0,
    purchasePrice: input.purchasePrice !== undefined ? Number(input.purchasePrice) : undefined,
    currentPrice:
      input.currentPrice !== undefined
        ? Number(input.currentPrice)
        : input.purchasePrice !== undefined
          ? Number(input.purchasePrice)
          : undefined,
    currency: (input.currency || 'ARS').toUpperCase(),
    institution: input.institution?.trim() || undefined,
    dueDate: input.dueDate || undefined,
    interestRate: input.interestRate !== undefined ? Number(input.interestRate) : undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/investments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const created = await res.json();
      const local = getLocalAssets();
      saveLocalAssets([created, ...local.filter((a) => a.id !== created.id)]);
      return created;
    }
  } catch {
    // Fallback offline
  }

  const local = getLocalAssets();
  const updated = [newAsset, ...local];
  saveLocalAssets(updated);
  return newAsset;
}

/**
 * Actualizar un activo existente
 */
export async function updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/investments/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const updated = await res.json();
      const local = getLocalAssets();
      saveLocalAssets(local.map((a) => (a.id === id ? updated : a)));
      return updated;
    }
  } catch {
    // Fallback offline
  }

  const local = getLocalAssets();
  const existing = local.find((a) => a.id === id);
  if (!existing) {
    throw new Error(`Activo con ID ${id} no encontrado.`);
  }

  const updatedAsset: Asset = {
    ...existing,
    ...input,
    quantity: input.quantity !== undefined ? Number(input.quantity) : existing.quantity,
    purchasePrice:
      input.purchasePrice !== undefined ? Number(input.purchasePrice) : existing.purchasePrice,
    currentPrice:
      input.currentPrice !== undefined ? Number(input.currentPrice) : existing.currentPrice,
    interestRate:
      input.interestRate !== undefined ? Number(input.interestRate) : existing.interestRate,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = local.map((a) => (a.id === id ? updatedAsset : a));
  saveLocalAssets(updatedList);
  return updatedAsset;
}

/**
 * Eliminar un activo del portafolio
 */
export async function deleteAsset(id: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/investments/${id}`, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const local = getLocalAssets();
      saveLocalAssets(local.filter((a) => a.id !== id));
      return true;
    }
  } catch {
    // Fallback offline
  }

  const local = getLocalAssets();
  const filtered = local.filter((a) => a.id !== id);
  saveLocalAssets(filtered);
  return true;
}

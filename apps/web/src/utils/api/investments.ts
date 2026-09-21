import { createClient } from '@/utils/supabase/client';
import { DYNAMIC_API_URL } from './config';
import { FALLBACK_RATES, getRates } from './rates';

export type AssetType =
  | 'CASH_ARS'
  | 'CASH_USD'
  | 'FIXED_TERM'
  | 'CEDEAR'
  | 'CRYPTO'
  | 'OTHER';

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
const MOCK_INVESTMENTS_STORAGE_KEY = 'gestorguita_mock_investments_data';

const INITIAL_MOCK_ASSETS: Asset[] = [
  {
    id: 'asset-1',
    name: 'Efectivo y Cuentas a la Vista',
    type: 'CASH_ARS',
    quantity: 650000,
    purchasePrice: 1,
    currentPrice: 1,
    currency: 'ARS',
    institution: 'Banco Galicia',
    notes: 'Liquidez diaria para emergencias y gastos del mes',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-2',
    name: 'Dólares Ahorro Líquidos',
    type: 'CASH_USD',
    quantity: 1800,
    purchasePrice: 1,
    currentPrice: 1,
    currency: 'USD',
    institution: 'Caja de Seguridad / Banco Santander',
    notes: 'Reserva estratégica en billete físico y cuenta USD',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-3',
    name: 'Plazo Fijo Tradicional 30d',
    type: 'FIXED_TERM',
    quantity: 1200000,
    purchasePrice: 1200000,
    currentPrice: 1238000,
    currency: 'ARS',
    institution: 'Banco BBVA',
    dueDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    interestRate: 38.5,
    notes: 'Rendimiento mensual con acreditación al vencimiento',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-4',
    name: 'Apple Inc.',
    type: 'CEDEAR',
    ticker: 'AAPL',
    quantity: 25,
    purchasePrice: 19500,
    currentPrice: 24650,
    currency: 'ARS',
    institution: 'Bull Market Brokers',
    notes: 'Posición de largo plazo en gigante tecnológico',
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-5',
    name: 'SPDR S&P 500 ETF Trust',
    type: 'CEDEAR',
    ticker: 'SPY',
    quantity: 40,
    purchasePrice: 32000,
    currentPrice: 42150,
    currency: 'ARS',
    institution: 'IOL InvertirOnline',
    notes: 'Indexado al mercado de renta variable estadounidense',
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-6',
    name: 'Bitcoin',
    type: 'CRYPTO',
    ticker: 'BTC',
    quantity: 0.055,
    purchasePrice: 59200,
    currentPrice: 68400,
    currency: 'USD',
    institution: 'Hardware Wallet (Trezor)',
    notes: 'HODL reserva de valor digital descentralizada',
    createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asset-7',
    name: 'Ethereum',
    type: 'CRYPTO',
    ticker: 'ETH',
    quantity: 0.95,
    purchasePrice: 2750,
    currentPrice: 3480,
    currency: 'USD',
    institution: 'Lemon Cash',
    notes: 'Ecosistema de contratos inteligentes y DeFi',
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getLocalAssets(): Asset[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_ASSETS;
  try {
    const raw = localStorage.getItem(MOCK_INVESTMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
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
    localStorage.setItem(MOCK_INVESTMENTS_STORAGE_KEY, JSON.stringify(assets));
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

  const distributionMap: Record<AssetType, { totalArs: number; totalUsd: number }> = {
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

    const isUsd = (asset.currency || 'ARS').toUpperCase() === 'USD';

    let currentValArs = 0;
    let investedValArs = 0;

    if (isUsd) {
      const currentValUsd = qty * currentPrice;
      const investedValUsd = qty * purchasePrice;
      currentValArs = currentValUsd * usdRate;
      investedValArs = investedValUsd * usdRate;

      distributionMap[asset.type].totalUsd += currentValUsd;
      distributionMap[asset.type].totalArs += currentValArs;
    } else {
      currentValArs = qty * currentPrice;
      investedValArs = qty * purchasePrice;
      const currentValUsd = currentValArs / usdRate;

      distributionMap[asset.type].totalArs += currentValArs;
      distributionMap[asset.type].totalUsd += currentValUsd;
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
        saveLocalAssets(data);
        return data;
      }
    }
  } catch {
    // Fallback silencioso a localStorage
  }

  const local = getLocalAssets();
  if (type) {
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

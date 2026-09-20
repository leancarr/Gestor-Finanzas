import { createClient } from '@/utils/supabase/client';
import { DYNAMIC_API_URL } from './config';

export type VaultRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface VaultMemberUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface VaultMember {
  id: string;
  vaultId: string;
  userId: string;
  role: VaultRole;
  joinedAt: string;
  user?: VaultMemberUser;
}

export interface Vault {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members?: VaultMember[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    expenses: number;
  };
}

export interface MemberContribution {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  totalPaid: number;
  percentage: number;
}

export interface SettlementParty {
  id: string;
  name: string;
  email: string;
}

export interface Settlement {
  fromUser: SettlementParty;
  toUser: SettlementParty;
  amount: number;
}

export interface VaultBalances {
  totalExpenses: number;
  fairSharePerMember: number;
  memberContributions: MemberContribution[];
  settlements: Settlement[];
}

export interface CreateVaultInput {
  name: string;
  description?: string;
}

export interface UpdateVaultInput {
  name?: string;
  description?: string;
}

export interface AddVaultMemberInput {
  email: string;
  role?: VaultRole;
}

const API_URL = DYNAMIC_API_URL;

/**
 * Obtiene las cabeceras de autorización con el JWT de Supabase si existe una sesión activa.
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
 * Mock data de respaldo para cuando el backend aún no expone los endpoints de bóvedas
 * o durante desarrollo local offline.
 */
const MOCK_VAULTS_STORAGE_KEY = 'gestorguita_mock_vaults_data';

function getLocalMockVaults(): Vault[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MOCK_VAULTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  const initialMock: Vault[] = [
    {
      id: 'vault-1',
      name: 'Casa & Pareja 🏡',
      description: 'Gastos compartidos del hogar, supermercado, servicios y salidas.',
      ownerId: 'current-user',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { expenses: 24 },
      members: [
        {
          id: 'mem-1',
          vaultId: 'vault-1',
          userId: 'current-user',
          role: 'OWNER',
          joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          user: {
            id: 'current-user',
            email: 'yo@gestorguita.com',
            name: 'Yo (Leandro)',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          },
        },
        {
          id: 'mem-2',
          vaultId: 'vault-1',
          userId: 'user-partner',
          role: 'ADMIN',
          joinedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
          user: {
            id: 'user-partner',
            email: 'pareja@gmail.com',
            name: 'Flor (Pareja)',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          },
        },
      ],
    },
    {
      id: 'vault-2',
      name: 'Vacaciones Brasil 2026 🌴',
      description: 'Aéreos, posada en Florianópolis, comidas y paseos.',
      ownerId: 'user-partner',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { expenses: 12 },
      members: [
        {
          id: 'mem-3',
          vaultId: 'vault-2',
          userId: 'user-partner',
          role: 'OWNER',
          joinedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          user: {
            id: 'user-partner',
            email: 'pareja@gmail.com',
            name: 'Flor',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          },
        },
        {
          id: 'mem-4',
          vaultId: 'vault-2',
          userId: 'current-user',
          role: 'MEMBER',
          joinedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          user: {
            id: 'current-user',
            email: 'yo@gestorguita.com',
            name: 'Leandro',
          },
        },
      ],
    },
  ];

  try {
    localStorage.setItem(MOCK_VAULTS_STORAGE_KEY, JSON.stringify(initialMock));
  } catch {
    // Ignore storage issues
  }
  return initialMock;
}

function saveLocalMockVaults(vaults: Vault[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MOCK_VAULTS_STORAGE_KEY, JSON.stringify(vaults));
  } catch {
    // Ignore storage issues
  }
}

/**
 * Obtiene la lista de todas las bóvedas compartidas donde participa el usuario.
 */
export async function getVaults(): Promise<Vault[]> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // Backend offline / not available: fallback to local mock
  }

  return getLocalMockVaults();
}

/**
 * Obtiene el detalle de una bóveda individual por su ID.
 */
export async function getVault(id: string): Promise<Vault> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults/${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // fallback
  }

  const list = getLocalMockVaults();
  const found = list.find((v) => v.id === id);
  if (!found) {
    throw new Error('Bóveda no encontrada');
  }
  return found;
}

/**
 * Crea una nueva bóveda compartida.
 */
export async function createVault(data: CreateVaultInput): Promise<Vault> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // fallback
  }

  // Fallback local
  const vaults = getLocalMockVaults();
  const newVault: Vault = {
    id: `vault-${Date.now()}`,
    name: data.name,
    description: data.description || '',
    ownerId: 'current-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { expenses: 0 },
    members: [
      {
        id: `mem-${Date.now()}`,
        vaultId: `vault-${Date.now()}`,
        userId: 'current-user',
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'current-user',
          email: 'yo@gestorguita.com',
          name: 'Yo (Administrador)',
        },
      },
    ],
  };

  vaults.unshift(newVault);
  saveLocalMockVaults(vaults);
  return newVault;
}

/**
 * Actualiza los datos de una bóveda existente.
 */
export async function updateVault(id: string, data: UpdateVaultInput): Promise<Vault> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // fallback
  }

  const vaults = getLocalMockVaults();
  const index = vaults.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new Error('Bóveda no encontrada');
  }

  vaults[index] = {
    ...vaults[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  saveLocalMockVaults(vaults);
  return vaults[index];
}

/**
 * Elimina una bóveda compartida.
 */
export async function deleteVault(id: string): Promise<{ success: boolean; id: string }> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // fallback
  }

  const vaults = getLocalMockVaults();
  const filtered = vaults.filter((v) => v.id !== id);
  saveLocalMockVaults(filtered);
  return { success: true, id };
}

/**
 * Añade o invita a un nuevo miembro a la bóveda por email.
 */
export async function addVaultMember(
  vaultId: string,
  data: AddVaultMemberInput,
): Promise<VaultMember> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults/${vaultId}/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // fallback
  }

  const vaults = getLocalMockVaults();
  const vault = vaults.find((v) => v.id === vaultId);
  if (!vault) {
    throw new Error('Bóveda no encontrada');
  }

  const newMember: VaultMember = {
    id: `mem-${Date.now()}`,
    vaultId,
    userId: `user-${Date.now()}`,
    role: data.role || 'MEMBER',
    joinedAt: new Date().toISOString(),
    user: {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.email.split('@')[0],
    },
  };

  vault.members = [...(vault.members || []), newMember];
  saveLocalMockVaults(vaults);
  return newMember;
}

/**
 * Elimina un miembro de la bóveda compartida.
 */
export async function removeVaultMember(
  vaultId: string,
  memberUserId: string,
): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults/${vaultId}/members/${memberUserId}`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // fallback
  }

  const vaults = getLocalMockVaults();
  const vault = vaults.find((v) => v.id === vaultId);
  if (vault && vault.members) {
    vault.members = vault.members.filter((m) => m.userId !== memberUserId);
    saveLocalMockVaults(vaults);
  }

  return { success: true };
}

/**
 * Obtiene el balance, aportes por miembro y sugerencias de compensaciones (settlements) de la bóveda.
 */
export async function getVaultBalances(vaultId: string): Promise<VaultBalances> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/vaults/${vaultId}/balances`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // fallback
  }

  // Generación mock dinámica basada en los miembros actuales de la bóveda
  const vaults = getLocalMockVaults();
  const vault = vaults.find((v) => v.id === vaultId);
  const members = vault?.members || [];

  if (members.length === 0) {
    return {
      totalExpenses: 0,
      fairSharePerMember: 0,
      memberContributions: [],
      settlements: [],
    };
  }

  // Mock balance representativo
  const total = vaultId === 'vault-2' ? 450000 : 320000;
  const count = members.length;
  const fairShare = Math.round(total / count);

  // Distribuir aportes para que haya una deuda a saldar
  const contributions: MemberContribution[] = members.map((m, idx) => {
    let paid = 0;
    if (idx === 0) {
      paid = Math.round(total * 0.65);
    } else if (idx === 1) {
      paid = Math.round(total * 0.35);
    } else {
      paid = 0;
    }
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
    return {
      userId: m.userId,
      name: m.user?.name || m.user?.email || 'Miembro',
      email: m.user?.email || '',
      avatarUrl: m.user?.avatarUrl,
      totalPaid: paid,
      percentage: pct,
    };
  });

  const settlements: Settlement[] = [];
  if (contributions.length >= 2) {
    const payer = contributions[0]; // pagó más
    const debtor = contributions[1]; // pagó menos
    const diff = fairShare - debtor.totalPaid;
    if (diff > 0) {
      settlements.push({
        fromUser: {
          id: debtor.userId,
          name: debtor.name,
          email: debtor.email,
        },
        toUser: {
          id: payer.userId,
          name: payer.name,
          email: payer.email,
        },
        amount: diff,
      });
    }
  }

  return {
    totalExpenses: total,
    fairSharePerMember: fairShare,
    memberContributions: contributions,
    settlements,
  };
}

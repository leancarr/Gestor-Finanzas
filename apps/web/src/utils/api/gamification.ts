import { createClient } from '@/utils/supabase/client';
import { DYNAMIC_API_URL } from './config';

export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  targetDays: number;
  currentStreak: number;
  bestStreak: number;
  status: ChallengeStatus;
  startDate: string;
  completedAt?: string;
  badgeIcon: string;
  badgeName: string;
  targetCategoryId?: string;
}

export interface BadgeEarned {
  id: string;
  badgeName: string;
  badgeIcon: string;
  unlockedAt: string;
  challengeTitle: string;
}

export interface GamificationOverview {
  savingStreak: number;
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  badgesEarned: BadgeEarned[];
}

export interface TagSummary {
  tag: string;
  totalAmount: number;
  currency: string;
  count: number;
  firstDate: string;
  lastDate: string;
}

export interface CreateChallengeInput {
  title: string;
  description?: string;
  targetDays: number;
  badgeIcon?: string;
  badgeName?: string;
  targetCategoryId?: string;
}

const API_URL = DYNAMIC_API_URL;
const GAMIFICATION_STORAGE_KEY = 'gestorguita_gamification_data';
const TAGS_STORAGE_KEY = 'gestorguita_tags_data';

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
 * Datos mock iniciales para soporte offline o cuando el backend aún no expone la ruta.
 */
function getLocalMockGamification(): GamificationOverview {
  if (typeof window === 'undefined') {
    return {
      savingStreak: 7,
      activeChallenges: [],
      completedChallenges: [],
      badgesEarned: [],
    };
  }

  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignorar error de parsing y usar fallback
  }

  const initialData: GamificationOverview = {
    savingStreak: 7,
    activeChallenges: [
      {
        id: 'challenge-1',
        title: 'Mano de hierro: No pedir delivery por 14 días',
        description: 'Evitá apps de delivery (PedidosYa, Rappi) y cociná en casa para blindar tu presupuesto.',
        targetDays: 14,
        currentStreak: 8,
        bestStreak: 8,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 8 * 86400000).toISOString(),
        badgeIcon: 'Shield',
        badgeName: 'Guardián del Ahorro',
      },
      {
        id: 'challenge-2',
        title: 'Ninja del Ahorro: 7 días sin gastos hormiga',
        description: 'Eliminá cafés al paso, golosinas y compras impulsivas diarias menores a $5.000.',
        targetDays: 7,
        currentStreak: 4,
        bestStreak: 4,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 4 * 86400000).toISOString(),
        badgeIcon: 'Zap',
        badgeName: 'Reflejos Ninja',
      },
    ],
    completedChallenges: [
      {
        id: 'challenge-3',
        title: 'Hogar Dulce Hogar: Cocinar en casa 5 días seguidos',
        description: 'Prepará almuerzos y cenas caseros de lunes a viernes.',
        targetDays: 5,
        currentStreak: 5,
        bestStreak: 5,
        status: 'COMPLETED',
        startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
        completedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        badgeIcon: 'Trophy',
        badgeName: 'Master Chef Financiero',
      },
    ],
    badgesEarned: [
      {
        id: 'badge-1',
        badgeName: 'Master Chef Financiero',
        badgeIcon: 'Trophy',
        unlockedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        challengeTitle: 'Hogar Dulce Hogar: Cocinar en casa 5 días seguidos',
      },
      {
        id: 'badge-0',
        badgeName: 'Chispa Inicial 🔥',
        badgeIcon: 'Flame',
        unlockedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        challengeTitle: 'Racha inicial de consistencia financiera',
      },
      {
        id: 'badge-2',
        badgeName: 'Pacto de Acero',
        badgeIcon: 'Medal',
        unlockedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        challengeTitle: 'Primer reto creado y activado',
      },
    ],
  };

  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(initialData));
  } catch {
    // Silencioso
  }

  return initialData;
}

function saveLocalMockGamification(data: GamificationOverview) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silencioso
  }
}

/**
 * Obtiene el resumen consolidado de gamificación (racha, retos activos, completados y medallas).
 */
export async function getGamificationOverview(): Promise<GamificationOverview> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/gamification/overview`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      saveLocalMockGamification(data);
      return data;
    }
  } catch {
    // Red no disponible, usar fallback offline
  }

  return getLocalMockGamification();
}

/**
 * Crea un nuevo reto de ahorro.
 */
export async function createChallenge(
  data: CreateChallengeInput,
): Promise<Challenge> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/gamification/challenges`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const challenge = await res.json();
      // Sincronizar en cache local
      const local = getLocalMockGamification();
      local.activeChallenges.unshift(challenge);
      saveLocalMockGamification(local);
      return challenge;
    }
  } catch {
    // Fallback offline
  }

  // Creación local offline
  const local = getLocalMockGamification();
  const newChallenge: Challenge = {
    id: `challenge-${Date.now()}`,
    title: data.title,
    description: data.description || '',
    targetDays: Number(data.targetDays) || 7,
    currentStreak: 0,
    bestStreak: 0,
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    badgeIcon: data.badgeIcon || 'Trophy',
    badgeName: data.badgeName || 'Campeón del Ahorro',
    targetCategoryId: data.targetCategoryId,
  };

  local.activeChallenges.unshift(newChallenge);
  saveLocalMockGamification(local);
  return newChallenge;
}

/**
 * Registra el check-in diario de racha general y/o para un reto particular.
 */
export async function checkInStreak(
  challengeId?: string,
): Promise<{
  success: boolean;
  savingStreak: number;
  completedChallenge?: Challenge;
  newBadge?: BadgeEarned;
}> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/gamification/check-in`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ challengeId }),
    });

    if (res.ok) {
      const result = await res.json();
      return result;
    }
  } catch {
    // Fallback offline
  }

  const local = getLocalMockGamification();
  local.savingStreak += 1;

  let completedChallenge: Challenge | undefined;
  let newBadge: BadgeEarned | undefined;

  if (challengeId) {
    const chIndex = local.activeChallenges.findIndex((c) => c.id === challengeId);
    if (chIndex !== -1) {
      const ch = local.activeChallenges[chIndex];
      ch.currentStreak += 1;
      if (ch.currentStreak > ch.bestStreak) {
        ch.bestStreak = ch.currentStreak;
      }

      if (ch.currentStreak >= ch.targetDays) {
        ch.status = 'COMPLETED';
        ch.completedAt = new Date().toISOString();
        local.activeChallenges.splice(chIndex, 1);
        local.completedChallenges.unshift(ch);
        completedChallenge = ch;

        newBadge = {
          id: `badge-${Date.now()}`,
          badgeName: ch.badgeName,
          badgeIcon: ch.badgeIcon,
          unlockedAt: new Date().toISOString(),
          challengeTitle: ch.title,
        };
        local.badgesEarned.unshift(newBadge);
      }
    }
  } else if (local.activeChallenges.length > 0) {
    // Check-in global a todos los retos activos
    local.activeChallenges.forEach((ch) => {
      ch.currentStreak += 1;
      if (ch.currentStreak > ch.bestStreak) ch.bestStreak = ch.currentStreak;
    });
  }

  saveLocalMockGamification(local);
  return {
    success: true,
    savingStreak: local.savingStreak,
    completedChallenge,
    newBadge,
  };
}

/**
 * Elimina o cancela un reto.
 */
export async function deleteChallenge(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/gamification/challenges/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // Fallback offline
  }

  const local = getLocalMockGamification();
  local.activeChallenges = local.activeChallenges.filter((c) => c.id !== id);
  local.completedChallenges = local.completedChallenges.filter((c) => c.id !== id);
  saveLocalMockGamification(local);
  return { success: true, id };
}

/**
 * Obtiene el resumen de hashtags y eventos registrados en las transacciones.
 */
export async function getTagsSummary(): Promise<TagSummary[]> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${API_URL}/expenses/tags/summary`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // Fallback offline
  }

  // Fallback offline enriquecido
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(TAGS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // continuar
    }
  }

  const initialTags: TagSummary[] = [
    {
      tag: '#ViajeBariloche',
      totalAmount: 342500,
      currency: 'ARS',
      count: 7,
      firstDate: new Date(Date.now() - 25 * 86400000).toISOString(),
      lastDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      tag: '#CenaFinDeAno',
      totalAmount: 98000,
      currency: 'ARS',
      count: 3,
      firstDate: new Date(Date.now() - 40 * 86400000).toISOString(),
      lastDate: new Date(Date.now() - 38 * 86400000).toISOString(),
    },
    {
      tag: '#Vacaciones2026',
      totalAmount: 520000,
      currency: 'ARS',
      count: 11,
      firstDate: new Date(Date.now() - 60 * 86400000).toISOString(),
      lastDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      tag: '#Mudanza',
      totalAmount: 185000,
      currency: 'ARS',
      count: 5,
      firstDate: new Date(Date.now() - 80 * 86400000).toISOString(),
      lastDate: new Date(Date.now() - 65 * 86400000).toISOString(),
    },
    {
      tag: '#CumpleaniosFlor',
      totalAmount: 64200,
      currency: 'ARS',
      count: 4,
      firstDate: new Date(Date.now() - 18 * 86400000).toISOString(),
      lastDate: new Date(Date.now() - 17 * 86400000).toISOString(),
    },
  ];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(initialTags));
    } catch {
      // Silencioso
    }
  }

  return initialTags;
}

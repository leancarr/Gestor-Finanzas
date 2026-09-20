'use client';

import { useSyncExternalStore } from 'react';
import { Vault } from '@/utils/api/vaults';

interface VaultStoreState {
  activeVault: Vault | null;
  activeVaultId: string | null;
}

const STORAGE_KEY = 'gestorguita_active_vault_state';

// In-memory state
let currentState: VaultStoreState = {
  activeVault: null,
  activeVaultId: null,
};

// Listeners set
const listeners = new Set<() => void>();

// Hydrate initial state from localStorage safely in browser
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        currentState = {
          activeVault: parsed.activeVault || null,
          activeVaultId: parsed.activeVault?.id || null,
        };
      }
    }
  } catch {
    // ignore storage read errors
  }
}

function notify() {
  listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch {
      // ignore storage write errors
    }
  }
}

export const vaultStore = {
  getState: (): VaultStoreState => currentState,

  setActiveVault: (vault: Vault | null) => {
    currentState = {
      activeVault: vault,
      activeVaultId: vault ? vault.id : null,
    };
    notify();
  },

  clearActiveVault: () => {
    currentState = {
      activeVault: null,
      activeVaultId: null,
    };
    notify();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

const serverSnapshot: VaultStoreState = {
  activeVault: null,
  activeVaultId: null,
};

/**
 * Hook para consumir y actualizar el estado de la bóveda activa en cualquier componente de React.
 */
export function useVaultStore(): VaultStoreState & {
  setActiveVault: (vault: Vault | null) => void;
  clearActiveVault: () => void;
} {
  const state = useSyncExternalStore(
    vaultStore.subscribe,
    vaultStore.getState,
    () => serverSnapshot,
  );

  return {
    ...state,
    setActiveVault: vaultStore.setActiveVault,
    clearActiveVault: vaultStore.clearActiveVault,
  };
}

export default useVaultStore;

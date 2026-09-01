import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SyncDB extends DBSchema {
  'offline-requests': {
    key: string;
    value: {
      id: string;
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SyncDB>> | null = null;

export function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<SyncDB>('offline-sync-db', 1, {
      upgrade(db) {
        db.createObjectStore('offline-requests', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function addOfflineRequest(request: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body: any;
}) {
  const db = await getDB();
  if (!db) return;
  const id = crypto.randomUUID();
  await db.put('offline-requests', {
    id,
    url: request.url,
    method: request.method,
    headers: request.headers || {},
    body: JSON.stringify(request.body),
    timestamp: Date.now(),
  });
  return id;
}

export async function getOfflineRequests() {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll('offline-requests');
}

export async function removeOfflineRequest(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete('offline-requests', id);
}

export async function countOfflineRequests() {
  const db = await getDB();
  if (!db) return 0;
  return await db.count('offline-requests');
}

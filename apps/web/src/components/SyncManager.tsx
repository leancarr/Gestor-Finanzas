'use client';

import { useEffect, useState, useCallback } from 'react';
import { getOfflineRequests, removeOfflineRequest, countOfflineRequests } from '@/utils/offline-sync-db';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function SyncManager() {
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const checkOfflineCount = useCallback(async () => {
    const count = await countOfflineRequests();
    setOfflineCount(count);
  }, []);

  const syncOfflineRequests = useCallback(async () => {
    if (isSyncing) return;
    const requests = await getOfflineRequests();
    if (requests.length === 0) return;

    setIsSyncing(true);
    for (const req of requests) {
      try {
        const res = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        if (res.ok || res.status >= 400) {
          await removeOfflineRequest(req.id);
        }
      } catch {
        // Still offline or error
      }
    }
    await checkOfflineCount();
    setIsSyncing(false);
  }, [isSyncing, checkOfflineCount]);

  useEffect(() => {
    checkOfflineCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineRequests();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check periodically in case of unhandled changes
    const interval = setInterval(checkOfflineCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncOfflineRequests, checkOfflineCount]);

  if (offlineCount === 0 && isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-300 shadow-xl">
        <Cloud className="w-4 h-4 text-emerald-400" />
        <span>Sincronizado</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-rose-500/30 text-xs font-medium text-slate-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
      {!isOnline ? (
        <CloudOff className="w-4 h-4 text-rose-400" />
      ) : isSyncing ? (
        <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
      ) : (
        <Cloud className="w-4 h-4 text-amber-400" />
      )}
      <span>
        {isSyncing ? 'Sincronizando...' : `${offlineCount} pdtes`}
      </span>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { flushOutboxQueue, getOutboxQueue, onSyncComplete } from '../utils/storage/syncEngine';
import { isUserScope } from '../utils/storage/storageScope';

export const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncState, setSyncState] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [pendingCount, setPendingCount] = useState(0);

  const updatePending = useCallback(() => {
    const q = getOutboxQueue();
    setPendingCount(q.length);
  }, []);

  const handleTriggerSync = useCallback(async () => {
    if (!isOnline || !isUserScope()) return;
    setSyncState('syncing');
    try {
      const res = await flushOutboxQueue();
      if (res.status === 'completed' && res.failedCount === 0) {
        setSyncState('synced');
        setTimeout(() => setSyncState('idle'), 3000);
      } else if (res.status === 'offline') {
        setSyncState('error');
      } else if (res.failedCount > 0) {
        setSyncState('error');
      } else {
        setSyncState('idle');
      }
    } catch (e) {
      setSyncState('error');
    } finally {
      updatePending();
    }
  }, [isOnline, updatePending]);

  useEffect(() => {
    updatePending();

    const handleOnline = () => {
      setIsOnline(true);
      handleTriggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    const unsubSync = onSyncComplete((data) => {
      setPendingCount(data.remaining || 0);
      if (data.failedCount > 0) {
        setSyncState('error');
      } else {
        setSyncState('synced');
        setTimeout(() => setSyncState('idle'), 3000);
      }
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      unsubSync();
    };
  }, [handleTriggerSync, updatePending]);

  // Render minimal accessible status badge
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
      style={{
        backgroundColor: !isOnline
          ? '#FEF3C7'
          : syncState === 'syncing'
          ? '#E0F2FE'
          : syncState === 'error'
          ? '#FEE2E2'
          : syncState === 'synced'
          ? '#DCFCE7'
          : '#F1F5F9',
        color: !isOnline
          ? '#92400E'
          : syncState === 'syncing'
          ? '#0369A1'
          : syncState === 'error'
          ? '#991B1B'
          : syncState === 'synced'
          ? '#166534'
          : '#475569',
        border: '1px solid currentColor',
        borderColor: !isOnline
          ? '#FDE68A'
          : syncState === 'syncing'
          ? '#BAE6FD'
          : syncState === 'error'
          ? '#FECACA'
          : syncState === 'synced'
          ? '#BBF7D0'
          : '#E2E8F0'
      }}
    >
      {!isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Offline {pendingCount > 0 && `(${pendingCount} chờ sync)`}</span>
        </>
      ) : syncState === 'syncing' ? (
        <>
          <span className="inline-block animate-spin">🔄</span>
          <span>Đang đồng bộ...</span>
        </>
      ) : syncState === 'error' ? (
        <>
          <span>⚠️</span>
          <span>Lỗi sync</span>
          <button
            onClick={handleTriggerSync}
            className="underline ml-1 font-bold hover:opacity-80"
            aria-label="Thử đồng bộ lại"
          >
            Thử lại
          </button>
        </>
      ) : syncState === 'synced' ? (
        <>
          <span>✓</span>
          <span>Đã đồng bộ</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Online</span>
          {pendingCount > 0 && (
            <button
              onClick={handleTriggerSync}
              className="ml-1 px-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
              title="Đồng bộ ngay"
            >
              Sync ({pendingCount})
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default SyncStatus;

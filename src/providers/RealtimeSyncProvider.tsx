import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import type { SyncableTable } from '@/hooks/useExternalSync';

interface SyncEvent {
  table: string;
  event: string;
  timestamp: Date;
  success?: boolean;
}

interface RealtimeSyncContextType {
  isActive: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  lastSyncEvents: SyncEvent[];
  syncingTables: Set<string>;
}

const RealtimeSyncContext = createContext<RealtimeSyncContextType | null>(null);

// Priority tables for realtime sync
const REALTIME_TABLES: SyncableTable[] = [
  'contact_submissions',
  'lead_interacoes',
  'lead_notas',
  'processos',
  'processos_andamentos',
  'processos_prazos',
  'acordos_financeiros',
  'parcelas_financeiras',
  'despesas',
  'profiles',
];

interface RealtimeSyncProviderProps {
  children: ReactNode;
  tables?: SyncableTable[];
}

export function RealtimeSyncProvider({ 
  children, 
  tables = REALTIME_TABLES 
}: RealtimeSyncProviderProps) {
  const [enabled, setEnabled] = useState(true);
  const [lastSyncEvents, setLastSyncEvents] = useState<SyncEvent[]>([]);
  const [syncingTables, setSyncingTables] = useState<Set<string>>(new Set());

  const handleSyncStart = useCallback((table: string, event: string) => {
    setSyncingTables(prev => new Set(prev).add(table));
    setLastSyncEvents(prev => [
      { table, event, timestamp: new Date() },
      ...prev.slice(0, 19) // Keep last 20 events
    ]);
  }, []);

  const handleSyncComplete = useCallback((table: string, event: string, success: boolean) => {
    setSyncingTables(prev => {
      const next = new Set(prev);
      next.delete(table);
      return next;
    });
    setLastSyncEvents(prev => 
      prev.map((e, i) => 
        i === 0 && e.table === table && e.event === event 
          ? { ...e, success } 
          : e
      )
    );
  }, []);

  const handleError = useCallback((table: string, error: Error) => {
    console.error(`[RealtimeSyncProvider] Sync error for ${table}:`, error);
  }, []);

  const { isActive } = useRealtimeSync({
    tables,
    enabled,
    onSyncStart: handleSyncStart,
    onSyncComplete: handleSyncComplete,
    onError: handleError
  });

  return (
    <RealtimeSyncContext.Provider value={{
      isActive,
      enabled,
      setEnabled,
      lastSyncEvents,
      syncingTables
    }}>
      {children}
    </RealtimeSyncContext.Provider>
  );
}

export function useRealtimeSyncContext() {
  const context = useContext(RealtimeSyncContext);
  if (!context) {
    throw new Error('useRealtimeSyncContext must be used within RealtimeSyncProvider');
  }
  return context;
}

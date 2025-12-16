import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SyncableTable } from './useExternalSync';

interface RealtimeSyncOptions {
  tables: SyncableTable[];
  enabled?: boolean;
  onSyncStart?: (table: string, event: string) => void;
  onSyncComplete?: (table: string, event: string, success: boolean) => void;
  onError?: (table: string, error: Error) => void;
}

async function pushToExternalAPI(table: string, data: Record<string, unknown>) {
  const response = await supabase.functions.invoke('sync-external-db', {
    body: { action: 'push', table, data }
  });
  
  if (response.error) {
    throw new Error(response.error.message);
  }
  
  return response.data;
}

async function deleteFromExternalAPI(table: string, id: string) {
  const response = await supabase.functions.invoke('sync-external-db', {
    body: { action: 'delete-external', table, id }
  });
  
  if (response.error) {
    throw new Error(response.error.message);
  }
  
  return response.data;
}

export function useRealtimeSync({
  tables,
  enabled = true,
  onSyncStart,
  onSyncComplete,
  onError
}: RealtimeSyncOptions) {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!enabled || tables.length === 0) {
      return;
    }

    console.log('[RealtimeSync] Initializing realtime sync for tables:', tables);

    // Create channels for each table
    const channels = tables.map(table => {
      const channel = supabase
        .channel(`realtime-sync-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          async (payload) => {
            const eventType = payload.eventType;
            console.log(`[RealtimeSync] ${eventType} on ${table}:`, payload);

            try {
              onSyncStart?.(table, eventType);

              if (eventType === 'INSERT' || eventType === 'UPDATE') {
                // Push the new/updated data to external
                await pushToExternalAPI(table, payload.new as Record<string, unknown>);
                console.log(`[RealtimeSync] Successfully pushed ${eventType} to external for ${table}`);
              } else if (eventType === 'DELETE') {
                // Delete from external
                const oldRecord = payload.old as Record<string, unknown>;
                if (oldRecord.id) {
                  await deleteFromExternalAPI(table, oldRecord.id as string);
                  console.log(`[RealtimeSync] Successfully deleted from external for ${table}`);
                }
              }

              onSyncComplete?.(table, eventType, true);
            } catch (error) {
              console.error(`[RealtimeSync] Error syncing ${eventType} on ${table}:`, error);
              onSyncComplete?.(table, eventType, false);
              onError?.(table, error instanceof Error ? error : new Error(String(error)));
            }
          }
        )
        .subscribe((status) => {
          console.log(`[RealtimeSync] Channel ${table} status:`, status);
        });

      return channel;
    });

    channelsRef.current = channels;

    // Cleanup function
    return () => {
      console.log('[RealtimeSync] Cleaning up realtime channels');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [tables.join(','), enabled]);

  return {
    isActive: channelsRef.current.length > 0
  };
}

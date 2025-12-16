import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import type { SyncAction, SyncResult, SyncProgress } from '@/types/sync';

export const SYNCABLE_TABLES = [
  'contact_submissions',
  'lead_interacoes',
  'lead_notas',
  'lead_comunicacoes',
  'processos',
  'processos_andamentos',
  'processos_prazos',
  'processos_documentos',
  'processos_historico',
  'documentos_drive',
  'acordos_financeiros',
  'parcelas_financeiras',
  'historico_pagamentos',
  'despesas',
  'financeiro',
  'tags',
  'entidade_tags',
  'templates',
  'whatsapp_templates',
  'whatsapp_regras',
  'whatsapp_historico',
  'whatsapp_config',
  'whatsapp_aprovacao',
  'profiles',
  'user_roles',
  'configuracoes_escritorio',
] as const;

export type SyncableTable = (typeof SYNCABLE_TABLES)[number];

export function useExternalSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const callSyncAPI = useCallback(async (
    action: SyncAction,
    table: string,
    data?: Record<string, unknown> | Record<string, unknown>[],
    filters?: Record<string, unknown>,
    id?: string
  ): Promise<SyncResult> => {
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('sync-external-db', {
        body: { action, table, data, filters, id }
      });

      if (fnError) {
        console.error(`[useExternalSync] Error calling sync-external-db:`, fnError);
        return { success: false, message: fnError.message };
      }

      return result as SyncResult;
    } catch (err) {
      console.error(`[useExternalSync] Exception:`, err);
      return { success: false, message: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  }, []);

  const syncTable = useCallback(async (table: SyncableTable): Promise<SyncResult> => {
    setIsSyncing(true);
    setError(null);
    setSyncProgress({ current: 0, total: 1, currentTable: table });

    console.log(`[useExternalSync] Syncing table: ${table}`);
    const result = await callSyncAPI('sync', table);

    if (result.success) {
      setLastSync(new Date());
      queryClient.invalidateQueries();
      console.log(`[useExternalSync] Table ${table} synced successfully:`, result);
    } else {
      setError(result.message || 'Erro ao sincronizar');
      console.error(`[useExternalSync] Failed to sync ${table}:`, result);
    }

    setSyncProgress({ current: 1, total: 1 });
    setIsSyncing(false);
    return result;
  }, [callSyncAPI, queryClient]);

  const syncAllTables = useCallback(async (): Promise<SyncResult> => {
    setIsSyncing(true);
    setError(null);
    const total = SYNCABLE_TABLES.length;
    setSyncProgress({ current: 0, total });

    console.log(`[useExternalSync] Starting full sync of ${total} tables`);
    const errors: string[] = [];
    let totalPushed = 0;
    let totalPulled = 0;

    for (let i = 0; i < SYNCABLE_TABLES.length; i++) {
      const table = SYNCABLE_TABLES[i];
      setSyncProgress({ current: i, total, currentTable: table });

      const result = await callSyncAPI('sync', table);

      if (!result.success) {
        errors.push(`${table}: ${result.message}`);
        console.error(`[useExternalSync] Failed to sync ${table}:`, result.message);
      } else {
        totalPushed += result.pushedToExternal || 0;
        totalPulled += result.pulledToInternal || 0;
        console.log(`[useExternalSync] Synced ${table}: pushed=${result.pushedToExternal}, pulled=${result.pulledToInternal}`);
      }
    }

    setSyncProgress({ current: total, total });
    setLastSync(new Date());
    queryClient.invalidateQueries();
    setIsSyncing(false);

    const success = errors.length === 0;
    if (success) {
      toast({ title: 'Sincronização concluída', description: `${totalPushed} enviados, ${totalPulled} recebidos` });
    } else {
      toast({ title: 'Sincronização com erros', description: `${errors.length} tabelas falharam`, variant: 'destructive' });
    }

    return {
      success,
      pushedToExternal: totalPushed,
      pulledToInternal: totalPulled,
      errors: errors.length > 0 ? errors : undefined,
    };
  }, [callSyncAPI, queryClient]);

  const pushToExternal = useCallback(async (
    table: SyncableTable,
    data: Record<string, unknown> | Record<string, unknown>[]
  ): Promise<SyncResult> => {
    console.log(`[useExternalSync] Pushing to external: ${table}`);
    const result = await callSyncAPI('push', table, data);

    if (result.success) {
      console.log(`[useExternalSync] Pushed to ${table} successfully`);
    } else {
      console.error(`[useExternalSync] Failed to push to ${table}:`, result.message);
    }

    return result;
  }, [callSyncAPI]);

  const pullFromInternal = useCallback(async (
    table: SyncableTable,
    filters?: Record<string, unknown>
  ): Promise<SyncResult> => {
    console.log(`[useExternalSync] Reading from internal: ${table}`, filters);
    const result = await callSyncAPI('read', table, undefined, filters);

    if (result.success) {
      console.log(`[useExternalSync] Read ${result.count || 0} records from ${table}`);
    } else {
      console.error(`[useExternalSync] Failed to read from ${table}:`, result.message);
    }

    return result;
  }, [callSyncAPI]);

  const writeToInternal = useCallback(async (
    table: SyncableTable,
    data: Record<string, unknown> | Record<string, unknown>[]
  ): Promise<SyncResult> => {
    console.log(`[useExternalSync] Writing to internal: ${table}`);
    const result = await callSyncAPI('write', table, data);

    if (result.success) {
      queryClient.invalidateQueries();
      console.log(`[useExternalSync] Wrote to ${table} successfully`);
    } else {
      console.error(`[useExternalSync] Failed to write to ${table}:`, result.message);
    }

    return result;
  }, [callSyncAPI, queryClient]);

  const deleteFromInternal = useCallback(async (
    table: SyncableTable,
    idOrFilters: string | Record<string, unknown>
  ): Promise<SyncResult> => {
    console.log(`[useExternalSync] Deleting from internal: ${table}`, idOrFilters);

    const isId = typeof idOrFilters === 'string';
    const result = await callSyncAPI(
      'delete',
      table,
      undefined,
      isId ? undefined : idOrFilters,
      isId ? idOrFilters : undefined
    );

    if (result.success) {
      queryClient.invalidateQueries();
      console.log(`[useExternalSync] Deleted from ${table} successfully`);
    } else {
      console.error(`[useExternalSync] Failed to delete from ${table}:`, result.message);
    }

    return result;
  }, [callSyncAPI, queryClient]);

  return {
    // Functions
    syncTable,
    syncAllTables,
    pushToExternal,
    pullFromInternal,
    writeToInternal,
    deleteFromInternal,
    // State
    isSyncing,
    lastSync,
    syncProgress,
    error,
  };
}

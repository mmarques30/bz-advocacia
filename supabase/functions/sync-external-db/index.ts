import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tables that can be synced
const SYNCABLE_TABLES = [
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
  'whatsapp_templates',
  'whatsapp_historico',
  'whatsapp_config',
  'whatsapp_regras',
  'templates',
  'tags',
  'entidade_tags',
  'atividades',
  'notificacoes',
  'profiles',
  'configuracoes_escritorio',
];

interface SyncRequest {
  action: 'push' | 'pull' | 'sync' | 'read' | 'write' | 'delete' | 'delete-external' | 'list-tables' | 'pull-external';
  table?: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  filters?: Record<string, unknown>;
  id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_KEY');
    const internalUrl = Deno.env.get('SUPABASE_URL');
    const internalKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!externalUrl || !externalKey) {
      console.error('External Supabase credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'External Supabase not configured',
          message: 'Please configure EXTERNAL_SUPABASE_URL and EXTERNAL_SUPABASE_KEY secrets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create clients for both databases
    const externalSupabase = createClient(externalUrl, externalKey);
    const internalSupabase = createClient(internalUrl!, internalKey!);

    const { action, table, data, filters, id }: SyncRequest = await req.json();

    console.log(`Sync request: action=${action}, table=${table || 'N/A'}`);

    // LIST-TABLES action doesn't require table validation
    if (action === 'list-tables') {
      console.log('Listing tables from external database...');
      
      // Try to get tables by querying known common tables first
      const commonTables = [
        'contact_submissions', 'leads', 'clientes', 'customers',
        'processos', 'cases', 'casos',
        'acordos_financeiros', 'agreements', 'contratos',
        'parcelas_financeiras', 'installments', 'parcelas',
        'despesas', 'expenses', 'gastos',
        'profiles', 'users', 'usuarios',
        'top_receitas', 'receitas', 'revenues',
        'top_despesas', 'top_clientes', 'top_processos'
      ];
      
      const existingTables: string[] = [];
      const tableDetails: Record<string, { exists: boolean; count?: number; sample?: unknown }> = {};
      
      // Check each table
      for (const tableName of commonTables) {
        try {
          const { data: tableData, error, count } = await externalSupabase
            .from(tableName)
            .select('*', { count: 'exact', head: false })
            .limit(1);
          
          if (!error) {
            existingTables.push(tableName);
            tableDetails[tableName] = {
              exists: true,
              count: count || tableData?.length || 0,
              sample: tableData?.[0] || null
            };
            console.log(`Found table: ${tableName} with ${count || tableData?.length || 0} rows`);
          }
        } catch (e) {
          // Table doesn't exist, continue
        }
      }
      
      // Also try the SYNCABLE_TABLES list
      for (const tableName of SYNCABLE_TABLES) {
        if (!existingTables.includes(tableName)) {
          try {
            const { data: tableData, error, count } = await externalSupabase
              .from(tableName)
              .select('*', { count: 'exact', head: false })
              .limit(1);
            
            if (!error) {
              existingTables.push(tableName);
              tableDetails[tableName] = {
                exists: true,
                count: count || tableData?.length || 0,
                sample: tableData?.[0] || null
              };
              console.log(`Found table: ${tableName} with ${count || tableData?.length || 0} rows`);
            }
          } catch (e) {
            // Table doesn't exist, continue
          }
        }
      }
      
      console.log(`Total tables found: ${existingTables.length}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          tables: existingTables,
          details: tableDetails,
          totalTables: existingTables.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PULL-EXTERNAL: Read from EXTERNAL database
    if (action === 'pull-external') {
      if (!table) {
        throw new Error('Table is required for pull-external action');
      }
      
      console.log(`Pulling data from external table: ${table}`);
      
      let query = externalSupabase.from(table).select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (id) {
        query = query.eq('id', id);
      }

      const { data: pullData, error } = await query;
      
      if (error) {
        console.error('Pull-external error:', error);
        throw error;
      }
      
      console.log(`Pulled ${pullData?.length || 0} rows from external ${table}`);
      
      return new Response(
        JSON.stringify({ success: true, data: pullData, count: pullData?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate table for other actions
    if (!table || !SYNCABLE_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid table',
          message: `Table "${table}" is not syncable. Available tables: ${SYNCABLE_TABLES.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      // PULL: Read from INTERNAL (Lovable Cloud) and return
      case 'pull':
      case 'read': {
        let query = internalSupabase.from(table).select('*');
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        if (id) {
          query = query.eq('id', id);
        }

        const { data: pullData, error } = await query;
        
        if (error) {
          console.error('Pull error:', error);
          throw error;
        }
        
        result = { success: true, data: pullData, count: pullData?.length || 0 };
        break;
      }

      // PUSH: Write to EXTERNAL Supabase
      case 'push': {
        if (!data) {
          throw new Error('Data is required for push action');
        }

        const dataArray = Array.isArray(data) ? data : [data];
        
        const { data: pushData, error } = await externalSupabase
          .from(table)
          .upsert(dataArray, { onConflict: 'id' })
          .select();

        if (error) {
          console.error('Push error:', error);
          throw error;
        }

        result = { success: true, data: pushData, count: pushData?.length || 0 };
        break;
      }

      // WRITE: Write to INTERNAL (Lovable Cloud)
      case 'write': {
        if (!data) {
          throw new Error('Data is required for write action');
        }

        const dataArray = Array.isArray(data) ? data : [data];
        
        const { data: writeData, error } = await internalSupabase
          .from(table)
          .upsert(dataArray, { onConflict: 'id' })
          .select();

        if (error) {
          console.error('Write error:', error);
          throw error;
        }

        result = { success: true, data: writeData, count: writeData?.length || 0 };
        break;
      }

      // DELETE: Delete from INTERNAL
      case 'delete': {
        if (!id && !filters) {
          throw new Error('ID or filters required for delete action');
        }

        let query = internalSupabase.from(table).delete();
        
        if (id) {
          query = query.eq('id', id);
        }
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        const { error } = await query;

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }

        result = { success: true, message: 'Deleted successfully from internal' };
        break;
      }

      // DELETE-EXTERNAL: Delete from EXTERNAL Supabase
      case 'delete-external': {
        if (!id && !filters) {
          throw new Error('ID or filters required for delete-external action');
        }

        let query = externalSupabase.from(table).delete();
        
        if (id) {
          query = query.eq('id', id);
        }
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        const { error } = await query;

        if (error) {
          console.error('Delete-external error:', error);
          throw error;
        }

        result = { success: true, message: 'Deleted successfully from external' };
        break;
      }

      // SYNC: Full bidirectional sync
      case 'sync': {
        // Get data from both databases
        const [internalResult, externalResult] = await Promise.all([
          internalSupabase.from(table).select('*'),
          externalSupabase.from(table).select('*')
        ]);

        if (internalResult.error) throw internalResult.error;
        if (externalResult.error) throw externalResult.error;

        const internalData = internalResult.data || [];
        const externalData = externalResult.data || [];

        // Create maps by ID
        const internalMap = new Map(internalData.map(item => [item.id, item]));
        const externalMap = new Map(externalData.map(item => [item.id, item]));

        // Find items to sync
        const toExternal: Record<string, unknown>[] = [];
        const toInternal: Record<string, unknown>[] = [];

        // Items in internal but not in external -> push to external
        internalData.forEach(item => {
          if (!externalMap.has(item.id)) {
            toExternal.push(item);
          } else {
            // Compare updated_at or created_at to determine which is newer
            const externalItem = externalMap.get(item.id);
            const internalTime = new Date(item.updated_at || item.created_at || 0).getTime();
            const externalTime = new Date(externalItem.updated_at || externalItem.created_at || 0).getTime();
            
            if (internalTime > externalTime) {
              toExternal.push(item);
            } else if (externalTime > internalTime) {
              toInternal.push(externalItem);
            }
          }
        });

        // Items in external but not in internal -> pull to internal
        externalData.forEach(item => {
          if (!internalMap.has(item.id)) {
            toInternal.push(item);
          }
        });

        // Execute sync operations
        const syncResults = {
          pushedToExternal: 0,
          pulledToInternal: 0,
          errors: [] as string[]
        };

        if (toExternal.length > 0) {
          const { error } = await externalSupabase
            .from(table)
            .upsert(toExternal, { onConflict: 'id' });
          
          if (error) {
            syncResults.errors.push(`Push error: ${error.message}`);
          } else {
            syncResults.pushedToExternal = toExternal.length;
          }
        }

        if (toInternal.length > 0) {
          const { error } = await internalSupabase
            .from(table)
            .upsert(toInternal, { onConflict: 'id' });
          
          if (error) {
            syncResults.errors.push(`Pull error: ${error.message}`);
          } else {
            syncResults.pulledToInternal = toInternal.length;
          }
        }

        result = { 
          success: syncResults.errors.length === 0, 
          ...syncResults,
          internalCount: internalData.length,
          externalCount: externalData.length
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('Sync result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

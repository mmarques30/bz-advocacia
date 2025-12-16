import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  'transacoes_externas',
  'categorias_externas',
  'subcategorias_externas',
  'resumo_mensal_externo',
  'resumo_anual_externo',
  'resumo_por_subcategoria_externo',
] as const;

const EXTERNAL_TABLES = [
  'transacoes',
  'categorias',
  'subcategorias',
  'tipos',
  'resumo_mensal',
  'resumo_anual',
  'resumo_por_subcategoria',
  'top_receitas',
  'top_despesas',
] as const;

const EXTERNAL_TO_INTERNAL_MAP: Record<string, string> = {
  'transacoes': 'transacoes_externas',
  'categorias': 'categorias_externas',
  'subcategorias': 'subcategorias_externas',
  'resumo_mensal': 'resumo_mensal_externo',
  'resumo_anual': 'resumo_anual_externo',
  'resumo_por_subcategoria': 'resumo_por_subcategoria_externo',
};

interface SyncRequest {
  action: 'push' | 'pull' | 'sync' | 'read' | 'write' | 'delete' | 'delete-external' | 'list-tables' | 'pull-external' | 'import-external' | 'import-all';
  table?: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  filters?: Record<string, unknown>;
  id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_KEY');
    const internalUrl = Deno.env.get('SUPABASE_URL');
    const internalServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!externalUrl || !externalKey) {
      console.error('External Supabase credentials not configured');
      return new Response(
        JSON.stringify({ error: 'External Supabase not configured', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!internalUrl || !internalServiceKey) {
      console.error('Internal Supabase credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Internal Supabase not configured', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const externalSupabase = createClient(externalUrl, externalKey);
    const internalSupabase = createClient(internalUrl, internalServiceKey);

    const { action, table, data, filters, id }: SyncRequest = await req.json();

    console.log(`Sync request: action=${action}, table=${table || 'N/A'}`);

    // IMPORT-ALL: Import all data from external database
    if (action === 'import-all') {
      console.log('Starting full import from external database...');
      
      const results: Record<string, { success: boolean; imported: number; error?: string }> = {};
      
      for (const externalTable of EXTERNAL_TABLES) {
        const internalTable = EXTERNAL_TO_INTERNAL_MAP[externalTable];
        if (!internalTable) {
          console.log(`Skipping ${externalTable} - no internal mapping`);
          continue;
        }
        
        try {
          console.log(`Importing ${externalTable} -> ${internalTable}...`);
          
          const { data: externalData, error: fetchError } = await externalSupabase
            .from(externalTable)
            .select('*');
          
          if (fetchError) {
            console.error(`Error fetching ${externalTable}:`, fetchError);
            results[externalTable] = { success: false, imported: 0, error: fetchError.message };
            continue;
          }
          
          if (!externalData || externalData.length === 0) {
            console.log(`No data in ${externalTable}`);
            results[externalTable] = { success: true, imported: 0 };
            continue;
          }
          
          // Clear existing data
          const { error: deleteError } = await internalSupabase
            .from(internalTable)
            .delete()
            .gte('id', '00000000-0000-0000-0000-000000000000');
          
          if (deleteError) {
            console.error(`Error clearing ${internalTable}:`, deleteError);
          }
          
          // Transform data
          const transformedData = externalData.map((row: Record<string, unknown>) => ({
            ...row,
            external_id: row.id,
            id: undefined,
          }));
          
          const { error: insertError } = await internalSupabase
            .from(internalTable)
            .insert(transformedData);
          
          if (insertError) {
            console.error(`Error inserting into ${internalTable}:`, insertError);
            results[externalTable] = { success: false, imported: 0, error: insertError.message };
          } else {
            console.log(`Imported ${externalData.length} rows into ${internalTable}`);
            results[externalTable] = { success: true, imported: externalData.length };
          }
        } catch (e) {
          console.error(`Exception importing ${externalTable}:`, e);
          results[externalTable] = { success: false, imported: 0, error: String(e) };
        }
      }
      
      const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0);
      const allSuccess = Object.values(results).every(r => r.success);
      
      return new Response(
        JSON.stringify({
          success: allSuccess,
          totalImported,
          results,
          message: `Imported ${totalImported} total records from external database`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IMPORT-EXTERNAL: Import specific table
    if (action === 'import-external') {
      if (!table) {
        throw new Error('Table is required for import-external action');
      }
      
      const internalTable = EXTERNAL_TO_INTERNAL_MAP[table];
      if (!internalTable) {
        throw new Error(`No internal mapping for external table: ${table}`);
      }
      
      console.log(`Importing ${table} -> ${internalTable}...`);
      
      const { data: externalData, error: fetchError } = await externalSupabase
        .from(table)
        .select('*');
      
      if (fetchError) throw fetchError;
      
      if (!externalData || externalData.length === 0) {
        return new Response(
          JSON.stringify({ success: true, imported: 0, message: 'No data to import' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      await internalSupabase
        .from(internalTable)
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      const transformedData = externalData.map((row: Record<string, unknown>) => ({
        ...row,
        external_id: row.id,
        id: undefined,
      }));
      
      const { error: insertError } = await internalSupabase
        .from(internalTable)
        .insert(transformedData);
      
      if (insertError) throw insertError;
      
      return new Response(
        JSON.stringify({
          success: true,
          imported: externalData.length,
          message: `Imported ${externalData.length} rows from ${table} to ${internalTable}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LIST-TABLES
    if (action === 'list-tables') {
      console.log('Listing tables from external database...');
      
      const existingTables: string[] = [];
      const tableDetails: Record<string, { exists: boolean; count?: number; sample?: unknown }> = {};
      
      for (const tableName of EXTERNAL_TABLES) {
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
            console.log(`Found table: ${tableName}`);
          }
        } catch (e) {
          // Table doesn't exist
        }
      }
      
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

    // PULL-EXTERNAL
    if (action === 'pull-external') {
      if (!table) throw new Error('Table is required for pull-external action');
      
      console.log(`Pulling data from external table: ${table}`);
      
      let query = externalSupabase.from(table).select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (id) query = query.eq('id', id);

      const { data: pullData, error } = await query;
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true, data: pullData, count: pullData?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate table for other actions
    if (!table || !SYNCABLE_TABLES.includes(table as typeof SYNCABLE_TABLES[number])) {
      return new Response(
        JSON.stringify({ error: 'Invalid table', validTables: SYNCABLE_TABLES, success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // READ/PULL
    if (action === 'read' || action === 'pull') {
      let query = internalSupabase.from(table).select('*');
      if (filters) Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      if (id) query = query.eq('id', id);
      const { data: readData, error } = await query;
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, data: readData, count: readData?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // WRITE
    if (action === 'write') {
      if (!data) throw new Error('Data is required for write action');
      const { data: writeData, error } = await internalSupabase
        .from(table)
        .upsert(Array.isArray(data) ? data : [data])
        .select();
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, data: writeData, count: writeData?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUSH
    if (action === 'push') {
      if (!data) throw new Error('Data is required for push action');
      const { data: pushData, error } = await externalSupabase
        .from(table)
        .upsert(Array.isArray(data) ? data : [data])
        .select();
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, data: pushData, pushedToExternal: pushData?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE
    if (action === 'delete') {
      let query = internalSupabase.from(table).delete();
      if (id) query = query.eq('id', id);
      else if (filters) Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      else throw new Error('ID or filters required for delete action');
      const { error } = await query;
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: 'Deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE-EXTERNAL
    if (action === 'delete-external') {
      let query = externalSupabase.from(table).delete();
      if (id) query = query.eq('id', id);
      else if (filters) Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      else throw new Error('ID or filters required for delete-external action');
      const { error } = await query;
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: 'Deleted from external successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SYNC
    if (action === 'sync') {
      const [internalResult, externalResult] = await Promise.all([
        internalSupabase.from(table).select('*'),
        externalSupabase.from(table).select('*')
      ]);
      
      if (internalResult.error) throw internalResult.error;
      if (externalResult.error) throw externalResult.error;
      
      const internalData = internalResult.data || [];
      const externalData = externalResult.data || [];
      
      let pushedToExternal = 0;
      let pulledToInternal = 0;
      
      const internalMap = new Map(internalData.map(row => [row.id, row]));
      const externalMap = new Map(externalData.map(row => [row.id, row]));
      
      for (const row of internalData) {
        const externalRow = externalMap.get(row.id);
        const internalTime = new Date(row.updated_at || row.created_at || 0).getTime();
        const externalTime = externalRow ? new Date(externalRow.updated_at || externalRow.created_at || 0).getTime() : 0;
        
        if (!externalRow || internalTime > externalTime) {
          const { error } = await externalSupabase.from(table).upsert(row);
          if (!error) pushedToExternal++;
        }
      }
      
      for (const row of externalData) {
        const internalRow = internalMap.get(row.id);
        const externalTime = new Date(row.updated_at || row.created_at || 0).getTime();
        const internalTime = internalRow ? new Date(internalRow.updated_at || internalRow.created_at || 0).getTime() : 0;
        
        if (!internalRow || externalTime > internalTime) {
          const { error } = await internalSupabase.from(table).upsert(row);
          if (!error) pulledToInternal++;
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          pushedToExternal,
          pulledToInternal,
          message: `Synced ${table}: ${pushedToExternal} pushed, ${pulledToInternal} pulled`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action', success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

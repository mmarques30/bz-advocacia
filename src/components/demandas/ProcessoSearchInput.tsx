import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface ProcessoSearchInputProps {
  value: string | null;
  onChange: (processoId: string | null) => void;
  disabled?: boolean;
}

export const ProcessoSearchInput = ({ value, onChange, disabled }: ProcessoSearchInputProps) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load label for pre-existing value
  useEffect(() => {
    if (value && value !== 'sem_processo') {
      supabase
        .from('processos')
        .select('id, numero_processo, tipo, lead_id')
        .eq('id', value)
        .single()
        .then(async ({ data }) => {
          if (!data) return;
          let clienteName = '';
          if (data.lead_id) {
            const { data: cliente } = await supabase
              .from('contact_submissions')
              .select('nome_completo')
              .eq('id', data.lead_id)
              .single();
            clienteName = cliente?.nome_completo || '';
          }
          const label = [data.numero_processo, clienteName].filter(Boolean).join(' - ') || data.tipo;
          setSelectedLabel(label);
        });
    } else {
      setSelectedLabel('');
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search query with debounce
  const { data: results } = useQuery({
    queryKey: ['processo-search-input', debouncedSearch],
    queryFn: async () => {
      // First, find client IDs matching the search term
      let clienteIds: string[] = [];
      if (debouncedSearch.trim().length >= 2) {
        const { data: clientes } = await supabase
          .from('contact_submissions')
          .select('id')
          .ilike('nome_completo', `%${debouncedSearch}%`)
          .limit(50);
        clienteIds = (clientes || []).map(c => c.id);
      }

      let query = supabase
        .from('processos')
        .select('id, numero_processo, tipo, lead_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (debouncedSearch.trim().length >= 2) {
        if (clienteIds.length > 0) {
          query = query.or(`numero_processo.ilike.%${debouncedSearch}%,lead_id.in.(${clienteIds.join(',')})`);
        } else {
          query = query.ilike('numero_processo', `%${debouncedSearch}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch client names for results
      const leadIds = [...new Set((data || []).map(p => p.lead_id).filter(Boolean))] as string[];
      let clienteMap: Record<string, string> = {};
      if (leadIds.length > 0) {
        const { data: clientes } = await supabase
          .from('contact_submissions')
          .select('id, nome_completo')
          .in('id', leadIds);
        clienteMap = Object.fromEntries((clientes || []).map(c => [c.id, c.nome_completo]));
      }

      return (data || []).map(p => ({
        id: p.id,
        numero_processo: p.numero_processo,
        tipo: p.tipo,
        cliente_nome: p.lead_id ? clienteMap[p.lead_id] || '' : '',
      }));
    },
    enabled: showDropdown,
  });

  const handleSelect = (id: string, label: string) => {
    onChange(id);
    setSelectedLabel(label);
    setShowDropdown(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null);
    setSelectedLabel('');
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número ou cliente..."
          value={showDropdown ? search : selectedLabel}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setSearch('');
            setShowDropdown(true);
          }}
          className="pl-9 pr-9"
          disabled={disabled}
        />
        {selectedLabel && !showDropdown && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent text-muted-foreground"
            onClick={() => {
              onChange(null);
              setSelectedLabel('');
              setShowDropdown(false);
              setSearch('');
            }}
          >
            Nenhum processo
          </button>
          {results?.map((p) => {
            const label = [p.numero_processo, p.cliente_nome].filter(Boolean).join(' - ') || p.tipo;
            return (
              <button
                key={p.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => handleSelect(p.id, label)}
              >
                <span className="font-medium">{p.numero_processo || p.tipo}</span>
                {p.cliente_nome && (
                  <span className="text-muted-foreground ml-2">— {p.cliente_nome}</span>
                )}
              </button>
            );
          })}
          {results?.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum processo encontrado</p>
          )}
        </div>
      )}
    </div>
  );
};

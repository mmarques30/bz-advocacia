import { Plus, Search, Filter, Table2, LayoutGrid, Upload, ChevronDown, FileSpreadsheet, Table } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface LeadsHeaderProps {
  view: 'table' | 'kanban';
  onViewChange: (view: 'table' | 'kanban') => void;
  onOpenFilters: () => void;
  onNewLead: () => void;
  onImport: () => void;
  onImportPlanilha?: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  activeFiltersCount: number;
  isClienteTab?: boolean;
  hideViewToggle?: boolean;
  clienteFilterId?: string | null;
  onClienteFilterChange?: (id: string | null) => void;
}

export function LeadsHeader({
  view,
  onViewChange,
  onOpenFilters,
  onNewLead,
  onImport,
  onImportPlanilha,
  search,
  onSearchChange,
  activeFiltersCount,
  isClienteTab = false,
  hideViewToggle = false,
  clienteFilterId,
  onClienteFilterChange,
}: LeadsHeaderProps) {
  const [clientes, setClientes] = useState<{ id: string; nome_completo: string }[]>([]);

  useEffect(() => {
    if (!isClienteTab) return;
    const fetchClientes = async () => {
      const { data } = await supabase
        .from('contact_submissions')
        .select('id, nome_completo')
        .eq('estagio', 'fechado')
        .order('nome_completo');
      if (data) setClientes(data);
    };
    fetchClientes();
  }, [isClienteTab]);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-1 min-w-[300px]">
        <Button onClick={onNewLead}>
          <Plus className="h-4 w-4" />
          {isClienteTab ? "Novo Cliente" : "Novo Lead"}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover">
            <DropdownMenuItem onClick={onImport}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importar CSV/XLSX simples
            </DropdownMenuItem>
            {onImportPlanilha && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onImportPlanilha}>
                  <Table className="h-4 w-4 mr-2" />
                  Importar Planilha B&Z (com processos)
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {isClienteTab && onClienteFilterChange && (
          <Select
            value={clienteFilterId || "all"}
            onValueChange={(v) => onClienteFilterChange(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, email ou telefone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={onOpenFilters} className="relative">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {!hideViewToggle && (
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && onViewChange(v as 'table' | 'kanban')}>
          <ToggleGroupItem value="table" aria-label="Visualização em tabela">
            <Table2 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="kanban" aria-label="Visualização em kanban">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    </div>
  );
}

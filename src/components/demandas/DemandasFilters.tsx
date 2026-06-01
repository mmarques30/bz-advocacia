import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { DemandasFilters as FiltersType } from "@/types/demandas";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { useAdvogadas } from "@/hooks/useAdvogadas";
import { useLeads } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

const DEFAULT_STATUSES = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

interface DemandasFiltersProps {
  filters: FiltersType;
  onFilterChange: (key: string, value: string) => void;
}

export const DemandasFilters = ({ filters, onFilterChange }: DemandasFiltersProps) => {
  const { data: categoriasDb } = useOpcoesSistema('categoria_tarefa', true);
  const { data: statusDb } = useOpcoesSistema('status_tarefa', true);
  const { data: advogadas } = useAdvogadas();

  // Lista completa de clientes/leads (combobox abaixo). Empty filters traz tudo.
  const { data: allLeads = [], isLoading: leadsLoading } = useLeads({
    search: '',
    status: [],
    origem: [],
    tipoProcesso: [],
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
    statusCliente: [],
  });
  const leads = useMemo(
    () => [...allLeads].sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR')),
    [allLeads],
  );
  const [clientePopoverOpen, setClientePopoverOpen] = useState(false);
  const clienteSelecionado = leads.find(l => l.id === filters.lead_id);

  const statuses = statusDb && statusDb.length > 0
    ? statusDb.map(o => ({ value: o.valor, label: o.label }))
    : DEFAULT_STATUSES;

  const categorias = categoriasDb && categoriasDb.length > 0
    ? categoriasDb.map(o => ({ value: o.valor, label: o.label }))
    : [
        { value: 'processos', label: 'Processos' },
        { value: 'vendas', label: 'Vendas' },
        { value: 'pagamentos', label: 'Pagamentos' },
        { value: 'administrativo', label: 'Administrativo' },
        { value: 'geral', label: 'Geral' },
      ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
      <Select value={filters.categoria || 'todos'} onValueChange={(value) => onFilterChange('categoria', value === 'todos' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as categorias</SelectItem>
          {categorias.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.tipo || 'todos'} onValueChange={(value) => onFilterChange('tipo', value === 'todos' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          <SelectItem value="melhoria">Melhoria</SelectItem>
          <SelectItem value="bug">Bug</SelectItem>
          <SelectItem value="sugestao">Sugestão</SelectItem>
          <SelectItem value="tarefa">Tarefa</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status || 'todos'} onValueChange={(value) => onFilterChange('status', value === 'todos' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.prioridade || 'todos'} onValueChange={(value) => onFilterChange('prioridade', value === 'todos' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as prioridades</SelectItem>
          <SelectItem value="baixa">Baixa</SelectItem>
          <SelectItem value="media">Média</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="urgente">Urgente</SelectItem>
        </SelectContent>
      </Select>

      {/* Responsável dinâmico — fonte: useAdvogadas (profiles.is_advogada). */}
      <Select value={filters.advogada_responsavel || 'todos'} onValueChange={(value) => onFilterChange('advogada_responsavel', value === 'todos' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os responsáveis</SelectItem>
          {advogadas?.map((a) => (
            <SelectItem key={a.id} value={a.legacy_key ?? a.apelido}>
              {a.nome_completo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.ordenacao || 'recente'} onValueChange={(value) => onFilterChange('ordenacao', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Ordenação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recente">Mais recente</SelectItem>
          <SelectItem value="antigo">Mais antigo</SelectItem>
        </SelectContent>
      </Select>

      {/* Busca por cliente — combobox: clique abre todos, digita para filtrar. */}
      <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={clientePopoverOpen}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {clienteSelecionado
                ? clienteSelecionado.nome_completo
                : leadsLoading ? "Carregando..." : "Buscar cliente..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Digite o nome do cliente..." />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__todos__"
                  onSelect={() => {
                    onFilterChange('lead_id', '');
                    setClientePopoverOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", !filters.lead_id ? "opacity-100" : "opacity-0")} />
                  <span className="text-muted-foreground">Todos os clientes</span>
                </CommandItem>
                {leads.map((lead) => (
                  <CommandItem
                    key={lead.id}
                    value={lead.nome_completo}
                    onSelect={() => {
                      onFilterChange('lead_id', lead.id);
                      setClientePopoverOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", filters.lead_id === lead.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{lead.nome_completo}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

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

// Normaliza texto para busca: minusculas + remove acentos. Assim "joao" acha "João",
// "andre" acha "André", "maria" acha "MARIA SILVA", etc.
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Filtro lenient para o cmdk: substring case+acento-insensitive em qualquer parte.
// Funciona para o cliente (varios campos no value) e para o responsavel (nome).
function filtroLenient(value: string, search: string): number {
  if (!search) return 1;
  return normalizar(value).includes(normalizar(search)) ? 1 : 0;
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
  const [responsavelPopoverOpen, setResponsavelPopoverOpen] = useState(false);
  const clienteSelecionado = leads.find(l => l.id === filters.lead_id);

  // Para o combobox de responsavel: encontra o item atualmente selecionado pelo value salvo.
  const responsavelSelecionado = useMemo(() => {
    if (!filters.advogada_responsavel) return null;
    const a = advogadas?.find(a => (a.legacy_key ?? a.apelido) === filters.advogada_responsavel);
    return a?.nome_completo ?? filters.advogada_responsavel;
  }, [filters.advogada_responsavel, advogadas]);

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

      {/* Responsavel: combobox (mesmo padrao do cliente). Fonte: useAdvogadas. */}
      <Popover open={responsavelPopoverOpen} onOpenChange={setResponsavelPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={responsavelPopoverOpen}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {responsavelSelecionado ?? "Responsável"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <Command filter={filtroLenient}>
            <CommandInput placeholder="Buscar responsável..." />
            <CommandList>
              <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="todos os responsaveis limpar"
                  onSelect={() => {
                    onFilterChange('advogada_responsavel', '');
                    setResponsavelPopoverOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", !filters.advogada_responsavel ? "opacity-100" : "opacity-0")} />
                  <span className="text-muted-foreground">Todos os responsáveis</span>
                </CommandItem>
                {advogadas?.map((a) => {
                  const valorSalvo = a.legacy_key ?? a.apelido;
                  return (
                    <CommandItem
                      key={a.id}
                      value={`${a.nome_completo} ${a.apelido}`}
                      onSelect={() => {
                        onFilterChange('advogada_responsavel', valorSalvo);
                        setResponsavelPopoverOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", filters.advogada_responsavel === valorSalvo ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{a.nome_completo}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Select value={filters.ordenacao || 'recente'} onValueChange={(value) => onFilterChange('ordenacao', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Ordenação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recente">Mais recente</SelectItem>
          <SelectItem value="antigo">Mais antigo</SelectItem>
        </SelectContent>
      </Select>

      {/* Busca por cliente: combobox lenient. Clique abre todos; digitar filtra
          (case+acento-insensitive) por nome, tipo de processo, email ou telefone. */}
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
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command filter={filtroLenient}>
            <CommandInput placeholder="Digite o nome do cliente..." />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="todos os clientes limpar filtro"
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
                    // Inclui varios campos no value para que a busca pegue qualquer parte:
                    // nome, tipo de processo, email e telefone.
                    value={[
                      lead.nome_completo,
                      lead.tipo_processo,
                      lead.outro_tipo_processo,
                      lead.email,
                      lead.telefone,
                    ].filter(Boolean).join(' ')}
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

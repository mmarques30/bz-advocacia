import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { DemandasFilters as FiltersType } from "@/types/demandas";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { useAdvogadas } from "@/hooks/useAdvogadas";
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

// Filtro lenient pro combobox de responsavel (case+acento-insensitive).
function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function filtroLenient(value: string, search: string): number {
  if (!search) return 1;
  return normalizar(value).includes(normalizar(search)) ? 1 : 0;
}

export const DemandasFilters = ({ filters, onFilterChange }: DemandasFiltersProps) => {
  const { data: categoriasDb } = useOpcoesSistema('categoria_tarefa', true);
  const { data: statusDb } = useOpcoesSistema('status_tarefa', true);
  const { data: advogadas } = useAdvogadas();

  const [responsavelPopoverOpen, setResponsavelPopoverOpen] = useState(false);

  // Busca por cliente: input controlado localmente + debounce de 300ms
  // antes de propagar pra query. Evita request a cada tecla, mas mantem a
  // UI responsiva.
  const [clienteInput, setClienteInput] = useState(filters.cliente_search ?? "");
  useEffect(() => {
    // Sincroniza quando o filtro externo muda (ex: clear).
    setClienteInput(filters.cliente_search ?? "");
  }, [filters.cliente_search]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((filters.cliente_search ?? "") !== clienteInput) {
        onFilterChange('cliente_search', clienteInput);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteInput]);

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
    <div className="space-y-3 mb-6">
      {/* Row 1: filtros dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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

        {/* Responsavel: combobox (fonte useAdvogadas, profiles.is_advogada). */}
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
      </div>

      {/* Row 2: busca aberta por cliente — server-side em nome, processos
          do cliente, titulo e descricao das tarefas. */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={clienteInput}
          onChange={(e) => setClienteInput(e.target.value)}
          placeholder="Buscar cliente / nome mencionado..."
          className="pl-10"
        />
      </div>
    </div>
  );
};

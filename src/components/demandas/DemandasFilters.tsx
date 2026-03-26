import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { DemandasFilters as FiltersType } from "@/types/demandas";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { useAdvogadaLabels } from "@/hooks/useAdvogadaLabels";

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
  const advogadaLabels = useAdvogadaLabels();

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
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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

      <Select value={filters.advogada_responsavel || 'todos'} onValueChange={(value) => onFilterChange('advogada_responsavel', value === 'todos' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Advogada" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as advogadas</SelectItem>
          <SelectItem value="juliana">{advogadaLabels.juliana}</SelectItem>
          <SelectItem value="liziane">{advogadaLabels.liziane}</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar demandas..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};
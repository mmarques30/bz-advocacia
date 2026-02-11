import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { DemandasFilters as FiltersType } from "@/types/demandas";

interface DemandasFiltersProps {
  filters: FiltersType;
  onFilterChange: (key: string, value: string) => void;
}

export const DemandasFilters = ({ filters, onFilterChange }: DemandasFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
      <Select value={filters.categoria || 'todos'} onValueChange={(value) => onFilterChange('categoria', value === 'todos' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as categorias</SelectItem>
          <SelectItem value="processos">Processos</SelectItem>
          <SelectItem value="vendas">Vendas</SelectItem>
          <SelectItem value="pagamentos">Pagamentos</SelectItem>
          <SelectItem value="administrativo">Administrativo</SelectItem>
          <SelectItem value="geral">Geral</SelectItem>
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
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="em_andamento">Em Andamento</SelectItem>
          <SelectItem value="concluido">Concluído</SelectItem>
          <SelectItem value="cancelado">Cancelado</SelectItem>
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
          <SelectItem value="juliana">Juliana</SelectItem>
          <SelectItem value="liziane">Liziane</SelectItem>
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
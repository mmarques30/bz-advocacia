import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import type { TemplateFilters as Filters, TemplateType } from "@/types/templates";

interface TemplateFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const tipoOptions: { value: TemplateType; label: string }[] = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'peticao', label: 'Petição' },
  { value: 'email', label: 'Email' },
  { value: 'documento', label: 'Documento' },
  { value: 'comunicacao', label: 'Comunicação' },
];

export default function TemplateFilters({ filters, onFiltersChange }: TemplateFiltersProps) {
  const hasActiveFilters = filters.busca || filters.tipo?.length || filters.categoria || filters.ativo !== null;

  const clearFilters = () => {
    onFiltersChange({
      busca: '',
      tipo: [],
      categoria: '',
      ativo: null,
      ordenacao: 'recente',
    });
  };

  const toggleTipo = (tipo: TemplateType) => {
    const currentTipos = filters.tipo || [];
    const newTipos = currentTipos.includes(tipo)
      ? currentTipos.filter(t => t !== tipo)
      : [...currentTipos, tipo];
    onFiltersChange({ ...filters, tipo: newTipos });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={filters.busca || ''}
            onChange={(e) => onFiltersChange({ ...filters, busca: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.ativo === null ? 'todos' : filters.ativo ? 'ativo' : 'inativo'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              ativo: value === 'todos' ? null : value === 'ativo' 
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.ordenacao || 'recente'}
          onValueChange={(value: any) => onFiltersChange({ ...filters, ordenacao: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recente">Mais recente</SelectItem>
            <SelectItem value="antigo">Mais antigo</SelectItem>
            <SelectItem value="az">A-Z</SelectItem>
            <SelectItem value="za">Z-A</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de Template</Label>
        <div className="flex flex-wrap gap-2">
          {tipoOptions.map(option => (
            <Badge
              key={option.value}
              variant={filters.tipo?.includes(option.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTipo(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

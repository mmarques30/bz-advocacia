import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIPO_DOCUMENTO_DRIVE_LABELS, TipoDocumentoDrive } from "@/types/documentos-drive";
import { useProcessos } from "@/hooks/useProcessos";

interface AllDocumentosFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tipoFilter: TipoDocumentoDrive | "todos";
  onTipoChange: (value: TipoDocumentoDrive | "todos") => void;
  processoFilter: string;
  onProcessoChange: (value: string) => void;
  sortOrder: "recentes" | "antigos" | "nome";
  onSortOrderChange: (value: "recentes" | "antigos" | "nome") => void;
}

export function AllDocumentosFilters({
  searchTerm,
  onSearchChange,
  tipoFilter,
  onTipoChange,
  processoFilter,
  onProcessoChange,
  sortOrder,
  onSortOrderChange,
}: AllDocumentosFiltersProps) {
  const { data: processos } = useProcessos({ 
    search: "", 
    status: [], 
    tribunal: "", 
    tipo: "", 
    responsavel_id: "", 
    tem_prazo_proximo: false,
    sem_atualizacao_dias: 0
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={processoFilter} onValueChange={onProcessoChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Processo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Processos</SelectItem>
          {processos?.map((processo) => (
            <SelectItem key={processo.id} value={processo.id}>
              {processo.numero_processo || `Processo ${processo.tipo}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tipoFilter} onValueChange={onTipoChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Tipo de documento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Tipos</SelectItem>
          {Object.entries(TIPO_DOCUMENTO_DRIVE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recentes">Mais recentes</SelectItem>
          <SelectItem value="antigos">Mais antigos</SelectItem>
          <SelectItem value="nome">Nome (A-Z)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

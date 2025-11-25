import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TipoDocumentoDrive, TIPO_DOCUMENTO_DRIVE_LABELS } from "@/types/documentos-drive";
import { Search } from "lucide-react";

interface DriveDocumentosFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tipoFilter: string;
  onTipoFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function DriveDocumentosFilters({
  searchTerm,
  onSearchChange,
  tipoFilter,
  onTipoFilterChange,
  sortBy,
  onSortByChange,
}: DriveDocumentosFiltersProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="space-y-2">
        <Label htmlFor="search">Buscar documentos</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Documento</Label>
          <Select value={tipoFilter} onValueChange={onTipoFilterChange}>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.entries(TIPO_DOCUMENTO_DRIVE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort">Ordenar por</Label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger id="sort">
              <SelectValue placeholder="Data (mais recente)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data-desc">Data (mais recente)</SelectItem>
              <SelectItem value="data-asc">Data (mais antigo)</SelectItem>
              <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="tipo">Tipo de documento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

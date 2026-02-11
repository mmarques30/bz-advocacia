import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useFaturamentoDetalhado } from "@/hooks/useFinanceiro";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CONTA_LABELS } from "@/types/financeiro";

interface FaturamentoTableProps {
  filters?: FaturamentoFiltersState;
}

const INITIAL_ITEMS = 3;

export function FaturamentoTable({ filters }: FaturamentoTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: faturamentos, isLoading } = useFaturamentoDetalhado(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Filtrar por termo de busca
  const filteredData = faturamentos?.filter(item => 
    item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subcategoria?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Controle de exibição com expandir/ocultar
  const displayedData = isExpanded 
    ? filteredData 
    : filteredData.slice(0, INITIAL_ITEMS);

  const temMaisItens = filteredData.length > INITIAL_ITEMS;
  const itensRestantes = filteredData.length - INITIAL_ITEMS;

  // Reset expansão ao mudar busca
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsExpanded(false);
  };

  // Calcular total
  const total = filteredData.reduce((sum, item) => sum + item.valor, 0);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredData.length} registro(s) encontrado(s)
        </p>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">
            Total:{" "}
            <span className="text-emerald-600">
              {formatCurrency(total)}
            </span>
          </p>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Subcategoria</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              displayedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.data ? format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </TableCell>
                  <TableCell>{item.descricao || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.categoria || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {item.subcategoria || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CONTA_LABELS[item.conta || 'escritorio'] || 'Escritório'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    +{formatCurrency(item.valor)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {temMaisItens && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver todos os {filteredData.length} registros
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

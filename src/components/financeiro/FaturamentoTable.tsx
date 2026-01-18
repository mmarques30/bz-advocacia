import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Faturamento Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Faturamento Detalhado
          </CardTitle>
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
        <p className="text-sm text-muted-foreground">
          {filteredData.length} registro(s) encontrado(s)
        </p>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum registro encontrado</p>
            <p className="text-sm text-muted-foreground">
              Não há faturamentos para o período selecionado
            </p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.data ? format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>
                        {item.descricao || "-"}
                      </TableCell>
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
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Botão Expandir/Ocultar */}
            {temMaisItens && (
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-4"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver mais ({itensRestantes} restantes)
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

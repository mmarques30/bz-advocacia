import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

interface CampanhaData {
  campanha: string;
  totalLeads: number;
  leadsContatados: number;
  leadsConvertidos: number;
  taxaConversao: number;
  valorMedioPropostas: number;
}

interface RelatorioCampanhasProps {
  campanhas: CampanhaData[] | undefined;
  isLoading: boolean;
}

export function RelatorioCampanhas({ campanhas, isLoading }: RelatorioCampanhasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getConversaoBadge = (taxa: number) => {
    if (taxa >= 20) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{taxa.toFixed(1)}%</Badge>;
    } else if (taxa >= 10) {
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{taxa.toFixed(1)}%</Badge>;
    }
    return <Badge variant="secondary">{taxa.toFixed(1)}%</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance por Campanha</CardTitle>
            <CardDescription>
              Análise detalhada de cada campanha de marketing
            </CardDescription>
          </div>
          <Target className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {campanhas && campanhas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead className="text-right">Total Leads</TableHead>
                <TableHead className="text-right">Contatados</TableHead>
                <TableHead className="text-right">Convertidos</TableHead>
                <TableHead className="text-right">Taxa Conversão</TableHead>
                <TableHead className="text-right">Valor Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanhas.map((campanha) => (
                <TableRow key={campanha.campanha}>
                  <TableCell className="font-medium">{campanha.campanha}</TableCell>
                  <TableCell className="text-right">{campanha.totalLeads}</TableCell>
                  <TableCell className="text-right">{campanha.leadsContatados}</TableCell>
                  <TableCell className="text-right">{campanha.leadsConvertidos}</TableCell>
                  <TableCell className="text-right">
                    {getConversaoBadge(campanha.taxaConversao)}
                  </TableCell>
                  <TableCell className="text-right">
                    {campanha.valorMedioPropostas > 0 ? formatCurrency(campanha.valorMedioPropostas) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma campanha encontrada no período selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}

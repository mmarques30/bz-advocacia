import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelPerformance } from "@/types/analytics";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface ChannelComparisonTableProps {
  data?: ChannelPerformance[];
  loading?: boolean;
}

type SortKey = 'totalLeads' | 'taxaConversao' | 'ticketMedio' | 'tempoMedioConversao';

export function ChannelComparisonTable({ data, loading }: ChannelComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('taxaConversao');
  const [sortDesc, setSortDesc] = useState(true);

  if (loading) {
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const sortedData = [...(data || [])].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Canais</CardTitle>
        <CardDescription>Ordenado por melhor conversão (clique nos cabeçalhos para reordenar)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('totalLeads')}
              >
                <div className="flex items-center justify-end gap-1">
                  Leads
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('taxaConversao')}
              >
                <div className="flex items-center justify-end gap-1">
                  Conversão (%)
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('ticketMedio')}
              >
                <div className="flex items-center justify-end gap-1">
                  Ticket Médio
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('tempoMedioConversao')}
              >
                <div className="flex items-center justify-end gap-1">
                  Tempo Médio
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((channel) => (
              <TableRow key={channel.origem}>
                <TableCell className="font-medium capitalize">{channel.origem}</TableCell>
                <TableCell className="text-right">{channel.totalLeads}</TableCell>
                <TableCell className="text-right font-semibold">
                  {channel.taxaConversao.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  R$ {channel.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  {Math.round(channel.tempoMedioConversao)} dias
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

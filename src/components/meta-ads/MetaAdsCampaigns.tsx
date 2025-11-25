import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MetaCampanha } from "@/types/meta-ads";

interface MetaAdsCampaignsProps {
  campanhas: MetaCampanha[];
  isLoading?: boolean;
}

export function MetaAdsCampaigns({ campanhas, isLoading }: MetaAdsCampaignsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!campanhas || campanhas.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Custo/Lead</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campanhas.map((campanha) => (
            <TableRow key={campanha.id}>
              <TableCell className="font-medium">{campanha.nome}</TableCell>
              <TableCell>
                <Badge variant={campanha.status === "ACTIVE" ? "default" : "secondary"}>
                  {campanha.status === "ACTIVE" ? "Ativa" : "Pausada"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(campanha.gasto || 0)}
              </TableCell>
              <TableCell className="text-right">{campanha.leads || 0}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(campanha.custo_lead || 0)}
              </TableCell>
              <TableCell className="text-right">{campanha.ctr?.toFixed(2)}%</TableCell>
              <TableCell className="text-right">{campanha.impressoes?.toLocaleString("pt-BR") || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

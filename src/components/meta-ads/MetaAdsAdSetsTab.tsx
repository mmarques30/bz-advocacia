import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetaAdSetRow } from "@/hooks/useMetaAdSets";
import { cn } from "@/lib/utils";

interface Props {
  adSets: MetaAdSetRow[];
  isLoading: boolean;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  DELETED: "bg-gray-100 text-gray-600 border-gray-200",
  ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function MetaAdsAdSetsTab({ adSets, isLoading }: Props) {
  if (isLoading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando ad sets…</Card>;
  }
  if (adSets.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Nenhum ad set sincronizado ainda.
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad Set</TableHead>
            <TableHead>Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">CPL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adSets.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium max-w-[280px] truncate" title={s.nome}>{s.nome}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={s.campanha_nome ?? ""}>
                {s.campanha_nome ?? "-"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[s.status ?? ""] ?? "")}>
                  {s.status ?? "-"}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{s.gasto > 0 ? brl(s.gasto) : "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{s.impressoes.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{s.cliques.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{s.ctr > 0 ? `${s.ctr.toFixed(2)}%` : "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{s.leads}</TableCell>
              <TableCell className="text-right tabular-nums">{s.custo_lead > 0 ? brl(s.custo_lead) : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

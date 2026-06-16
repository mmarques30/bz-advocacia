import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetaCampanha } from "@/types/meta-ads";
import { cn } from "@/lib/utils";

interface Props {
  campanhas: MetaCampanha[];
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

export function MetaAdsCampanhasTab({ campanhas, isLoading }: Props) {
  if (isLoading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando campanhas…</Card>;
  }
  if (campanhas.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Nenhuma campanha sincronizada ainda. Rode <code>meta-sync-structure</code>.
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">CPL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campanhas.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium max-w-[320px] truncate" title={c.nome}>{c.nome}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[c.status ?? ""] ?? "")}>
                  {c.status ?? "-"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{c.objetivo ?? "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{c.gasto > 0 ? brl(c.gasto) : "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{c.impressoes.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{c.cliques.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{c.leads}</TableCell>
              <TableCell className="text-right tabular-nums">{c.custo_lead > 0 ? brl(c.custo_lead) : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

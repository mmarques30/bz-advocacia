import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetaAdRow } from "@/hooks/useMetaAds";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface Props {
  ads: MetaAdRow[];
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

// Link publico pro Ad Library do Meta — funciona pra qualquer ad
// independente de status, sem precisar de auth.
function adLibraryUrl(adId: string): string {
  return `https://www.facebook.com/ads/library/?id=${adId}`;
}

export function MetaAdsAnunciosTab({ ads, isLoading }: Props) {
  if (isLoading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando anúncios…</Card>;
  }
  if (ads.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Nenhum anúncio sincronizado ainda.
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Anúncio</TableHead>
            <TableHead>Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
            <TableHead className="text-right">Impr.</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">CPL</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="max-w-[280px]">
                <p className="font-medium truncate" title={a.nome}>{a.nome}</p>
                {a.criativo_titulo && (
                  <p className="text-xs text-muted-foreground truncate" title={a.criativo_titulo}>
                    {a.criativo_titulo}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={a.campanha_nome ?? ""}>
                {a.campanha_nome ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[a.status ?? ""] ?? "")}>
                  {a.status ?? "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{a.gasto > 0 ? brl(a.gasto) : "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{a.impressoes.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{a.cliques.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right tabular-nums">{a.ctr > 0 ? `${a.ctr.toFixed(2)}%` : "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{a.leads}</TableCell>
              <TableCell className="text-right tabular-nums">{a.custo_lead > 0 ? brl(a.custo_lead) : "—"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                  title="Abrir no Ad Library"
                >
                  <a href={adLibraryUrl(a.id)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

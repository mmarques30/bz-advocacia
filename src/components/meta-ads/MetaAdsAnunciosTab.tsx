import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetaAdRow } from "@/hooks/useMetaAds";
import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ads.map((a) => {
        const thumb = a.thumbnail_url || a.image_url;
        return (
          <Card key={a.id} className="overflow-hidden flex flex-col">
            {/* Thumb / placeholder */}
            <div className="aspect-video bg-muted flex items-center justify-center">
              {thumb ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={thumb} alt={a.criativo_titulo ?? a.nome} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>

            {/* Conteudo */}
            <div className="p-4 flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-sm truncate" title={a.nome}>{a.nome}</h4>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", STATUS_COLORS[a.status ?? ""] ?? "")}>
                  {a.status ?? "-"}
                </Badge>
              </div>

              {(a.criativo_titulo || a.criativo_body) && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {a.criativo_titulo && <p className="font-medium line-clamp-1">{a.criativo_titulo}</p>}
                  {a.criativo_body && <p className="line-clamp-2">{a.criativo_body}</p>}
                </div>
              )}

              <div className="text-[10px] text-muted-foreground space-y-0.5 mt-auto">
                {a.campanha_nome && <p className="truncate">📁 {a.campanha_nome}</p>}
                {a.ad_set_nome && <p className="truncate">🎯 {a.ad_set_nome}</p>}
              </div>

              {/* Metricas em grid 2x2 */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-border">
                <div>
                  <p className="text-muted-foreground text-[10px]">Gasto</p>
                  <p className="font-semibold tabular-nums">{a.gasto > 0 ? brl(a.gasto) : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Leads</p>
                  <p className="font-semibold tabular-nums">{a.leads}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">CTR</p>
                  <p className="font-semibold tabular-nums">{a.ctr > 0 ? `${a.ctr.toFixed(2)}%` : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">CPL</p>
                  <p className="font-semibold tabular-nums">{a.custo_lead > 0 ? brl(a.custo_lead) : "-"}</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

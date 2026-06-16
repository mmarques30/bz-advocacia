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
    // Grid mais denso: 2 cols mobile / 3 sm / 4 lg / 5 xl. Cards compactos,
    // thumb com aspect-square (vertical/quadrado funciona melhor pro Meta,
    // que tem reels/stories), info abaixo em fonte menor.
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {ads.map((a) => {
        const thumb = a.thumbnail_url || a.image_url;
        return (
          <Card key={a.id} className="overflow-hidden flex flex-col text-xs">
            <div className="aspect-square bg-muted flex items-center justify-center relative">
              {thumb ? (
                <img
                  src={thumb}
                  alt={a.criativo_titulo ?? a.nome}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
              )}
              {a.status && (
                <Badge
                  variant="outline"
                  className={cn(
                    "absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 h-4",
                    STATUS_COLORS[a.status] ?? "",
                  )}
                >
                  {a.status}
                </Badge>
              )}
            </div>

            <div className="p-2.5 flex flex-col gap-1.5 flex-1">
              <p className="font-medium leading-tight line-clamp-2" title={a.nome}>
                {a.nome}
              </p>

              {(a.criativo_titulo || a.criativo_body) && (
                <div className="text-muted-foreground leading-tight">
                  {a.criativo_titulo && (
                    <p className="line-clamp-1 font-medium" title={a.criativo_titulo}>
                      {a.criativo_titulo}
                    </p>
                  )}
                  {a.criativo_body && (
                    <p className="line-clamp-2 mt-0.5" title={a.criativo_body}>
                      {a.criativo_body}
                    </p>
                  )}
                </div>
              )}

              {(a.campanha_nome || a.ad_set_nome) && (
                <p className="text-[10px] text-muted-foreground truncate" title={a.campanha_nome ?? ""}>
                  📁 {a.campanha_nome ?? "—"}
                </p>
              )}

              {/* Métricas — 2 colunas compactas */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 mt-auto border-t border-border text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gasto</span>
                  <span className="font-semibold tabular-nums">
                    {a.gasto > 0 ? brl(a.gasto) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leads</span>
                  <span className="font-semibold tabular-nums">{a.leads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CTR</span>
                  <span className="font-semibold tabular-nums">
                    {a.ctr > 0 ? `${a.ctr.toFixed(1)}%` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPL</span>
                  <span className="font-semibold tabular-nums">
                    {a.custo_lead > 0 ? brl(a.custo_lead) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

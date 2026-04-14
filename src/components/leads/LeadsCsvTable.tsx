import { useMemo } from "react";
import { Facebook, Instagram, Globe, Eye, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CsvLead } from "@/hooks/useLeadsCsv";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";

interface Props {
  leads: CsvLead[] | undefined;
  isLoading: boolean;
  onViewDetails?: (leadId: string) => void;
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "fb") return <Facebook className="h-4 w-4 text-blue-600" />;
  if (platform === "ig") return <Instagram className="h-4 w-4 text-pink-600" />;
  return <Globe className="h-4 w-4 text-muted-foreground" />;
}

function getDiasParadoColor(dias: number) {
  if (dias > 7) return "text-destructive font-semibold";
  if (dias >= 4) return "text-yellow-600 font-medium";
  return "text-muted-foreground";
}

function getEstagioColor(estagio: string) {
  const lower = estagio.toLowerCase();
  if (lower === "enviado") return "bg-green-100 text-green-800 border-green-200";
  if (lower === "novo") return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function openWhatsApp(phone: string) {
  const clean = phone.replace(/\D/g, "");
  window.open(`https://wa.me/${clean}`, "_blank");
}

export function LeadsCsvTable({ leads, isLoading, onViewDetails }: Props) {
  const columns = useMemo<DataTableColumn<CsvLead>[]>(
    () => [
      {
        id: "nome",
        header: "Nome",
        sortable: true,
        searchable: true,
        sortValue: (l) => l.nome,
        cell: (l) => (
          <span className="font-medium truncate max-w-[200px] block">{l.nome}</span>
        ),
      },
      {
        id: "plataforma",
        header: "Origem",
        sortable: true,
        searchable: true,
        sortValue: (l) => l.plataformaLabel,
        cell: (l) => (
          <div className="flex items-center gap-1.5">
            <PlatformIcon platform={l.plataforma} />
            <span className="text-sm">{l.plataformaLabel}</span>
          </div>
        ),
      },
      {
        id: "tipoServico",
        header: "Tipo",
        sortable: true,
        searchable: true,
        className: "text-sm",
        cell: (l) => l.tipoServico,
      },
      {
        id: "adName",
        header: "Anúncio",
        sortable: true,
        searchable: true,
        className: "text-sm",
        cell: (l) => (
          <span className="truncate max-w-[150px] block" title={l.adName}>
            {l.adName}
          </span>
        ),
      },
      {
        id: "campaignName",
        header: "Campanha",
        sortable: true,
        searchable: true,
        className: "text-sm",
        cell: (l) => (
          <span className="truncate max-w-[150px] block" title={l.campaignName}>
            {l.campaignName}
          </span>
        ),
      },
      {
        id: "estagio",
        header: "Estágio",
        sortable: true,
        searchable: true,
        cell: (l) => (
          <Badge variant="outline" className={getEstagioColor(l.estagio)}>
            {l.estagio}
          </Badge>
        ),
      },
      {
        id: "data",
        header: "Data",
        sortable: true,
        className: "text-sm",
        cell: (l) => l.data,
      },
      {
        id: "diasParado",
        header: "Dias Parado",
        sortable: true,
        sortValue: (l) => l.diasParado,
        cell: (l) => (
          <span className={cn(getDiasParadoColor(l.diasParado))}>
            {l.diasParado} dias
          </span>
        ),
      },
      {
        id: "actions",
        header: "Ação",
        className: "w-[100px]",
        cell: (l) => (
          <div className="flex items-center gap-1">
            {l.telefone && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWhatsApp(l.telefone);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chamar no WhatsApp</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(l.id);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalhes</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [onViewDetails],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <DataTable
      data={leads || []}
      columns={columns}
      rowKey={(l) => l.id}
      searchPlaceholder="Buscar por nome, origem, tipo, anúncio ou campanha..."
      emptyMessage="Nenhum lead encontrado no CSV"
      pageSize={25}
    />
  );
}

import { Facebook, Instagram, Globe, Eye, MessageCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">Nenhum lead encontrado no CSV</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estágio</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Dias Parado</TableHead>
            <TableHead className="w-[100px]">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <span className="truncate max-w-[200px] block">{lead.nome}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <PlatformIcon platform={lead.plataforma} />
                  <span className="text-sm">{lead.plataformaLabel}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">{lead.tipoServico}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getEstagioColor(lead.estagio)}>
                  {lead.estagio}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={lead.situacaoCor}>
                  {lead.situacao}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{lead.data}</TableCell>
              <TableCell>
                <span className={cn(getDiasParadoColor(lead.diasParado))}>
                  {lead.diasParado} dias
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {lead.telefone && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => openWhatsApp(lead.telefone)}
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
                        onClick={() => onViewDetails?.(lead.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver detalhes</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

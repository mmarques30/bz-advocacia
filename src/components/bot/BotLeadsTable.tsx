import { useState } from "react";
import { LeadBot } from "@/types/bot";
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
import { MessageCircle, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BotLeadDetailsDialog } from "./BotLeadDetailsDialog";
import { LEAD_STATUS_LABELS, ORIGEM_LABELS } from "@/types/leads";

interface BotLeadsTableProps {
  leads: LeadBot[];
  isLoading: boolean;
}

export function BotLeadsTable({ leads, isLoading }: BotLeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<LeadBot | null>(null);

  const getOrigemColor = (origem: string) => {
    const colors: Record<string, string> = {
      google: 'bg-blue-100 text-blue-800 border-blue-200',
      meta: 'bg-purple-100 text-purple-800 border-purple-200',
      indicacao: 'bg-green-100 text-green-800 border-green-200',
      whatsapp_bot: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      site: 'bg-gray-100 text-gray-800 border-gray-200',
      outro: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[origem] || colors.outro;
  };

  const getEstagioColor = (estagio: string) => {
    const colors: Record<string, string> = {
      novo: 'bg-blue-100 text-blue-800 border-blue-200',
      contato_inicial: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      em_analise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      proposta_enviada: 'bg-orange-100 text-orange-800 border-orange-200',
      fechado: 'bg-green-100 text-green-800 border-green-200',
      perdido: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[estagio] || colors.novo;
  };

  const openWhatsApp = (telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum lead recebido via WhatsApp Bot ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Área Jurídica</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bot Completo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.nome_completo}</TableCell>
                <TableCell>{lead.telefone}</TableCell>
                <TableCell>{lead.tipo_processo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getOrigemColor(lead.origem)}>
                    {ORIGEM_LABELS[lead.origem as keyof typeof ORIGEM_LABELS] || lead.origem}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getEstagioColor(lead.estagio)}>
                    {LEAD_STATUS_LABELS[lead.estagio as keyof typeof LEAD_STATUS_LABELS]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.bot_finalizado ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Sim
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                      Não
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openWhatsApp(lead.telefone)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLead && (
        <BotLeadDetailsDialog
          lead={selectedLead}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  );
}

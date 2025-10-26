import { useState } from "react";
import { useLeadComunicacoes, useCreateComunicacao } from "@/hooks/useLeadComunicacoes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadComunicacoesProps {
  leadId: string;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "entregue":
    case "lido":
      return "default";
    case "enviado":
      return "secondary";
    case "erro":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    enviado: "Enviado",
    entregue: "Entregue",
    lido: "Lido",
    erro: "Erro",
  };
  return labels[status] || status;
};

export function LeadComunicacoes({ leadId }: LeadComunicacoesProps) {
  const [selectedCom, setSelectedCom] = useState<any>(null);

  const { data: comunicacoes, isLoading } = useLeadComunicacoes(leadId);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4" />;
      case "ligacao":
        return <Phone className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      email: "Email",
      whatsapp: "WhatsApp",
      ligacao: "Ligação",
    };
    return labels[tipo] || tipo;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!comunicacoes || comunicacoes.length === 0) {
    return (
      <div className="text-center py-12">
        <Send className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhuma comunicação registrada ainda</p>
        <p className="text-sm text-muted-foreground mt-1">
          Futuras comunicações enviadas aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {comunicacoes.map((com) => (
            <div
              key={com.id}
              className="p-4 border rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => setSelectedCom(com)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTipoIcon(com.tipo)}
                  <div>
                    <p className="text-sm font-medium">
                      {getTipoLabel(com.tipo)}
                      {com.template_usado && ` - ${com.template_usado}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(com.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                <Badge variant={getStatusVariant(com.status)}>
                  {getStatusLabel(com.status)}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {com.mensagem}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Dialog de visualização completa */}
      <Dialog open={!!selectedCom} onOpenChange={(open) => !open && setSelectedCom(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCom && getTipoIcon(selectedCom.tipo)}
              {selectedCom && getTipoLabel(selectedCom.tipo)}
              {selectedCom?.template_usado && ` - ${selectedCom.template_usado}`}
            </DialogTitle>
            <DialogDescription>
              {selectedCom &&
                format(new Date(selectedCom.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              {" • "}
              <Badge variant={getStatusVariant(selectedCom?.status || "")}>
                {getStatusLabel(selectedCom?.status || "")}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Mensagem:</p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{selectedCom?.mensagem}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

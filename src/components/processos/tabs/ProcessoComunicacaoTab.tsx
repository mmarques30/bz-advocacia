import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWhatsAppHistoricoProcesso } from "@/hooks/useWhatsAppHistorico";
import { Send, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { EnviarMensagemDialog } from "@/components/comunicacao/EnviarMensagemDialog";

interface ProcessoComunicacaoTabProps {
  processoId: string;
  processo: any;
}

export function ProcessoComunicacaoTab({ processoId, processo }: ProcessoComunicacaoTabProps) {
  const { data: historico = [] } = useWhatsAppHistoricoProcesso(processoId);
  const [enviarDialogOpen, setEnviarDialogOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
      case 'entregue':
      case 'lido':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'falhou':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Notificações WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            {historico.length} mensagem(ns) enviada(s)
          </p>
        </div>
        <Button onClick={() => setEnviarDialogOpen(true)}>
          <Send className="mr-2 h-4 w-4" />
          Enviar Notificação
        </Button>
      </div>

      {historico.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma notificação enviada para este processo
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {historico.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(item.status)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.destinatario_nome}</span>
                      <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{item.mensagem}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EnviarMensagemDialog
        open={enviarDialogOpen}
        onOpenChange={setEnviarDialogOpen}
        processoId={processoId}
        processo={processo}
      />
    </div>
  );
}

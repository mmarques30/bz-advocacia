import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEnviarWhatsApp } from "@/hooks/useWhatsAppEnvio";

interface EnviarMensagemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: string;
  processo: any;
}

export function EnviarMensagemDialog({ open, onOpenChange, processoId, processo }: EnviarMensagemDialogProps) {
  const [mensagem, setMensagem] = useState("");
  const enviarWhatsApp = useEnviarWhatsApp();

  const handleEnviar = () => {
    enviarWhatsApp.mutate({
      destinatario_telefone: processo.cliente?.telefone || "",
      destinatario_nome: processo.cliente?.nome_completo || "",
      mensagem,
      processo_id: processoId,
      cliente_id: processo.lead_id,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setMensagem("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Notificação Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <p className="text-sm">{processo.cliente?.nome_completo || "N/A"}</p>
          </div>

          <div>
            <Label htmlFor="mensagem">Mensagem *</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem..."
              className="min-h-[200px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={!mensagem || enviarWhatsApp.isPending}>
              Enviar Agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateClienteDados } from "@/hooks/useContratos";
import { ESTADOS_CIVIS } from "@/types/contratos";

interface ComplementarDadosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  camposFaltantes: string[];
  onComplete: () => void;
}

const LABELS_CAMPOS: Record<string, string> = {
  cpf: 'CPF',
  rg: 'RG',
  nacionalidade: 'Nacionalidade',
  profissao: 'Profissao',
  estado_civil: 'Estado Civil',
  endereco_completo: 'Endereco Completo',
};

export function ComplementarDadosDialog({
  open,
  onOpenChange,
  clienteId,
  camposFaltantes,
  onComplete,
}: ComplementarDadosDialogProps) {
  const [dados, setDados] = useState<Record<string, string>>({});
  const updateCliente = useUpdateClienteDados();

  const handleSubmit = async () => {
    const updatePayload: { id: string; [key: string]: unknown } = { id: clienteId, ...dados };
    // Sync estado_civil to situacao_atual for legacy compatibility
    if (dados.estado_civil) {
      updatePayload.situacao_atual = dados.estado_civil;
    }
    await updateCliente.mutateAsync(updatePayload);
    onComplete();
  };

  const renderCampo = (campo: string) => {
    if (campo === 'estado_civil') {
      return (
        <div key={campo} className="space-y-2">
          <Label>{LABELS_CAMPOS[campo]}</Label>
          <Select
            value={dados[campo] || ''}
            onValueChange={(value) => setDados({ ...dados, [campo]: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_CIVIS.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={campo} className="space-y-2">
        <Label>{LABELS_CAMPOS[campo] || campo}</Label>
        <Input
          value={dados[campo] || ''}
          onChange={(e) => setDados({ ...dados, [campo]: e.target.value })}
          placeholder={
            campo === 'cpf' ? '000.000.000-00' :
            campo === 'nacionalidade' ? 'brasileiro(a)' :
            ''
          }
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dados Necessarios para o Contrato</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Os seguintes dados precisam ser preenchidos para gerar o contrato:
          </p>
          
          {camposFaltantes.map(renderCampo)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateCliente.isPending}>
            Salvar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

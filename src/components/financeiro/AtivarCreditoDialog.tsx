import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAtivarCredito, useConverterCredito } from "@/hooks/useCreditosCondicionais";
import type { CreditoCondicional } from "@/types/financeiro";
import { format } from "date-fns";

interface Props {
  credito: CreditoCondicional | null;
  open: boolean;
  onClose: () => void;
}

export function AtivarCreditoDialog({ credito, open, onClose }: Props) {
  const [dataAtivacao, setDataAtivacao] = useState(format(new Date(), "yyyy-MM-dd"));
  const [converterDireto, setConverterDireto] = useState(false);

  const ativar = useAtivarCredito();
  const converter = useConverterCredito();

  if (!credito) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (converterDireto) {
      converter.mutate(
        { ...credito, data_ativacao: dataAtivacao },
        { onSuccess: onClose }
      );
    } else {
      ativar.mutate(
        { id: credito.id, data_ativacao: dataAtivacao },
        { onSuccess: onClose }
      );
    }
  };

  const isPending = ativar.isPending || converter.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ativar Crédito Condicional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border p-3 space-y-1 text-sm">
            <p><strong>{credito.descricao}</strong></p>
            <p className="text-muted-foreground">Evento: {credito.evento_gatilho}</p>
            <p className="font-medium">R$ {credito.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="space-y-2">
            <Label>Data de Ativação *</Label>
            <Input type="date" value={dataAtivacao} onChange={(e) => setDataAtivacao(e.target.value)} required />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="converter"
              checked={converterDireto}
              onCheckedChange={(v) => setConverterDireto(!!v)}
            />
            <Label htmlFor="converter" className="text-sm cursor-pointer">
              Converter diretamente em acordo financeiro
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Processando..." : converterDireto ? "Ativar e Converter" : "Ativar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

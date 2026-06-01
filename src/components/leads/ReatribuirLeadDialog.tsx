import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAdvogadosSdr, useReatribuirLead } from "@/hooks/useReatribuirLead";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  responsavelAtualId: string | null;
}

export function ReatribuirLeadDialog({ open, onOpenChange, leadId, responsavelAtualId }: Props) {
  const { data: advogados = [], isLoading } = useAdvogadosSdr();
  const reatribuir = useReatribuirLead();
  const [modo, setModo] = useState<"outro" | "pool">("outro");
  const [novoId, setNovoId] = useState<string>("");
  const [motivo, setMotivo] = useState("");

  const disponiveis = advogados.filter((a) => a.id !== responsavelAtualId);

  function reset() {
    setModo("outro");
    setNovoId("");
    setMotivo("");
  }

  async function handleConfirmar() {
    if (modo === "outro" && !novoId) return;
    await reatribuir.mutateAsync({
      lead_id: leadId,
      novo_responsavel_id: modo === "outro" ? novoId : null,
      motivo: motivo.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reatribuir lead</DialogTitle>
          <DialogDescription>
            Passe esta conversa para outro advogado ou devolva ao pool comum.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={modo} onValueChange={(v) => setModo(v as "outro" | "pool")}>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="outro" id="modo-outro" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="modo-outro" className="text-sm font-medium cursor-pointer">
                  Passar pra outro advogado
                </Label>
                {modo === "outro" && (
                  <Select value={novoId} onValueChange={setNovoId} disabled={isLoading}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={isLoading ? "Carregando…" : "Selecionar advogado"} />
                    </SelectTrigger>
                    <SelectContent>
                      {disponiveis.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="text-xs">
                          {a.nome}
                        </SelectItem>
                      ))}
                      {disponiveis.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Nenhum outro advogado disponível
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="pool" id="modo-pool" className="mt-1" />
              <Label htmlFor="modo-pool" className="text-sm font-medium cursor-pointer">
                Devolver pro pool (sem responsável)
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="motivo" className="text-xs text-muted-foreground">
              Motivo (opcional)
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: indo viajar, não é minha área, advogada X conhece a cliente…"
              rows={3}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={reatribuir.isPending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmar}
            disabled={
              reatribuir.isPending ||
              (modo === "outro" && !novoId)
            }
          >
            {reatribuir.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Confirmar reatribuição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

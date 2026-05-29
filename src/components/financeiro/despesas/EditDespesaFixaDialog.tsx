import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useUpdateDespesaFixa } from "@/hooks/useDespesasFixas";
import { useCategoriasDespesa } from "@/hooks/useCategoriasDespesa";
import { CONTA_LABELS } from "@/types/financeiro";
import type { DespesaFixa } from "@/types/financeiro";

interface Props {
  despesaFixa: DespesaFixa | null;
  open: boolean;
  onClose: () => void;
}

export function EditDespesaFixaDialog({ despesaFixa, open, onClose }: Props) {
  const updateDespesaFixa = useUpdateDespesaFixa();
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: "",
    conta: "escritorio",
    dia_vencimento: "10",
    observacoes: "",
  });

  useEffect(() => {
    if (despesaFixa) {
      setForm({
        descricao: despesaFixa.descricao,
        valor: String(despesaFixa.valor),
        categoria: despesaFixa.categoria,
        conta: despesaFixa.conta || "escritorio",
        dia_vencimento: String(despesaFixa.dia_vencimento),
        observacoes: despesaFixa.observacoes || "",
      });
    }
  }, [despesaFixa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!despesaFixa) return;
    updateDespesaFixa.mutate(
      {
        id: despesaFixa.id,
        descricao: form.descricao,
        valor: Number(form.valor),
        categoria: form.categoria,
        conta: form.conta,
        dia_vencimento: Number(form.dia_vencimento),
        observacoes: form.observacoes || null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Despesa Fixa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição</Label>
            <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Mensal (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} required />
            </div>
            <div>
              <Label>Dia de Vencimento</Label>
              <Input type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => setForm(p => ({ ...p, dia_vencimento: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_DESPESA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta</Label>
              <Select value={form.conta} onValueChange={v => setForm(p => ({ ...p, conta: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
          </div>
          <p className="text-xs text-muted-foreground">Alterações de valor afetam apenas futuras gerações. Ocorrências já geradas mantêm o valor original.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={updateDespesaFixa.isPending}>
              {updateDespesaFixa.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDespesaFixa } from "@/hooks/useDespesasFixas";
import { CATEGORIA_DESPESA_LABELS, CONTA_LABELS } from "@/types/financeiro";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewDespesaFixaDialog({ open, onClose }: Props) {
  const createDespesaFixa = useCreateDespesaFixa();
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: "aluguel_condominio",
    conta: "escritorio",
    dia_vencimento: "10",
    observacoes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDespesaFixa.mutate(
      {
        descricao: form.descricao,
        valor: Number(form.valor),
        categoria: form.categoria,
        conta: form.conta,
        dia_vencimento: Number(form.dia_vencimento),
        observacoes: form.observacoes || null,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ descricao: "", valor: "", categoria: "aluguel_condominio", conta: "escritorio", dia_vencimento: "10", observacoes: "" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Despesa Fixa</DialogTitle>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createDespesaFixa.isPending}>
              {createDespesaFixa.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

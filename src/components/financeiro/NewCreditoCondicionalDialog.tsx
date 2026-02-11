import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCreditoCondicional } from "@/hooks/useCreditosCondicionais";
import { supabase } from "@/integrations/supabase/client";
import { CONTA_LABELS } from "@/types/financeiro";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewCreditoCondicionalDialog({ open, onClose }: Props) {
  const [clienteId, setClienteId] = useState("");
  const [processoId, setProcessoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [conta, setConta] = useState("escritorio");
  const [eventoGatilho, setEventoGatilho] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const create = useCreateCreditoCondicional();
  const { data: clientes } = useQuery({
    queryKey: ["clientes-dropdown"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_submissions").select("id, nome_completo").order("nome_completo");
      return data || [];
    },
  });
  const { data: processos } = useQuery({
    queryKey: ["processos-dropdown"],
    queryFn: async () => {
      const { data } = await supabase.from("processos").select("id, numero_processo, tipo, lead_id").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const clienteProcessos = processos?.filter((p) => p.lead_id === clienteId) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        cliente_id: clienteId,
        processo_id: processoId || null,
        descricao,
        valor: Number(valor),
        conta,
        evento_gatilho: eventoGatilho,
        observacoes: observacoes || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setClienteId("");
          setProcessoId("");
          setDescricao("");
          setValor("");
          setConta("escritorio");
          setEventoGatilho("");
          setObservacoes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Crédito Condicional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clientes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Processo (opcional)</Label>
            <Select value={processoId} onValueChange={setProcessoId} disabled={!clienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione o processo" /></SelectTrigger>
              <SelectContent>
                {clienteProcessos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.numero_processo || p.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Honorários de êxito" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={conta} onValueChange={setConta}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Evento Gatilho *</Label>
            <Input value={eventoGatilho} onChange={(e) => setEventoGatilho(e.target.value)} placeholder="Ex: Concessão de liminar" required />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || !clienteId || !descricao || !valor || !eventoGatilho}>
              {create.isPending ? "Criando..." : "Criar Crédito"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

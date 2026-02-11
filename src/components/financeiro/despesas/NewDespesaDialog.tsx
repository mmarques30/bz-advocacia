import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateDespesa } from "@/hooks/useDespesas";
import { useProcessos } from "@/hooks/useProcessos";
import { CATEGORIA_DESPESA_LABELS, FORMA_PAGAMENTO_RECEBIDO_LABELS, STATUS_DESPESA_LABELS, CONTA_LABELS } from "@/types/financeiro";
import type { CategoriaDespesa, StatusDespesa, FormaPagamentoRecebido } from "@/types/financeiro";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";

interface NewDespesaDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewDespesaDialog({ open, onClose }: NewDespesaDialogProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState<Date | undefined>(new Date());
  const [categoria, setCategoria] = useState<CategoriaDespesa | "">("");
  const [processoId, setProcessoId] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoRecebido | "">("");
  const [status, setStatus] = useState<StatusDespesa>("pendente");
  const [observacoes, setObservacoes] = useState("");
  const [conta, setConta] = useState("escritorio");

  const createDespesa = useCreateDespesa();
  const { data: processos } = useProcessos({ status: undefined });
  const { data: categoriasDespesaDb } = useOpcoesSistema('categoria_despesa', true);

  const categoriasEntries = categoriasDespesaDb && categoriasDespesaDb.length > 0
    ? categoriasDespesaDb.map(o => [o.valor, o.label] as [string, string])
    : Object.entries(CATEGORIA_DESPESA_LABELS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao || !valor || !data || !categoria) {
      return;
    }

    createDespesa.mutate(
      {
        descricao,
        valor: parseFloat(valor),
        data: format(data, "yyyy-MM-dd"),
        categoria,
        processo_id: processoId || null,
        forma_pagamento: formaPagamento || null,
        status,
        observacoes: observacoes || null,
        anexo_url: null,
        conta,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setDescricao("");
    setValor("");
    setData(new Date());
    setCategoria("");
    setProcessoId("");
    setFormaPagamento("");
    setStatus("pendente");
    setObservacoes("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Aluguel do escritório"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaDespesa)} required>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasEntries.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="processo">Processo (opcional)</Label>
              <Select value={processoId || "none"} onValueChange={(val) => setProcessoId(val === "none" ? "" : val)}>
                <SelectTrigger id="processo">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {processos?.map((processo) => (
                    <SelectItem key={processo.id} value={processo.id}>
                      {processo.numero_processo || processo.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select value={formaPagamento || "none"} onValueChange={(value) => setFormaPagamento(value === "none" ? "" : value as FormaPagamentoRecebido)}>
                <SelectTrigger id="forma_pagamento">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  {Object.entries(FORMA_PAGAMENTO_RECEBIDO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status de Pagamento</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusDespesa)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_DESPESA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conta">Conta *</Label>
            <Select value={conta} onValueChange={setConta}>
              <SelectTrigger id="conta">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTA_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a despesa..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDespesa.isPending}>
              {createDespesa.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Trash2 } from "lucide-react";
import { useMetasMensais } from "@/hooks/useMetasMensais";
import { ScrollArea } from "@/components/ui/scroll-area";

const MESES = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function ConfigurarMetaDialog() {
  const [open, setOpen] = useState(false);
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [valor, setValor] = useState<string>("");

  const { metas, isLoading, upsertMeta, deleteMeta } = useMetasMensais();

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return;
    }
    upsertMeta.mutate({ mes, ano, valor: valorNumerico });
    setValor("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getMesNome = (mes: number) => {
    return MESES.find((m) => m.value === mes)?.label || "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-seasons">Configurar Metas Mensais</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor da Meta (R$)</Label>
            <Input
              type="text"
              placeholder="Ex: 100.000,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={upsertMeta.isPending}>
            {upsertMeta.isPending ? "Salvando..." : "Salvar Meta"}
          </Button>
        </form>

        <div className="mt-4">
          <h4 className="font-medium mb-2">Histórico de Metas</h4>
          <ScrollArea className="h-[200px]">
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : metas.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma meta configurada</p>
            ) : (
              <div className="space-y-2">
                {metas.map((meta) => (
                  <div
                    key={meta.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <span className="font-medium">
                        {getMesNome(meta.mes)} {meta.ano}
                      </span>
                      <span className="ml-2 text-primary font-semibold">
                        {formatCurrency(meta.valor)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMeta.mutate(meta.id)}
                      disabled={deleteMeta.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

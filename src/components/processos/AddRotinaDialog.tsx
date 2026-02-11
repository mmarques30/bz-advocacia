import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateRotina } from "@/hooks/useRotinasCalendario";

interface AddRotinaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPOS_ROTINA = [
  { value: "reuniao", label: "Reunião" },
  { value: "administrativo", label: "Administrativo" },
  { value: "pessoal", label: "Pessoal" },
  { value: "outro", label: "Outro" },
];

export default function AddRotinaDialog({ open, onOpenChange }: AddRotinaDialogProps) {
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [prioridade, setPrioridade] = useState("media");
  const [recorrente, setRecorrente] = useState(false);
  const [recorrencia, setRecorrencia] = useState("semanal");
  const [observacoes, setObservacoes] = useState("");

  const createRotina = useCreateRotina();

  const handleSubmit = () => {
    if (!titulo || !data) return;

    createRotina.mutate(
      {
        titulo,
        data,
        horario: horario || null,
        tipo,
        prioridade,
        recorrente,
        recorrencia: recorrente ? recorrencia : null,
        observacoes: observacoes || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTitulo("");
          setData("");
          setHorario("");
          setTipo("outro");
          setPrioridade("media");
          setRecorrente(false);
          setRecorrencia("semanal");
          setObservacoes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Rotina</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Reunião de equipe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_ROTINA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={recorrente} onCheckedChange={setRecorrente} />
            <Label>Recorrente</Label>
            {recorrente && (
              <Select value={recorrencia} onValueChange={setRecorrencia}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!titulo || !data || createRotina.isPending}>
            {createRotina.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

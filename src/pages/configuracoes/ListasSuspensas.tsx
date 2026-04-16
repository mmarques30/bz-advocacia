import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useOpcoesSistema, useCreateOpcao, useUpdateOpcao, useDeleteOpcao, type OpcaoSistema } from "@/hooks/useOpcoesSistema";
import { toast } from "@/lib/toast";

const GRUPOS = [
  { key: 'origem_lead' as const, label: 'Origem de Leads' },
  { key: 'tipo_processo' as const, label: 'Tipo de Processo' },
  { key: 'categoria_despesa' as const, label: 'Categoria de Despesas' },
  { key: 'categoria_tarefa' as const, label: 'Categoria de Tarefas' },
  { key: 'status_tarefa' as const, label: 'Status de Tarefas' },
  { key: 'fase_processo' as const, label: 'Fase do Processo' },
];

function GrupoTab({ grupo }: { grupo: typeof GRUPOS[number] }) {
  const { data: opcoes, isLoading } = useOpcoesSistema(grupo.key);
  const createOpcao = useCreateOpcao();
  const updateOpcao = useUpdateOpcao();
  const deleteOpcao = useDeleteOpcao();

  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValor, setNewValor] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const handleAdd = () => {
    if (!newLabel.trim() || !newValor.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    const maxOrdem = opcoes?.reduce((max, o) => Math.max(max, o.ordem), 0) ?? 0;
    createOpcao.mutate(
      { grupo: grupo.key, valor: newValor.trim().toLowerCase().replace(/\s+/g, '_'), label: newLabel.trim(), ordem: maxOrdem + 1 },
      { onSuccess: () => { setShowAdd(false); setNewLabel(""); setNewValor(""); } }
    );
  };

  const handleSaveEdit = (opcao: OpcaoSistema) => {
    if (!editLabel.trim()) return;
    updateOpcao.mutate({ id: opcao.id, label: editLabel.trim() });
    setEditingId(null);
  };

  const handleToggleAtivo = (opcao: OpcaoSistema) => {
    updateOpcao.mutate({ id: opcao.id, ativo: !opcao.ativo });
  };

  const handleDelete = (opcao: OpcaoSistema) => {
    if (confirm(`Deseja remover a opção "${opcao.label}"?`)) {
      deleteOpcao.mutate({ id: opcao.id, grupo: grupo.key });
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{opcoes?.length ?? 0} opções cadastradas</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Código</TableHead>
            <TableHead className="w-[80px]">Ativo</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opcoes?.map((opcao) => (
            <TableRow key={opcao.id} className={!opcao.ativo ? "opacity-50" : ""}>
              <TableCell>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </TableCell>
              <TableCell>
                {editingId === opcao.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(opcao);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button size="sm" variant="outline" onClick={() => handleSaveEdit(opcao)}>
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <span className="font-medium">{opcao.label}</span>
                )}
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">{opcao.valor}</code>
              </TableCell>
              <TableCell>
                <Switch checked={opcao.ativo} onCheckedChange={() => handleToggleAtivo(opcao)} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={`Editar opção ${opcao.label}`}
                    onClick={() => { setEditingId(opcao.id); setEditLabel(opcao.label); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Excluir opção ${opcao.label}`}
                    onClick={() => handleDelete(opcao)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Opção - {grupo.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome (exibido ao usuário)</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Google Ads"
              />
            </div>
            <div className="space-y-2">
              <Label>Código (interno, sem espaços)</Label>
              <Input
                value={newValor}
                onChange={(e) => setNewValor(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="Ex: google_ads"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={createOpcao.isPending}>
              {createOpcao.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ListasSuspensas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Listas do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as opções de listas suspensas utilizadas em todo o sistema
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="origem_lead">
            <TabsList className="grid grid-cols-5 w-full">
              {GRUPOS.map((g) => (
                <TabsTrigger key={g.key} value={g.key}>{g.label}</TabsTrigger>
              ))}
            </TabsList>
            {GRUPOS.map((g) => (
              <TabsContent key={g.key} value={g.key}>
                <GrupoTab grupo={g} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

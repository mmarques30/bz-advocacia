import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useTreinamentos, useCreateTreinamento, useUpdateTreinamento, useDeleteTreinamento } from "@/hooks/useTreinamentos";
import { useIsAdvogada } from "@/hooks/useIsAdvogada";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIAS = ["geral", "vendas", "processos", "financeiro", "sistema"];

export default function Treinamentos() {
  const { data: treinamentos, isLoading } = useTreinamentos();
  const createMutation = useCreateTreinamento();
  const updateMutation = useUpdateTreinamento();
  const deleteMutation = useDeleteTreinamento();
  const { isAdvogada } = useIsAdvogada();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [categoria, setCategoria] = useState("geral");

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setDriveUrl("");
    setCategoria("geral");
    setEditId(null);
  };

  const handleSubmit = () => {
    if (!titulo || !driveUrl) return;
    if (editId) {
      updateMutation.mutate({ id: editId, titulo, descricao, drive_url: driveUrl, categoria }, {
        onSuccess: () => { setOpen(false); resetForm(); },
      });
    } else {
      createMutation.mutate({ titulo, descricao, drive_url: driveUrl, categoria }, {
        onSuccess: () => { setOpen(false); resetForm(); },
      });
    }
  };

  const handleEdit = (t: any) => {
    setEditId(t.id);
    setTitulo(t.titulo);
    setDescricao(t.descricao || "");
    setDriveUrl(t.drive_url);
    setCategoria(t.categoria || "geral");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Treinamentos
          </h2>
          <p className="text-muted-foreground mt-1">Vídeos e materiais de treinamento da plataforma</p>
        </div>
        {isAdvogada && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Adicionar Treinamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Título *" value={titulo} onChange={e => setTitulo(e.target.value)} />
                <Textarea placeholder="Descrição (opcional)" value={descricao} onChange={e => setDescricao(e.target.value)} />
                <Input placeholder="URL do Google Drive *" value={driveUrl} onChange={e => setDriveUrl(e.target.value)} />
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmit} disabled={!titulo || !driveUrl} className="w-full">
                  {editId ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !treinamentos?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum treinamento cadastrado</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {treinamentos.map(t => (
            <Card key={t.id} className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold truncate">{t.titulo}</h3>
                    </div>
                    {t.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{t.descricao}</p>}
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {t.categoria?.charAt(0).toUpperCase() + t.categoria?.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <a href={t.drive_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    {isAdvogada && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

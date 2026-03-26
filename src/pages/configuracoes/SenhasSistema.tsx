import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Plus, Eye, EyeOff, Copy, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useSenhasSistema, useCreateSenha, useUpdateSenha, useDeleteSenha } from "@/hooks/useSenhasSistema";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const CATEGORIAS = ["geral", "plataformas", "apis", "emails", "redes_sociais", "outros"];

export default function SenhasSistema() {
  const { data: senhas, isLoading } = useSenhasSistema();
  const createMutation = useCreateSenha();
  const updateMutation = useUpdateSenha();
  const deleteMutation = useDeleteSenha();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [categoria, setCategoria] = useState("geral");
  const [observacoes, setObservacoes] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setTitulo(""); setUrl(""); setUsuario(""); setSenha(""); setCategoria("geral"); setObservacoes(""); setEditId(null);
  };

  const handleSubmit = () => {
    if (!titulo || !senha) return;
    const payload = { titulo, url: url || undefined, usuario: usuario || undefined, senha, categoria, observacoes: observacoes || undefined };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload }, { onSuccess: () => { setOpen(false); resetForm(); } });
    } else {
      createMutation.mutate(payload, { onSuccess: () => { setOpen(false); resetForm(); } });
    }
  };

  const handleEdit = (s: any) => {
    setEditId(s.id); setTitulo(s.titulo); setUrl(s.url || ""); setUsuario(s.usuario || "");
    setSenha(s.senha); setCategoria(s.categoria || "geral"); setObservacoes(s.observacoes || ""); setOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categoriaLabel = (c: string) => {
    const map: Record<string, string> = { geral: "Geral", plataformas: "Plataformas", apis: "APIs", emails: "E-mails", redes_sociais: "Redes Sociais", outros: "Outros" };
    return map[c] || c;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            Senhas do Sistema
          </h2>
          <p className="text-muted-foreground mt-1">Senhas de aplicações, plataformas e sites úteis (apenas admins)</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Adicionar Senha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Senha" : "Nova Senha"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Título/Nome do serviço *" value={titulo} onChange={e => setTitulo(e.target.value)} />
              <Input placeholder="URL do site (opcional)" value={url} onChange={e => setUrl(e.target.value)} />
              <Input placeholder="Usuário/Email de acesso" value={usuario} onChange={e => setUsuario(e.target.value)} />
              <Input placeholder="Senha *" value={senha} onChange={e => setSenha(e.target.value)} type="text" />
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{categoriaLabel(c)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Observações (opcional)" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
              <Button onClick={handleSubmit} disabled={!titulo || !senha} className="w-full">
                {editId ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !senhas?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma senha cadastrada</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senhas.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.titulo}</div>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-0.5">
                        <ExternalLink className="h-3 w-3" />{s.url}
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.usuario ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{s.usuario}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(s.usuario!, "Usuário")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono">{visiblePasswords[s.id] ? s.senha : "••••••••"}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => togglePassword(s.id)}>
                        {visiblePasswords[s.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(s.senha, "Senha")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{categoriaLabel(s.categoria)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

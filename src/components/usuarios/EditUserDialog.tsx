import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateUser, Usuario } from "@/hooks/useUsuarios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
}

const availableRoles = [
  { value: "admin", label: "Admin", description: "Acesso total ao sistema" },
  { value: "advogado", label: "Advogado", description: "Processos, leads e financeiro" },
  { value: "assistente", label: "Assistente", description: "Processos e leads" },
  { value: "financeiro", label: "Financeiro", description: "Apenas módulo financeiro" },
];

const cargos = [
  "Advogado(a)",
  "Advogado(a) Sênior",
  "Estagiário(a)",
  "Assistente Jurídico",
  "Assistente Administrativo",
  "Secretário(a)",
  "Gerente",
  "Sócio(a)",
  "Outro",
];

export function EditUserDialog({ open, onOpenChange, usuario }: EditUserDialogProps) {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const { mutate: updateUser, isPending } = useUpdateUser();

  useEffect(() => {
    if (usuario) {
      setNomeCompleto(usuario.nome_completo);
      setTelefone(usuario.telefone || "");
      setCargo(usuario.cargo || "");
      setSelectedRoles(usuario.roles);
    }
  }, [usuario]);

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = () => {
    updateUser(
      { 
        userId: usuario.id, 
        data: {
          nome_completo: nomeCompleto,
          telefone: telefone || null,
          cargo: cargo || null,
        },
        roles: selectedRoles 
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Editar informações de {usuario.nome_completo}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome Completo</Label>
              <Input
                id="edit-nome"
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={usuario.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cargo">Cargo</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="permissoes" className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Defina quais áreas do sistema este usuário pode acessar:
            </p>
            {availableRoles.map((role) => (
              <div key={role.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`edit-${role.value}`}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => handleToggleRole(role.value)}
                />
                <div className="space-y-1">
                  <Label htmlFor={`edit-${role.value}`} className="cursor-pointer font-medium">
                    {role.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !nomeCompleto}>
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

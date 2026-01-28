import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateUser, Usuario } from "@/hooks/useUsuarios";
import { useUserPagePermissions, useUpdateUserPagePermissions } from "@/hooks/usePagePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PagePermissionsEditor } from "./PagePermissionsEditor";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
}

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [pagePermissions, setPagePermissions] = useState<string[]>([]);
  
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUser();
  const { mutate: updatePagePermissions, isPending: isUpdatingPermissions } = useUpdateUserPagePermissions();
  const { data: existingPermissions, isLoading: isLoadingPermissions } = useUserPagePermissions(usuario.id);

  const isPending = isUpdatingUser || isUpdatingPermissions;

  useEffect(() => {
    if (usuario) {
      setNomeCompleto(usuario.nome_completo);
      setTelefone(usuario.telefone || "");
      setCargo(usuario.cargo || "");
      setIsAdmin(usuario.roles.includes("admin"));
    }
  }, [usuario]);

  useEffect(() => {
    if (existingPermissions) {
      setPagePermissions(
        existingPermissions
          .filter(p => p.can_access)
          .map(p => p.page_key)
      );
    }
  }, [existingPermissions]);

  const handleSubmit = () => {
    // Atualizar perfil e roles
    updateUser(
      { 
        userId: usuario.id, 
        data: {
          nome_completo: nomeCompleto,
          telefone: telefone || null,
          cargo: cargo || null,
        },
        roles: isAdmin ? ["admin"] : [] 
      },
      {
        onSuccess: () => {
          // Se não for admin, atualizar permissões de página
          if (!isAdmin) {
            updatePagePermissions({
              userId: usuario.id,
              permissions: pagePermissions.map(key => ({
                page_key: key,
                can_access: true,
              })),
            }, {
              onSuccess: () => {
                onOpenChange(false);
              }
            });
          } else {
            onOpenChange(false);
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Editar informações de {usuario.nome_completo}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="space-y-4 py-4 flex-1 overflow-y-auto">
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
          
          <TabsContent value="permissoes" className="py-4 flex-1 overflow-hidden flex flex-col">
            {/* Admin Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 mb-4">
              <Checkbox
                id="edit-admin"
                checked={isAdmin}
                onCheckedChange={(checked) => setIsAdmin(checked === true)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Label htmlFor="edit-admin" className="cursor-pointer font-medium">
                    Administrador
                  </Label>
                  <Badge variant="secondary" className="text-xs">Acesso Total</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Administradores têm acesso irrestrito a todas as páginas e funcionalidades
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="flex-1 flex items-center justify-center text-center p-8 border rounded-lg bg-muted/20">
                <div>
                  <Shield className="h-12 w-12 mx-auto text-primary mb-3" />
                  <p className="font-medium">Acesso Administrativo Ativo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este usuário tem acesso a todas as páginas do sistema
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione as páginas que este usuário pode acessar:
                </p>
                {isLoadingPermissions ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando permissões...</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto border rounded-lg p-2">
                    <PagePermissionsEditor
                      permissions={pagePermissions}
                      onChange={setPagePermissions}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
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

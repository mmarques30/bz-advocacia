import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser } from "@/hooks/useUsuarios";
import { useUpdateUserPagePermissions } from "@/hooks/usePagePermissions";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PagePermissionsEditor } from "./PagePermissionsEditor";
import { Badge } from "@/components/ui/badge";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pagePermissions, setPagePermissions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  const { mutate: createUser, isPending } = useCreateUser();
  const { mutate: updatePagePermissions } = useUpdateUserPagePermissions();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNomeCompleto("");
    setIsAdmin(false);
    setPagePermissions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nomeCompleto) return;

    createUser(
      { 
        email, 
        password, 
        role: isAdmin ? "admin" : "user", 
        nome_completo: nomeCompleto 
      },
      {
        onSuccess: (data) => {
          // Se não for admin e tiver permissões selecionadas, atualizar
          if (!isAdmin && pagePermissions.length > 0 && data?.user?.id) {
            updatePagePermissions({
              userId: data.user.id,
              permissions: pagePermissions.map(key => ({
                page_key: key,
                can_access: true,
              })),
            });
          }
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Cadastrar Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário definindo email, senha e permissões
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="dados" className="w-full flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados de Acesso</TabsTrigger>
              <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dados" className="space-y-4 py-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="João da Silva"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="permissoes" className="py-4 flex-1 overflow-hidden flex flex-col">
              {/* Admin Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 mb-4">
                <Checkbox
                  id="create-admin"
                  checked={isAdmin}
                  onCheckedChange={(checked) => setIsAdmin(checked === true)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <Label htmlFor="create-admin" className="cursor-pointer font-medium">
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
                    <p className="font-medium">Acesso Administrativo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Este usuário terá acesso a todas as páginas do sistema
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecione as páginas que este usuário poderá acessar:
                  </p>
                  <div className="flex-1 overflow-y-auto border rounded-lg p-2">
                    <PagePermissionsEditor
                      permissions={pagePermissions}
                      onChange={setPagePermissions}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !email || !password || !nomeCompleto}>
              {isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

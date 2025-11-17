import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUser } from "@/hooks/useUsuarios";
import { Eye, EyeOff } from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [role, setRole] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: createUser, isPending } = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role || !nomeCompleto) return;

    createUser(
      { email, password, role, nome_completo: nomeCompleto },
      {
        onSuccess: () => {
          setEmail("");
          setPassword("");
          setNomeCompleto("");
          setRole("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário definindo email, senha e permissão
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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

            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma permissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Acesso Total</SelectItem>
                  <SelectItem value="advogado">Advogado - Processos, Leads, Financeiro</SelectItem>
                  <SelectItem value="assistente">Assistente - Processos e Leads</SelectItem>
                  <SelectItem value="financeiro">Financeiro - Apenas Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !email || !password || !role || !nomeCompleto}>
              {isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

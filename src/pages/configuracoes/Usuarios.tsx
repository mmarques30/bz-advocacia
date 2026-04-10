import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search } from "lucide-react";
import { useUsuarios, useToggleUserStatus, useCheckIsAdmin } from "@/hooks/useUsuarios";
import { UsuariosTable } from "@/components/usuarios/UsuariosTable";
import { CreateUserDialog } from "@/components/usuarios/CreateUserDialog";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  const { data: usuarios = [], isLoading } = useUsuarios();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useCheckIsAdmin();
  const { mutate: toggleStatus } = useToggleUserStatus();

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingAdmin) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-seasons text-primary">Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os usuários e permissões do escritório
          </p>
        </div>

        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Usuários</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os usuários e permissões do escritório
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Cadastrar Usuário
        </Button>
      </div>

      <UsuariosTable
        usuarios={filteredUsuarios}
        isLoading={isLoading}
        onToggleStatus={(userId, ativo) => toggleStatus({ userId, ativo })}
      />

      

      <CreateUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, UserCog, Power, Key } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Usuario } from "@/hooks/useUsuarios";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EditUserRoleDialog } from "./EditUserRoleDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

interface UsuariosTableProps {
  usuarios: Usuario[];
  isLoading: boolean;
  onToggleStatus: (userId: string, ativo: boolean) => void;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "destructive";
    case "advogado":
      return "default";
    case "assistente":
      return "secondary";
    case "financeiro":
      return "outline";
    default:
      return "outline";
  }
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: "Admin",
    advogado: "Advogado",
    assistente: "Assistente",
    financeiro: "Financeiro",
  };
  return labels[role] || role;
};

export function UsuariosTable({ usuarios, isLoading, onToggleStatus }: UsuariosTableProps) {
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<Usuario | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={usuario.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(usuario.nome_completo)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{usuario.nome_completo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>{usuario.cargo || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {usuario.roles.length === 0 ? (
                        <Badge variant="outline">Sem permissões</Badge>
                      ) : (
                        usuario.roles.map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.ultimo_acesso
                      ? format(new Date(usuario.ultimo_acesso), "dd/MM/yyyy HH:mm")
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.ativo ? "default" : "secondary"}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(usuario);
                            setEditDialogOpen(true);
                          }}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Editar Permissões
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setResetPasswordUser(usuario);
                            setResetPasswordOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Redefinir Senha
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(usuario.id, !usuario.ativo)}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          {usuario.ativo ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <EditUserRoleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          usuario={selectedUser}
        />
      )}
      
      {resetPasswordUser && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          userId={resetPasswordUser.id}
          userName={resetPasswordUser.nome_completo}
        />
      )}
    </>
  );
}

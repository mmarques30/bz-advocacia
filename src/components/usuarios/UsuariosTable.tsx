import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Power, Key, Pencil, Trash2, Shield, FileCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Usuario } from "@/hooks/useUsuarios";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EditUserDialog } from "./EditUserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";

interface UsuariosTableProps {
  usuarios: Usuario[];
  isLoading: boolean;
  onToggleStatus: (userId: string, ativo: boolean) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UsuariosTable({ usuarios, isLoading, onToggleStatus }: UsuariosTableProps) {
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<Usuario | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<Usuario | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const columns = useMemo<DataTableColumn<Usuario>[]>(
    () => [
      {
        id: "nome_completo",
        header: "Usuário",
        sortable: true,
        searchable: true,
        sortValue: (u) => u.nome_completo,
        cell: (u) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={u.avatar_url || undefined} />
              <AvatarFallback>{getInitials(u.nome_completo)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{u.nome_completo}</span>
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        sortable: true,
        searchable: true,
        className: "text-muted-foreground",
        cell: (u) => u.email,
      },
      {
        id: "cargo",
        header: "Cargo",
        sortable: true,
        searchable: true,
        cell: (u) => u.cargo || "-",
      },
      {
        id: "roles",
        header: "Permissões",
        cell: (u) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex gap-1 flex-wrap">
                  {u.roles.includes("admin") ? (
                    <Badge variant="destructive" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <FileCheck className="h-3 w-3" />
                      Permissões por Página
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {u.roles.includes("admin")
                  ? "Acesso total a todas as páginas"
                  : "Clique em Editar para ver as permissões"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        id: "ultimo_acesso",
        header: "Último Acesso",
        sortable: true,
        className: "text-muted-foreground",
        // Sort by numeric timestamp so "Nunca" (null) sinks to the bottom on asc.
        sortValue: (u) => (u.ultimo_acesso ? new Date(u.ultimo_acesso).getTime() : 0),
        cell: (u) =>
          u.ultimo_acesso
            ? format(new Date(u.ultimo_acesso), "dd/MM/yyyy HH:mm")
            : "Nunca",
      },
      {
        id: "ativo",
        header: "Status",
        sortable: true,
        sortValue: (u) => (u.ativo ? 1 : 0),
        cell: (u) => (
          <Badge variant={u.ativo ? "default" : "secondary"}>
            {u.ativo ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        className: "w-[70px]",
        cell: (u) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Abrir ações de ${u.nome_completo}`} onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(u);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar Usuário
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setResetPasswordUser(u);
                  setResetPasswordOpen(true);
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Redefinir Senha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(u.id, !u.ativo)}>
                <Power className="h-4 w-4 mr-2" />
                {u.ativo ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setDeleteUser(u);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Usuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onToggleStatus],
  );

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
      <DataTable
        data={usuarios}
        columns={columns}
        rowKey={(u) => u.id}
        searchPlaceholder="Buscar por nome, email ou cargo..."
        emptyMessage="Nenhum usuário encontrado"
        pageSize={25}
      />

      {selectedUser && (
        <EditUserDialog
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

      {deleteUser && (
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          usuario={deleteUser}
        />
      )}
    </>
  );
}

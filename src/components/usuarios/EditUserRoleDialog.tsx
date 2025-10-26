import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUpdateUserRole, Usuario } from "@/hooks/useUsuarios";

interface EditUserRoleDialogProps {
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

export function EditUserRoleDialog({ open, onOpenChange, usuario }: EditUserRoleDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { mutate: updateRole, isPending } = useUpdateUserRole();

  useEffect(() => {
    setSelectedRoles(usuario.roles);
  }, [usuario]);

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = () => {
    updateRole(
      { userId: usuario.id, roles: selectedRoles },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Permissões</DialogTitle>
          <DialogDescription>
            Gerenciar permissões de {usuario.nome_completo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableRoles.map((role) => (
            <div key={role.value} className="flex items-start space-x-3">
              <Checkbox
                id={role.value}
                checked={selectedRoles.includes(role.value)}
                onCheckedChange={() => handleToggleRole(role.value)}
              />
              <div className="space-y-1">
                <Label htmlFor={role.value} className="cursor-pointer font-medium">
                  {role.label}
                </Label>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

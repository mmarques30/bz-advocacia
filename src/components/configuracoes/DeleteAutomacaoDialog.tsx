import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiIntegration } from "@/hooks/useAutomacoes";
import { AlertTriangle } from "lucide-react";

interface DeleteAutomacaoDialogProps {
  api: ApiIntegration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteAutomacaoDialog({
  api,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteAutomacaoDialogProps) {
  if (!api) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Excluir Integração</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Tem certeza que deseja excluir a integração <strong>{api.nome}</strong>?
            </p>
            <p className="text-sm">
              Esta ação não pode ser desfeita. Todas as configurações serão perdidas,
              mas o histórico de consultas será mantido.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

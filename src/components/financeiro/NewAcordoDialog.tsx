import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcordoForm } from "./AcordoForm";

interface NewAcordoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewAcordoDialog({ open, onClose }: NewAcordoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato Financeiro</DialogTitle>
        </DialogHeader>
        <AcordoForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

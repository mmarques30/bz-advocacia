import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface AccessDeniedProps {
  titulo?: string;
  descricao?: string;
}

export function AccessDenied({
  titulo = "Acesso restrito",
  descricao = "Você não tem permissão para acessar esta área. Fale com um administrador se precisar de acesso.",
}: AccessDeniedProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">{titulo}</h1>
      </div>
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>{descricao}</AlertDescription>
      </Alert>
    </div>
  );
}

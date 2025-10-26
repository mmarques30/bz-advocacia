import { EscritorioForm } from "@/components/configuracoes/EscritorioForm";
import { useConfiguracoesEscritorio } from "@/hooks/useConfiguracoesEscritorio";
import { Loader2 } from "lucide-react";

export default function Geral() {
  const { isLoading } = useConfiguracoesEscritorio();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações Gerais</h1>
        <p className="text-muted-foreground mt-2">
          Configure as informações e preferências do escritório
        </p>
      </div>

      <EscritorioForm />
    </div>
  );
}

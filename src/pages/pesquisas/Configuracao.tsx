import { DashboardLayout } from "@/components/DashboardLayout";
import { ConfiguracaoAPIForm } from "@/components/pesquisas/ConfiguracaoAPIForm";

export default function Configuracao() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuração de API</h1>
        <p className="text-muted-foreground mt-2">
          Configure as credenciais para realizar consultas de dados
        </p>
      </div>
      <ConfiguracaoAPIForm />
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/DashboardLayout";
import { ConfiguracaoAPIForm } from "@/components/pesquisas/ConfiguracaoAPIForm";

export default function Configuracao() {
  return (
    <DashboardLayout title="Configuração de API">
      <ConfiguracaoAPIForm />
    </DashboardLayout>
  );
}

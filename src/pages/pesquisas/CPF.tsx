import { ConsultaCPFForm } from "@/components/pesquisas/ConsultaCPFForm";
import { CreditosWidget } from "@/components/pesquisas/CreditosWidget";

const PesquisasCPF = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consulta de Pessoa Física</h1>
        <p className="text-muted-foreground">
          Consulte dados cadastrais de CPF na Receita Federal via Apify
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConsultaCPFForm />
        </div>
        <div>
          <CreditosWidget />
        </div>
      </div>
    </div>
  );
};

export default PesquisasCPF;

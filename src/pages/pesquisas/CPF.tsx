import { ConsultaCPFForm } from "@/components/pesquisas/ConsultaCPFForm";
import { CreditosWidget } from "@/components/pesquisas/CreditosWidget";

const PesquisasCPF = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-seasons text-primary">Consulta de Pessoa Física</h1>
          <p className="text-muted-foreground">
            Consulte dados cadastrais de CPF na Receita Federal
          </p>
        </div>
        <CreditosWidget compact />
      </div>

      <ConsultaCPFForm />
    </div>
  );
};

export default PesquisasCPF;

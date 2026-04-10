import ConsultaCNPJForm from "@/components/pesquisas/ConsultaCNPJForm";

export default function CNPJPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-seasons text-primary">Consultar Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Consulte dados cadastrais de empresas brasileiras via BrasilAPI (gratuito)
        </p>
      </div>

      <ConsultaCNPJForm />
    </div>
  );
}

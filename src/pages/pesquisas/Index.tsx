import ConsultaCNPJForm from "@/components/pesquisas/ConsultaCNPJForm";

// Por enquanto so mantemos a consulta gratuita de empresa (BrasilAPI).
// Datajud (processo) e Apify (CPF) dependem de assinaturas pagas —
// quando contratadas, criar paginas dedicadas e voltar com o menu de
// "Visão Geral". Por ora a tela inicial ja abre direto no formulario.
export default function PesquisasIndex() {
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

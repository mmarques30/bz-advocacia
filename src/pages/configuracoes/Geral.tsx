import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";
import { DadosEscritorioForm } from "@/components/configuracoes/DadosEscritorioForm";
import { EnderecoForm } from "@/components/configuracoes/EnderecoForm";
import { RedesSociaisForm } from "@/components/configuracoes/RedesSociaisForm";
import { PreferenciasForm } from "@/components/configuracoes/PreferenciasForm";
import { useConfiguracoesEscritorio, useUpdateConfiguracoesEscritorio } from "@/hooks/useConfiguracoesEscritorio";

export default function Geral() {
  const { data: config, isLoading } = useConfiguracoesEscritorio();
  const updateMutation = useUpdateConfiguracoesEscritorio();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações Gerais</h1>
          <p className="text-muted-foreground">
            Configure as informações e preferências do escritório
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="space-y-6">
        <DadosEscritorioForm data={formData} onChange={handleFieldChange} />
        <EnderecoForm data={formData} onChange={handleFieldChange} />
        <RedesSociaisForm data={formData} onChange={handleFieldChange} />
        <PreferenciasForm data={formData} onChange={handleFieldChange} />
      </div>
    </div>
  );
}

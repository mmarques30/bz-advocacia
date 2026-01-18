import { useState } from "react";
import { ConsultaImovelForm } from "@/components/pesquisas/ConsultaImovelForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileDown, Home, User, FileText } from "lucide-react";
import type { ConsultaImovelResponse } from "@/types/pesquisas";

export default function Imoveis() {
  const [resultado, setResultado] = useState<ConsultaImovelResponse | null>(null);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Consultar Imóvel</h1>
        <p className="text-muted-foreground mt-2">
          Busque informações sobre propriedades e registros imobiliários
        </p>
      </div>

      {/* Formulário ocupa largura total */}
      <ConsultaImovelForm onResultado={setResultado} />

      {/* Resultado aparece abaixo */}
      {resultado && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Resultado da Consulta
            </CardTitle>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados do Imóvel */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Dados do Imóvel</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{resultado.dados.endereco}</p>
                </div>
                {resultado.dados.matricula && (
                  <div>
                    <p className="text-sm text-muted-foreground">Matrícula</p>
                    <p className="font-medium">{resultado.dados.matricula}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Cidade/UF</p>
                  <p className="font-medium">{resultado.dados.cidade}/{resultado.dados.uf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p className="font-medium">{resultado.dados.cep}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Área</p>
                  <p className="font-medium">{resultado.dados.area} m²</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="outline">{resultado.dados.tipo}</Badge>
                </div>
                {resultado.dados.valor && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Estimado</p>
                    <p className="font-medium text-lg">
                      {resultado.dados.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Proprietário */}
            {resultado.dados.proprietario && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Proprietário
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{resultado.dados.proprietario.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                      <p className="font-medium">{resultado.dados.proprietario.cpfCnpj}</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Registros */}
            {resultado.dados.registros && resultado.dados.registros.length > 0 && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Registros ({resultado.dados.registros.length})
                  </h3>
                  <div className="space-y-3">
                    {resultado.dados.registros.map((registro, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{registro.descricao}</p>
                            <p className="text-sm text-muted-foreground">{registro.data}</p>
                          </div>
                          <Badge variant="outline">{registro.tipo}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Metadados */}
            <div className="text-sm text-muted-foreground">
              <p>ID da Consulta: {resultado.metadados.idConsulta}</p>
              <p>Custo: R$ {resultado.metadados.custo.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

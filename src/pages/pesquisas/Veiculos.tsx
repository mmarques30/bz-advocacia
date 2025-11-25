import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConsultaVeiculoForm } from "@/components/pesquisas/ConsultaVeiculoForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, CheckCircle2, AlertCircle } from "lucide-react";
import type { ConsultaVeiculoResponse } from "@/types/pesquisas";

export default function Veiculos() {
  const [resultado, setResultado] = useState<ConsultaVeiculoResponse | null>(null);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Consultar Veículo</h1>
        <p className="text-muted-foreground mt-2">
          Busque informações detalhadas sobre veículos
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <ConsultaVeiculoForm onResultado={setResultado} />
        </div>

        {resultado && (
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resultado da Consulta</CardTitle>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Dados do Veículo</h3>
                  <Separator className="mb-3" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Placa:</span>
                      <span className="font-mono">{resultado.dados.placa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RENAVAM:</span>
                      <span className="font-mono">{resultado.dados.renavam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marca/Modelo:</span>
                      <span>{resultado.dados.marca} {resultado.dados.modelo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano Fab/Mod:</span>
                      <span>{resultado.dados.anoFabricacao}/{resultado.dados.anoModelo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cor:</span>
                      <span>{resultado.dados.cor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combustível:</span>
                      <span>{resultado.dados.combustivel}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Situação</h3>
                  <Separator className="mb-3" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={resultado.dados.situacao.status === 'REGULAR' ? 'default' : 'destructive'}>
                        {resultado.dados.situacao.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">UF:</span>
                      <span>{resultado.dados.situacao.ufLicenciamento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Município:</span>
                      <span>{resultado.dados.situacao.municipio}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Restrições</h3>
                  <Separator className="mb-3" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {resultado.dados.restricoes.rouboFurto ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>Roubo/Furto</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {resultado.dados.restricoes.financiamento?.ativo ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span>Financiamento - {resultado.dados.restricoes.financiamento.instituicao}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          <span>Financiamento</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {resultado.dados.restricoes.judicial ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>Judicial</span>
                    </div>
                  </div>
                </div>

                {resultado.dados.proprietario && (
                  <div>
                    <h3 className="font-semibold mb-2">Proprietário</h3>
                    <Separator className="mb-3" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span>{resultado.dados.proprietario.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPF/CNPJ:</span>
                        <span className="font-mono">{resultado.dados.proprietario.cpfCnpj}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Município:</span>
                        <span>{resultado.dados.proprietario.municipio} - {resultado.dados.proprietario.uf}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Débitos</h3>
                  <Separator className="mb-3" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IPVA:</span>
                      <span>R$ {resultado.dados.debitos.ipva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Multas:</span>
                      <span>R$ {resultado.dados.debitos.multas.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Licenciamento:</span>
                      <span>R$ {resultado.dados.debitos.licenciamento.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>R$ {resultado.dados.debitos.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <p>ID da Consulta: {resultado.metadados.idConsulta}</p>
                  <p>Custo: R$ {resultado.metadados.custo.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

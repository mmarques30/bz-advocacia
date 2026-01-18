import { useState } from "react";
import { ConsultaVeiculoForm } from "@/components/pesquisas/ConsultaVeiculoForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileDown, Car, AlertTriangle, DollarSign, User } from "lucide-react";
import type { ConsultaVeiculoResponse } from "@/types/pesquisas";

export default function Veiculos() {
  const [resultado, setResultado] = useState<ConsultaVeiculoResponse | null>(null);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Consultar Veículo</h1>
        <p className="text-muted-foreground mt-2">
          Busque informações detalhadas sobre veículos por placa, RENAVAM ou chassi
        </p>
      </div>

      {/* Formulário ocupa largura total */}
      <ConsultaVeiculoForm onResultado={setResultado} />

      {/* Resultado aparece abaixo */}
      {resultado && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Resultado da Consulta
            </CardTitle>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados do Veículo */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Dados do Veículo</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium text-lg">{resultado.dados.placa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RENAVAM</p>
                  <p className="font-medium">{resultado.dados.renavam}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marca/Modelo</p>
                  <p className="font-medium">{resultado.dados.marca} {resultado.dados.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="font-medium">{resultado.dados.anoFabricacao}/{resultado.dados.anoModelo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cor</p>
                  <p className="font-medium">{resultado.dados.cor}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Combustível</p>
                  <p className="font-medium">{resultado.dados.combustivel}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Situação */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Situação</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={resultado.dados.situacao.status === "Regular" ? "default" : "destructive"}>
                    {resultado.dados.situacao.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">UF Licenciamento</p>
                  <p className="font-medium">{resultado.dados.situacao.ufLicenciamento}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Município</p>
                  <p className="font-medium">{resultado.dados.situacao.municipio}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Licenciado Até</p>
                  <p className="font-medium">{resultado.dados.situacao.licenciadoAte}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Restrições */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Restrições
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Roubo/Furto</p>
                  <Badge variant={resultado.dados.restricoes.rouboFurto ? "destructive" : "default"}>
                    {resultado.dados.restricoes.rouboFurto ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Financiamento</p>
                  <Badge variant={resultado.dados.restricoes.financiamento?.ativo ? "secondary" : "default"}>
                    {resultado.dados.restricoes.financiamento?.ativo 
                      ? resultado.dados.restricoes.financiamento.instituicao 
                      : "Não"}
                  </Badge>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Judicial</p>
                  <Badge variant={resultado.dados.restricoes.judicial ? "destructive" : "default"}>
                    {resultado.dados.restricoes.judicial ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Administrativa</p>
                  <Badge variant={resultado.dados.restricoes.administrativa ? "destructive" : "default"}>
                    {resultado.dados.restricoes.administrativa ? "Sim" : "Não"}
                  </Badge>
                </div>
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{resultado.dados.proprietario.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                      <p className="font-medium">{resultado.dados.proprietario.cpfCnpj}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Município/UF</p>
                      <p className="font-medium">{resultado.dados.proprietario.municipio}/{resultado.dados.proprietario.uf}</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Débitos */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Débitos
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">IPVA</p>
                  <p className="font-medium">
                    {resultado.dados.debitos.ipva.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Multas</p>
                  <p className="font-medium">
                    {resultado.dados.debitos.multas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Licenciamento</p>
                  <p className="font-medium">
                    {resultado.dados.debitos.licenciamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-lg text-destructive">
                    {resultado.dados.debitos.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

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

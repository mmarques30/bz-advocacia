import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import logoBZ from "@/assets/logo-bz-branco.jpg";
import fotoAdvogadas from "@/assets/advogadas-bz.png";
import { TEXTO_INSTITUCIONAL, TEXTO_SERVICO_COMPLETO } from "@/lib/propostaTemplates";

interface PropostaPreviewProps {
  clienteNome: string;
  clienteCPF?: string;
  descricaoServico: string;
  valorEntrada: number;
  descontoAvista: number;
  percentualExito: number;
  condicoesAdicionais: string;
}

export const PropostaPreview = ({
  clienteNome,
  clienteCPF,
  descricaoServico,
  valorEntrada,
  descontoAvista,
  percentualExito,
  condicoesAdicionais,
}: PropostaPreviewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const textoServico = TEXTO_SERVICO_COMPLETO.replace('{descricao_servico}', descricaoServico || '[descrição do serviço]');

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Preview da Proposta</CardTitle>
            <p className="text-sm text-muted-foreground">4 páginas</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full min-h-[500px]">
          <div className="p-4 space-y-4">
            {/* Página 1 - Apresentação */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 border-b">
                Página 1 - Apresentação
              </div>
              <div className="flex min-h-[200px]">
                <div className="w-2/5">
                  <img 
                    src={fotoAdvogadas} 
                    alt="Advogadas" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-3/5 p-4 bg-[#FDFBF7] flex flex-col justify-center">
                  <h3 className="text-sm font-semibold text-primary mb-1">
                    Muito prazer, somos<br />Borges & Zembruski Advocacia
                  </h3>
                  <p className="text-xs text-primary/80 italic mb-3">
                    Escuta ativa, Advocacia Artesanal
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-6">
                    {TEXTO_INSTITUCIONAL}
                  </p>
                </div>
              </div>
            </div>

            {/* Página 2 - Proposta */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 border-b">
                Página 2 - Proposta
              </div>
              <div className="p-4">
                <div className="text-center mb-4">
                  <img 
                    src={logoBZ} 
                    alt="B&Z Logo" 
                    className="h-10 mx-auto mb-3"
                  />
                  <h3 className="text-sm font-semibold text-primary border-b-2 border-primary/30 pb-2 inline-block px-4">
                    Proposta
                  </h3>
                </div>
                <p className="text-xs mb-1">
                  Prezado(a) Sr(a). <strong>{clienteNome || '[Nome do Cliente]'}</strong>,
                </p>
                {clienteCPF && (
                  <p className="text-[10px] text-muted-foreground mb-2">
                    CPF/CNPJ: {clienteCPF}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mb-2">
                  Conforme solicitado, apresentamos nossa proposta para realização dos serviços requeridos.
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {textoServico}
                </p>
              </div>
            </div>

            {/* Página 3 - Honorários */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 border-b">
                Página 3 - Honorários
              </div>
              <div className="p-4">
                <div className="text-center mb-4">
                  <img 
                    src={logoBZ} 
                    alt="B&Z Logo" 
                    className="h-10 mx-auto mb-3"
                  />
                  <h3 className="text-sm font-semibold text-primary border-b-2 border-primary/30 pb-2 inline-block px-4">
                    Honorários
                  </h3>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Pelos serviços descritos serão cobrados honorários conforme descrito abaixo:
                </p>
                <div className="border border-primary/30 rounded text-xs">
                  <div className="flex border-b border-primary/30">
                    <div className="w-1/2 p-2 bg-[#FDFBF7]">Valor da Entrada</div>
                    <div className="w-1/2 p-2 font-semibold text-primary">
                      {formatCurrency(valorEntrada || 0)}
                    </div>
                  </div>
                  {percentualExito > 0 && (
                    <div className="flex border-b border-primary/30">
                      <div className="w-1/2 p-2 bg-[#FDFBF7]">Percentual de Êxito</div>
                      <div className="w-1/2 p-2 font-semibold text-primary">
                        {percentualExito}% sobre o valor obtido
                      </div>
                    </div>
                  )}
                  {descontoAvista > 0 && (
                    <div className="flex border-b border-primary/30">
                      <div className="w-1/2 p-2 bg-[#FDFBF7]">Condição Especial</div>
                      <div className="w-1/2 p-2 font-semibold text-primary">
                        Desconto de {descontoAvista}% à vista
                      </div>
                    </div>
                  )}
                  {condicoesAdicionais && (
                    <div className="flex">
                      <div className="w-1/2 p-2 bg-[#FDFBF7]">Condições Adicionais</div>
                      <div className="w-1/2 p-2 font-semibold text-primary">
                        {condicoesAdicionais}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Página 4 - Contato */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 border-b">
                Página 4 - Contato
              </div>
              <div className="p-4 text-center">
                <img 
                  src={logoBZ} 
                  alt="B&Z Logo" 
                  className="h-12 mx-auto mb-4"
                />
                <h3 className="text-xs font-semibold text-primary mb-3">
                  Advogada(s) Contratada(s)
                </h3>
                <p className="text-xs">Eliziane Zembruski Taborda</p>
                <p className="text-[10px] text-muted-foreground mb-2">OAB/RS 115.245</p>
                <p className="text-xs">Juliana Lima Borges Gasparini</p>
                <p className="text-[10px] text-muted-foreground mb-3">OAB/RS 83.345</p>
                <div className="text-[10px] text-muted-foreground border-t border-primary/30 pt-2 mt-2">
                  Av. Ipiranga, 7464, sala 416<br />
                  Jardim Botânico - Porto Alegre/RS
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

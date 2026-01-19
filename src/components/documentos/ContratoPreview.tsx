import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import logoBZ from "@/assets/logo-bz-contrato.jpg";

interface ContratoPreviewProps {
  conteudo: string;
  titulo: string;
}

export function ContratoPreview({ conteudo, titulo }: ContratoPreviewProps) {
  const paragrafos = conteudo.split('\n\n').filter(Boolean);

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{titulo || "Preview"}</CardTitle>
            <p className="text-sm text-muted-foreground">Visualização do documento</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-8 bg-white">
            {/* Header com Logo */}
            <div className="text-center mb-8 pb-6 border-b border-primary/30">
              <img 
                src={logoBZ} 
                alt="Borges & Zembruski Advocacia" 
                className="h-24 mx-auto"
              />
            </div>

            {/* Conteúdo */}
            <div className="space-y-4 text-sm leading-relaxed text-foreground">
              {paragrafos.map((paragrafo, index) => {
                // Títulos de seções
                if (paragrafo.startsWith('CLÁUSULA') || 
                    paragrafo === 'CONTRATANTES' ||
                    paragrafo.startsWith('CONTRATO DE')) {
                  return (
                    <h2 key={index} className="font-bold text-base mt-6 mb-3">
                      {paragrafo}
                    </h2>
                  );
                }

                // Linhas de assinatura
                if (paragrafo.startsWith('_')) {
                  return (
                    <div key={index} className="mt-8 text-center">
                      <div className="border-t border-foreground/30 w-64 mx-auto pt-2">
                        {paragrafo.split('\n').map((linha, i) => (
                          <p key={i} className={i === 0 ? 'sr-only' : ''}>
                            {linha.replace(/_/g, '')}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Parágrafos normais
                return (
                  <p key={index} className="text-justify">
                    {paragrafo.split('\n').map((linha, i) => (
                      <span key={i}>
                        {linha}
                        {i < paragrafo.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
              <p>Documento gerado automaticamente pelo sistema B&Z Advocacia</p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

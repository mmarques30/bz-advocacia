import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, ExternalLink, FileCode } from "lucide-react";
import { ApiIntegration } from "@/hooks/useAutomacoes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ApiDetailsDialogProps {
  api: ApiIntegration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const edgeFunctionCodes: Record<string, string> = {
  "datajud": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

serve(async (req) => {
  const { numero_processo, tribunal } = await req.json();
  
  const apiKey = Deno.env.get("DATAJUD_API_KEY");
  
  const response = await fetch(
    \`\${DATAJUD_BASE_URL}/api_publica_\${tribunal}/_search\`,
    {
      method: "POST",
      headers: {
        "Authorization": \`APIKey \${apiKey}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          match: { numeroProcesso: numero_processo }
        }
      }),
    }
  );
  
  return new Response(JSON.stringify(await response.json()));
});`,
  "meta-ads": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const META_API_URL = "https://graph.facebook.com/v18.0";

serve(async (req) => {
  const { account_id, access_token } = await req.json();
  
  const response = await fetch(
    \`\${META_API_URL}/act_\${account_id}/campaigns\`,
    {
      headers: {
        "Authorization": \`Bearer \${access_token}\`,
      },
    }
  );
  
  return new Response(JSON.stringify(await response.json()));
});`,
  "whatsapp": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

serve(async (req) => {
  const { phone_id, to, template, api_token } = await req.json();
  
  const response = await fetch(
    \`\${WHATSAPP_API_URL}/\${phone_id}/messages\`,
    {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${api_token}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template,
      }),
    }
  );
  
  return new Response(JSON.stringify(await response.json()));
});`,
  "consultas-api": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_URL_PROD = "https://plataforma.bigdatacorp.com.br";
const API_URL_SANDBOX = "https://sandbox.bigdatacorp.com.br";

serve(async (req) => {
  const { tipo, parametro, ambiente, api_token } = await req.json();
  
  const baseUrl = ambiente === "producao" ? API_URL_PROD : API_URL_SANDBOX;
  
  const response = await fetch(
    \`\${baseUrl}/\${tipo}\`,
    {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${api_token}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parametro }),
    }
  );
  
  return new Response(JSON.stringify(await response.json()));
});`,
};

export function ApiDetailsDialog({ api, open, onOpenChange }: ApiDetailsDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!api) return null;

  const handleCopyCode = () => {
    const code = edgeFunctionCodes[api.id] || "// Código não disponível";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (api.status) {
      case "ativo":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Conectado</Badge>;
      case "pendente":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
      case "erro":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Erro</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const successRate = api.totalConsultas > 0 
    ? ((api.consultasSucesso / api.totalConsultas) * 100).toFixed(1) 
    : "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <api.icone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{api.nome}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{api.descricao}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Status
                  {getStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Configurado:</span>
                  <span>{api.configurado ? "Sim" : "Não"}</span>
                </div>
                {api.detalhes.apiKeyMasked && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Key:</span>
                    <span className="font-mono">{api.detalhes.apiKeyMasked}</span>
                  </div>
                )}
                {api.detalhes.ambiente && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ambiente:</span>
                    <Badge variant="outline" className="capitalize">{api.detalhes.ambiente}</Badge>
                  </div>
                )}
                {api.detalhes.accountName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conta:</span>
                    <span>{api.detalhes.accountName}</span>
                  </div>
                )}
                {api.detalhes.accountId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-mono text-xs">{api.detalhes.accountId}</span>
                  </div>
                )}
                {api.detalhes.rateLimit && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate Limit:</span>
                    <span>{api.detalhes.rateLimit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <a 
                    href={api.endpoint} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 text-xs"
                  >
                    {new URL(api.endpoint).hostname}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {api.ultimaAtividade && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última atividade:</span>
                    <span>
                      {formatDistanceToNow(new Date(api.ultimaAtividade), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Card */}
            {api.totalConsultas > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{api.totalConsultas}</div>
                      <div className="text-xs text-muted-foreground">Total de consultas</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">{successRate}%</div>
                      <div className="text-xs text-muted-foreground">Taxa de sucesso</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                      <div className="text-xl font-semibold text-emerald-600">{api.consultasSucesso}</div>
                      <div className="text-xs text-muted-foreground">Sucesso</div>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 rounded-lg">
                      <div className="text-xl font-semibold text-red-600">{api.consultasErro}</div>
                      <div className="text-xs text-muted-foreground">Erros</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edge Function Code Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Edge Function
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">{api.edgeFunctionPath}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyCode}
                    className="h-7 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar código
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs font-mono max-h-64 overflow-y-auto">
                  <code>{edgeFunctionCodes[api.id] || "// Código não disponível"}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

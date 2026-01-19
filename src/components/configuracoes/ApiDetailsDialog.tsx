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
import { Copy, Check, ExternalLink, FileCode, Info } from "lucide-react";
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
  "google-sheets": `// Função que recebe dados do Google Sheets via webhook
// Configurado na planilha com Google Apps Script

// Colunas suportadas:
// - "Data da entrada" -> primeiro_contato_em
// - "Nome" -> nome_completo
// - "Serviço" -> tipo_processo
// - "Tipo de inventário" -> conversa_bot_completa
// - "Tipo de atendimento" -> conversa_bot_completa
// - "Telefone" -> telefone
// - "WhatsApp" -> telefone (alternativo)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const payload = await req.json();
  
  // Detecta automaticamente o formato (Google Sheets ou Meta Ads)
  const isGoogleSheets = 'Nome' in payload || 'Telefone' in payload;
  
  if (isGoogleSheets) {
    // Processa lead do Google Sheets
    const fullName = payload['Nome'] || 'Lead sem nome';
    const phone = payload['Telefone'] || payload['WhatsApp'];
    const tipoServico = payload['Serviço'] || 'A definir';
    // ... insere no banco de dados
  }
  
  return new Response(JSON.stringify({ success: true }));
});`,
};

// Google Apps Script code for the user to configure
const googleAppsScriptCode = `// ============================================
// SCRIPT PARA GOOGLE SHEETS - IMPORTAÇÃO DE LEADS
// ============================================
// Cole este código em: Extensões → Apps Script
// ============================================

const WEBHOOK_URL = 'https://nvkxblrwblhvggndlfax.supabase.co/functions/v1/receive-sheet-lead';

// Função para enviar uma linha específica
function sendLeadToSystem(row) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Criar objeto com os dados
  const payload = {};
  headers.forEach((header, index) => {
    if (header && rowData[index] !== '') {
      payload[header] = rowData[index];
    }
  });
  
  // Verificar se tem dados válidos
  if (!payload['Nome'] && !payload['Telefone']) {
    Logger.log('Linha sem dados válidos, ignorando: ' + row);
    return;
  }
  
  // Enviar para o webhook
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Lead enviado (linha ' + row + '): ' + response.getContentText());
  } catch (error) {
    Logger.log('Erro ao enviar lead (linha ' + row + '): ' + error);
  }
}

// Trigger que roda quando uma edição acontece
function onEdit(e) {
  // Só processa se for uma nova linha com dados
  if (e.range.getRow() > 1) {
    // Aguarda um pouco para garantir que todos os dados da linha foram preenchidos
    Utilities.sleep(2000);
    sendLeadToSystem(e.range.getRow());
  }
}

// Função para configurar o trigger automático
function setupTrigger() {
  // Remove triggers antigos
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEdit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Cria novo trigger
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
    
  Logger.log('Trigger configurado com sucesso!');
}

// Função para enviar todos os leads existentes (rodar uma vez)
function sendAllExistingLeads() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  Logger.log('Iniciando sincronização de ' + (lastRow - 1) + ' leads...');
  
  for (let row = 2; row <= lastRow; row++) {
    sendLeadToSystem(row);
    Utilities.sleep(1000); // Espera 1s entre cada envio para evitar sobrecarga
  }
  
  Logger.log('Sincronização concluída!');
}

// ============================================
// INSTRUÇÕES:
// 1. Cole este código no Apps Script
// 2. Execute a função "setupTrigger" uma vez para configurar
// 3. Execute "sendAllExistingLeads" para importar leads existentes
// 4. Novos leads serão enviados automaticamente
// ============================================`;

export function ApiDetailsDialog({ api, open, onOpenChange }: ApiDetailsDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!api) return null;

  const handleCopyCode = () => {
    const code = edgeFunctionCodes[api.id] || "// Código não disponível";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
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

  const isGoogleSheets = api.id === "google-sheets";

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
                {api.detalhes.webhookUrl && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Webhook URL:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs break-all max-w-[200px] text-right">
                        {api.detalhes.webhookUrl}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(api.detalhes.webhookUrl || '');
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {api.detalhes.leadsImportados !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leads importados:</span>
                    <span className="font-semibold">{api.detalhes.leadsImportados}</span>
                  </div>
                )}
                {api.detalhes.leadsUltimas24h !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Últimas 24h:</span>
                    <span className="text-emerald-600 font-semibold">+{api.detalhes.leadsUltimas24h}</span>
                  </div>
                )}
                {api.endpoint && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Endpoint:</span>
                    <a 
                      href={api.endpoint} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-xs"
                    >
                      {(() => {
                        try {
                          return new URL(api.endpoint).hostname;
                        } catch {
                          return api.endpoint;
                        }
                      })()}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
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

            {/* Google Sheets Configuration Instructions */}
            {isGoogleSheets && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Como Configurar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Abra sua planilha do Google Sheets</li>
                    <li>Vá em <strong>Extensões → Apps Script</strong></li>
                    <li>Cole o código abaixo e salve</li>
                    <li>Execute a função <code className="bg-muted px-1 rounded">setupTrigger</code> uma vez</li>
                    <li>Execute <code className="bg-muted px-1 rounded">sendAllExistingLeads</code> para importar leads existentes</li>
                  </ol>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyAppsScript}
                    className="w-full"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="h-3 w-3 mr-2" />
                        Script copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-2" />
                        Copiar Script do Google Apps
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

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
                      <div className="text-xs text-muted-foreground">
                        {isGoogleSheets ? "Leads importados" : "Total de consultas"}
                      </div>
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

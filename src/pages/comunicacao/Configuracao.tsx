import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useWhatsAppConfig, useCreateOrUpdateWhatsAppConfig, useTestWhatsAppConnection } from "@/hooks/useWhatsAppConfig";
import { WhatsAppProvider } from "@/types/whatsapp";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ConfiguracaoWhatsApp() {
  const { data: config, isLoading } = useWhatsAppConfig();
  const updateConfig = useCreateOrUpdateWhatsAppConfig();
  const testConnection = useTestWhatsAppConnection();

  const [provider, setProvider] = useState<WhatsAppProvider>(config?.provider || 'meta');
  const [phoneNumber, setPhoneNumber] = useState(config?.phone_number || '');
  const [phoneNumberId, setPhoneNumberId] = useState(config?.phone_number_id || '');
  const [accessToken, setAccessToken] = useState('');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    const credentials: any = {};
    
    if (provider === 'meta') {
      credentials.accessToken = accessToken;
    } else if (provider === 'twilio') {
      credentials.accountSid = accountSid;
      credentials.authToken = authToken;
    } else if (provider === 'zenvia') {
      credentials.apiKey = apiKey;
    }

    updateConfig.mutate({
      provider,
      phone_number: phoneNumber,
      phone_number_id: phoneNumberId,
      credentials,
      active: true,
    });
  };

  const handleTest = () => {
    testConnection.mutate({
      provider,
      phone_number: phoneNumber,
      phone_number_id: phoneNumberId,
      credentials: {
        accessToken,
        accountSid,
        authToken,
        apiKey,
      },
    } as any);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuração WhatsApp Business API</h1>
        <p className="text-muted-foreground">
          Configure a conexão com seu provedor WhatsApp Business
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>
                Configure e teste sua conexão com WhatsApp
              </CardDescription>
            </div>
            {config?.active ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Ativo
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Não configurado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Provedor *</Label>
              <RadioGroup
                value={provider}
                onValueChange={(value) => setProvider(value as WhatsAppProvider)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="meta" id="meta" />
                  <Label htmlFor="meta" className="cursor-pointer">Meta Cloud API (Recomendado)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="twilio" id="twilio" />
                  <Label htmlFor="twilio" className="cursor-pointer">Twilio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zenvia" id="zenvia" />
                  <Label htmlFor="zenvia" className="cursor-pointer">Zenvia</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Número WhatsApp Business *</Label>
              <Input
                id="phoneNumber"
                placeholder="+55 (11) 98765-4321"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <Separator />

            {provider === 'meta' && (
              <>
                <div>
                  <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="123456789012345"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="accessToken">Access Token *</Label>
                  <div className="relative">
                    <Input
                      id="accessToken"
                      type={showAccessToken ? "text" : "password"}
                      placeholder="EAAxxxxxxxxxx..."
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                    >
                      {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {provider === 'twilio' && (
              <>
                <div>
                  <Label htmlFor="accountSid">Account SID *</Label>
                  <Input
                    id="accountSid"
                    placeholder="ACxxxxxxxxxx..."
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="authToken">Auth Token *</Label>
                  <div className="relative">
                    <Input
                      id="authToken"
                      type={showAuthToken ? "text" : "password"}
                      placeholder="xxxxxxxxxx..."
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAuthToken(!showAuthToken)}
                    >
                      {showAuthToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {provider === 'zenvia' && (
              <div>
                <Label htmlFor="apiKey">API Key *</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="xxxxxxxxxx..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTest} variant="outline" disabled={testConnection.isPending}>
              {testConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Conexão
            </Button>
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Configurar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {provider === 'meta' && (
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Meta Cloud API (Gratuito - Recomendado):</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Acesse: <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">developers.facebook.com</a></li>
                <li>Crie um app "Business"</li>
                <li>Adicione produto "WhatsApp"</li>
                <li>Obtenha número de teste ou conecte número business</li>
                <li>Copie Phone Number ID e Access Token</li>
                <li>Cole acima e salve</li>
              </ol>
            </div>
          )}

          {provider === 'twilio' && (
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Twilio (Pago):</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Acesse: <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">twilio.com</a></li>
                <li>Crie conta e configure WhatsApp</li>
                <li>Obtenha Account SID e Auth Token</li>
                <li>Cole acima e salve</li>
              </ol>
            </div>
          )}

          {provider === 'zenvia' && (
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Zenvia (Pago):</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Acesse: <a href="https://www.zenvia.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">zenvia.com</a></li>
                <li>Crie conta e configure WhatsApp</li>
                <li>Obtenha API Key</li>
                <li>Cole acima e salve</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

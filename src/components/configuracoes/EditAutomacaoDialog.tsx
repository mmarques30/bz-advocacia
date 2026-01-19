import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiIntegration } from "@/hooks/useAutomacoes";
import { Pencil } from "lucide-react";

interface EditAutomacaoDialogProps {
  api: ApiIntegration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
}

export function EditAutomacaoDialog({
  api,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: EditAutomacaoDialogProps) {
  // Meta Ads state
  const [metaStatus, setMetaStatus] = useState<string>("ativo");

  // WhatsApp state
  const [whatsappProvider, setWhatsappProvider] = useState<string>("evolution");
  const [whatsappPhone, setWhatsappPhone] = useState<string>("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState<string>("");
  const [whatsappToken, setWhatsappToken] = useState<string>("");
  const [whatsappAtivo, setWhatsappAtivo] = useState<boolean>(true);

  // API Consultas state
  const [consultasProvedor, setConsultasProvedor] = useState<string>("bigdatacorp");
  const [consultasToken, setConsultasToken] = useState<string>("");
  const [consultasAmbiente, setConsultasAmbiente] = useState<string>("sandbox");
  const [consultasCreditos, setConsultasCreditos] = useState<number>(0);
  const [consultasAtivo, setConsultasAtivo] = useState<boolean>(true);

  // Populate form when api changes
  useEffect(() => {
    if (api && api.detalhes) {
      if (api.tabelaOrigem === "meta_connections") {
        setMetaStatus(api.status);
      } else if (api.tabelaOrigem === "whatsapp_config") {
        setWhatsappProvider(api.detalhes.provedor || "evolution");
        setWhatsappPhone(api.detalhes.telefone || "");
        setWhatsappPhoneId(api.detalhes.phoneNumberId || "");
        setWhatsappToken(""); // Never show existing token
        setWhatsappAtivo(api.status === "ativo");
      } else if (api.tabelaOrigem === "consultas_config") {
        setConsultasProvedor(api.detalhes.provedor || "bigdatacorp");
        setConsultasToken(""); // Never show existing token
        setConsultasAmbiente(api.detalhes.ambiente || "sandbox");
        setConsultasCreditos(api.detalhes.creditos || 0);
        setConsultasAtivo(api.status === "ativo");
      }
    }
  }, [api]);

  if (!api) return null;

  const handleSave = () => {
    let data: Record<string, unknown> = {};

    if (api.tabelaOrigem === "meta_connections") {
      data = { status: metaStatus };
    } else if (api.tabelaOrigem === "whatsapp_config") {
      data = {
        provedor: whatsappProvider,
        phone_number: whatsappPhone,
        phone_number_id: whatsappPhoneId,
        ativo: whatsappAtivo,
        ...(whatsappToken && { access_token: whatsappToken }),
      };
    } else if (api.tabelaOrigem === "consultas_config") {
      data = {
        provedor: consultasProvedor,
        ambiente: consultasAmbiente,
        creditos_disponiveis: consultasCreditos,
        ativo: consultasAtivo,
        ...(consultasToken && { api_token: consultasToken }),
      };
    }

    onSave(data);
  };

  const renderFormFields = () => {
    switch (api.tabelaOrigem) {
      case "meta_connections":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Account ID</Label>
              <Input value={api.detalhes?.accountId || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input value={api.detalhes?.accountName || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={metaStatus} onValueChange={setMetaStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Para reconectar a conta do Meta Ads, acesse a página de Meta Ads e clique em "Conectar".
            </p>
          </div>
        );

      case "whatsapp_config":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select value={whatsappProvider} onValueChange={setWhatsappProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evolution">Evolution API</SelectItem>
                  <SelectItem value="z-api">Z-API</SelectItem>
                  <SelectItem value="oficial">WhatsApp Business API (Oficial)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número do Telefone</Label>
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+55 11 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                placeholder="ID do número na API"
              />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input
                type="password"
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
                placeholder="Deixe em branco para manter o atual"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Integração Ativa</Label>
              <Switch checked={whatsappAtivo} onCheckedChange={setWhatsappAtivo} />
            </div>
          </div>
        );

      case "consultas_config":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select value={consultasProvedor} onValueChange={setConsultasProvedor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bigdatacorp">BigDataCorp</SelectItem>
                  <SelectItem value="serpro">Serpro</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                type="password"
                value={consultasToken}
                onChange={(e) => setConsultasToken(e.target.value)}
                placeholder="Deixe em branco para manter o atual"
              />
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={consultasAmbiente} onValueChange={setConsultasAmbiente}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Créditos Disponíveis</Label>
              <Input
                type="number"
                value={consultasCreditos}
                onChange={(e) => setConsultasCreditos(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Integração Ativa</Label>
              <Switch checked={consultasAtivo} onCheckedChange={setConsultasAtivo} />
            </div>
          </div>
        );

      default:
        return (
          <p className="text-muted-foreground">
            Esta integração não pode ser editada.
          </p>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Editar {api.nome}</DialogTitle>
              <DialogDescription>
                Atualize as configurações da integração
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">{renderFormFields()}</div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !api.podeEditar}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

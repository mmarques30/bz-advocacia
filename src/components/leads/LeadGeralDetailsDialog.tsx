import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Save, Facebook, Instagram, Globe, Calendar, Phone, User, Briefcase } from "lucide-react";
import type { LeadGeral } from "@/hooks/useLeadsGeral";

interface Props {
  open: boolean;
  onClose: () => void;
  lead: LeadGeral | null;
  onSaveObservacoes?: (id: string, obs: string) => void;
}

function formatDate(raw: string | null) {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

function PlatformBadge({ platform, isOrganic }: { platform: string | null; isOrganic: boolean | null }) {
  if (isOrganic) return <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3" />Orgânico</Badge>;
  if (platform === "fb") return <Badge variant="outline" className="gap-1 text-blue-700 border-blue-200 bg-blue-50"><Facebook className="h-3 w-3" />Facebook</Badge>;
  if (platform === "ig") return <Badge variant="outline" className="gap-1 text-pink-700 border-pink-200 bg-pink-50"><Instagram className="h-3 w-3" />Instagram</Badge>;
  return <Badge variant="outline">{platform || "Desconhecido"}</Badge>;
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status || "").toUpperCase();
  if (s === "ENVIADO") return <Badge className="bg-green-100 text-green-800 border-green-200">Enviado</Badge>;
  if (s === "CREATED") return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Criado</Badge>;
  if (s === "QUALIFICADO") return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Qualificado</Badge>;
  if (s === "CONVERTIDO") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Convertido</Badge>;
  return <Badge variant="outline">{status || "Sem status"}</Badge>;
}

function openWhatsApp(phone: string) {
  const clean = phone.replace(/\D/g, "");
  window.open(`https://wa.me/${clean}`, "_blank");
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "-"}</p>
      </div>
    </div>
  );
}

export function LeadGeralDetailsDialog({ open, onClose, lead, onSaveObservacoes }: Props) {
  const [obs, setObs] = useState(lead?.observacoes || "");
  const [dirty, setDirty] = useState(false);

  // Reset when lead changes
  if (lead && obs !== (lead.observacoes || "") && !dirty) {
    setObs(lead.observacoes || "");
  }

  if (!lead) return null;

  const handleSave = () => {
    onSaveObservacoes?.(lead.id, obs);
    setDirty(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {lead.full_name || "Sem nome"}
          </DialogTitle>
          <DialogDescription>
            Lead recebido em {formatDate(lead.created_time)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Plataforma */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={lead.lead_status} />
            <PlatformBadge platform={lead.platform} isOrganic={lead.is_organic} />
            {lead.is_qualified && <Badge variant="outline" className="bg-purple-50 text-purple-700">Qualificado</Badge>}
            {lead.is_converted && <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Convertido</Badge>}
          </div>

          {/* Informações de Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 border rounded-lg p-4">
            <h3 className="col-span-full text-sm font-semibold text-muted-foreground mb-2">Contato</h3>
            <InfoRow icon={Phone} label="Telefone" value={lead.phone_number?.replace("p:", "")} />
            <InfoRow icon={MessageCircle} label="WhatsApp" value={lead.contato_whatsapp || lead.phone_number?.replace("p:", "")} />
            <InfoRow icon={Briefcase} label="Tipo de Serviço" value={lead.tipo_servico?.replace(/_/g, " ")} />
            <InfoRow icon={User} label="Preferência de Contato" value={lead.preferencia_contato} />
          </div>

          {/* Meta Ads */}
          {(lead.campaign_name || lead.ad_name || lead.form_name) && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Meta Ads</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow icon={Briefcase} label="Campanha" value={lead.campaign_name} />
                <InfoRow icon={Briefcase} label="Conjunto de Anúncios" value={lead.adset_name} />
                <InfoRow icon={Briefcase} label="Anúncio" value={lead.ad_name} />
                <InfoRow icon={Briefcase} label="Formulário" value={lead.form_name} />
              </div>
            </div>
          )}

          {/* Bem a inventariar */}
          {lead.bem_inventariar && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Detalhes</h3>
              <InfoRow icon={Briefcase} label="Bem a Inventariar" value={lead.bem_inventariar} />
            </div>
          )}

          {/* Datas */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Criado: {formatDate(lead.created_time)}</span>
            {lead.updated_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Atualizado: {formatDate(lead.updated_at)}</span>}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Observações</h3>
            <Textarea
              value={obs}
              onChange={(e) => { setObs(e.target.value); setDirty(true); }}
              placeholder="Adicione observações sobre este lead..."
              rows={3}
            />
            {dirty && (
              <Button size="sm" onClick={handleSave} className="gap-1">
                <Save className="h-3 w-3" /> Salvar
              </Button>
            )}
          </div>

          {/* Ações */}
          {lead.phone_number && (
            <Button
              variant="outline"
              className="w-full gap-2 text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => openWhatsApp(lead.phone_number!)}
            >
              <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

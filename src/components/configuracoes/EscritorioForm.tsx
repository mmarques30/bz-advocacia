import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import InputMask from "react-input-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Image, Share2, Settings, Loader2 } from "lucide-react";
import { useConfiguracoesEscritorio, ConfiguracoesEscritorio } from "@/hooks/useConfiguracoesEscritorio";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const configSchema = z.object({
  nome_escritorio: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cnpj: z.string().optional(),
  oab_principal: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  site: z.string().url("URL inválida").optional().or(z.literal("")),
  cep: z.string().optional(),
  endereco_completo: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  whatsapp: z.string().optional(),
  youtube: z.string().optional(),
  tema: z.string().optional(),
  fuso_horario: z.string().optional(),
  formato_data: z.string().optional(),
  moeda: z.string().optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function EscritorioForm() {
  const { configuracoes, updateConfiguracoesEscritorio, isUpdating, uploadLogo, isUploadingLogo } = useConfiguracoesEscritorio();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      nome_escritorio: "",
      cnpj: "",
      oab_principal: "",
      email: "",
      telefone: "",
      site: "",
      cep: "",
      endereco_completo: "",
      cidade: "",
      estado: "",
      instagram: "",
      facebook: "",
      linkedin: "",
      whatsapp: "",
      youtube: "",
      tema: "system",
      fuso_horario: "America/Sao_Paulo",
      formato_data: "DD/MM/YYYY",
      moeda: "BRL",
    },
  });

  useEffect(() => {
    if (configuracoes) {
      form.reset({
        nome_escritorio: configuracoes.nome_escritorio || "",
        cnpj: configuracoes.cnpj || "",
        oab_principal: configuracoes.oab_principal || "",
        email: configuracoes.email || "",
        telefone: configuracoes.telefone || "",
        site: configuracoes.site || "",
        cep: configuracoes.cep || "",
        endereco_completo: configuracoes.endereco_completo || "",
        cidade: configuracoes.cidade || "",
        estado: configuracoes.estado || "",
        instagram: configuracoes.redes_sociais?.instagram || "",
        facebook: configuracoes.redes_sociais?.facebook || "",
        linkedin: configuracoes.redes_sociais?.linkedin || "",
        whatsapp: configuracoes.redes_sociais?.whatsapp || "",
        youtube: configuracoes.redes_sociais?.youtube || "",
        tema: configuracoes.preferencias?.tema || "system",
        fuso_horario: configuracoes.preferencias?.fuso_horario || "America/Sao_Paulo",
        formato_data: configuracoes.preferencias?.formato_data || "DD/MM/YYYY",
        moeda: configuracoes.preferencias?.moeda || "BRL",
      });
      setLogoPreview(configuracoes.logo_url || null);
    }
  }, [configuracoes, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou SVG.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      form.setValue("endereco_completo", data.logradouro);
      form.setValue("cidade", data.localidade);
      form.setValue("estado", data.uf);
      toast.success("Endereço encontrado!");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const onSubmit = async (values: ConfigFormData) => {
    let logo_url = configuracoes?.logo_url;

    if (logoFile) {
      try {
        logo_url = await uploadLogo(logoFile);
      } catch (error) {
        return;
      }
    }

    const payload: Partial<ConfiguracoesEscritorio> = {
      nome_escritorio: values.nome_escritorio,
      cnpj: values.cnpj,
      oab_principal: values.oab_principal,
      email: values.email,
      telefone: values.telefone,
      site: values.site,
      cep: values.cep,
      endereco_completo: values.endereco_completo,
      cidade: values.cidade,
      estado: values.estado,
      logo_url,
      redes_sociais: {
        instagram: values.instagram,
        facebook: values.facebook,
        linkedin: values.linkedin,
        whatsapp: values.whatsapp,
        youtube: values.youtube,
      },
      preferencias: {
        tema: values.tema,
        fuso_horario: values.fuso_horario,
        formato_data: values.formato_data,
        moeda: values.moeda,
      },
    };

    updateConfiguracoesEscritorio(payload);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados Básicos
          </CardTitle>
          <CardDescription>Informações principais do escritório</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_escritorio">Nome do Escritório *</Label>
              <Input
                id="nome_escritorio"
                {...form.register("nome_escritorio")}
                placeholder="Nome do escritório"
              />
              {form.formState.errors.nome_escritorio && (
                <p className="text-sm text-destructive">{form.formState.errors.nome_escritorio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <InputMask
                mask="99.999.999/9999-99"
                value={form.watch("cnpj")}
                onChange={(e) => form.setValue("cnpj", e.target.value)}
              >
                {/* @ts-ignore */}
                {(inputProps) => <Input {...inputProps} id="cnpj" placeholder="00.000.000/0000-00" />}
              </InputMask>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oab_principal">OAB Principal</Label>
              <Input
                id="oab_principal"
                {...form.register("oab_principal")}
                placeholder="OAB/UF 000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="contato@escritorio.com.br"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={form.watch("telefone")}
                onChange={(e) => form.setValue("telefone", e.target.value)}
              >
                {/* @ts-ignore */}
                {(inputProps) => <Input {...inputProps} id="telefone" placeholder="(00) 00000-0000" />}
              </InputMask>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                {...form.register("site")}
                placeholder="https://www.escritorio.com.br"
              />
              {form.formState.errors.site && (
                <p className="text-sm text-destructive">{form.formState.errors.site.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
          <CardDescription>Localização do escritório</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <InputMask
                mask="99999-999"
                value={form.watch("cep")}
                onChange={(e) => form.setValue("cep", e.target.value)}
                onBlur={(e) => fetchAddressByCEP(e.target.value)}
              >
                {/* @ts-ignore */}
                {(inputProps) => (
                  <Input
                    {...inputProps}
                    id="cep"
                    placeholder="00000-000"
                    disabled={loadingCep}
                  />
                )}
              </InputMask>
              {loadingCep && <p className="text-sm text-muted-foreground">Buscando...</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco_completo">Endereço Completo</Label>
              <Input
                id="endereco_completo"
                {...form.register("endereco_completo")}
                placeholder="Rua, Número, Complemento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                {...form.register("cidade")}
                placeholder="São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={form.watch("estado")}
                onValueChange={(value) => form.setValue("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>Logo do escritório (PNG, JPG ou SVG - Máx. 2MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logoPreview && (
              <div className="h-24 w-24 border rounded-lg overflow-hidden bg-muted">
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
              </div>
            )}
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleLogoChange}
              disabled={isUploadingLogo}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Redes Sociais
          </CardTitle>
          <CardDescription>Links das redes sociais do escritório</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                {...form.register("instagram")}
                placeholder="https://instagram.com/escritorio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                {...form.register("facebook")}
                placeholder="https://facebook.com/escritorio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                {...form.register("linkedin")}
                placeholder="https://linkedin.com/company/escritorio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                {...form.register("whatsapp")}
                placeholder="https://wa.me/5511999999999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                {...form.register("youtube")}
                placeholder="https://youtube.com/@escritorio"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferências
          </CardTitle>
          <CardDescription>Configurações de personalização do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tema">Tema</Label>
              <Select
                value={form.watch("tema")}
                onValueChange={(value) => form.setValue("tema", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuso_horario">Fuso Horário</Label>
              <Select
                value={form.watch("fuso_horario")}
                onValueChange={(value) => form.setValue("fuso_horario", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                  <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formato_data">Formato de Data</Label>
              <Select
                value={form.watch("formato_data")}
                onValueChange={(value) => form.setValue("formato_data", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                  <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda</Label>
              <Select
                value={form.watch("moeda")}
                onValueChange={(value) => form.setValue("moeda", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isUpdating || isUploadingLogo}
          className="min-w-32"
        >
          {isUpdating || isUploadingLogo ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isUpdating || isUploadingLogo}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

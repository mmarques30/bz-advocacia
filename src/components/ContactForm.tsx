import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import InputMask from "react-input-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2, MessageCircle } from "lucide-react";

const formSchema = z.object({
  nome_completo: z.string().trim().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  telefone: z.string().trim().min(14, "Telefone inválido"),
  tipo_processo: z.enum(["divorcio", "inventario", "pensao_alimenticia", "outro"], {
    required_error: "Selecione o tipo de processo",
  }),
  como_conheceu: z.enum(["google", "instagram", "facebook", "indicacao", "outro"], {
    required_error: "Selecione como nos conheceu",
  }),
  mensagem: z.string().trim().min(10, "Mensagem muito curta").max(2000, "Mensagem muito longa"),
  
  // Campos condicionais - Divórcio
  regime_casamento: z.string().optional(),
  tem_filhos: z.boolean().optional(),
  bens_partilhar: z.string().optional(),
  
  // Campos condicionais - Inventário
  valor_estimado_bens: z.string().optional(),
  numero_herdeiros: z.number().optional(),
  
  // Campos condicionais - Pensão Alimentícia
  situacao_atual: z.string().optional(),
  valor_pretendido: z.string().optional(),
  
  // Campos condicionais - Outro
  outro_tipo_processo: z.string().optional(),
  outro_como_conheceu: z.string().optional(),
  
  lgpd_consent: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos LGPD",
  }),
}).refine((data) => {
  if (data.tipo_processo === "outro" && !data.outro_tipo_processo?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Especifique o tipo de processo",
  path: ["outro_tipo_processo"],
}).refine((data) => {
  if (data.como_conheceu === "outro" && !data.outro_como_conheceu?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Especifique como nos conheceu",
  path: ["outro_como_conheceu"],
});

type FormData = z.infer<typeof formSchema>;

interface ContactFormProps {
  onSuccess: () => void;
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const tipoProcesso = watch("tipo_processo");
  const comoConheceu = watch("como_conheceu");
  const telefone = watch("telefone");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedPaths: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('contact-documents')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Erro ao enviar arquivo: ${file.name}`);
      }

      uploadedPaths.push(filePath);
    }

    return uploadedPaths;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Upload files first
      const documentos = files.length > 0 ? await uploadFiles() : [];

      // Prepare submission data
      const submissionData = {
        nome_completo: data.nome_completo,
        email: data.email,
        telefone: data.telefone,
        tipo_processo: data.tipo_processo,
        como_conheceu: data.como_conheceu,
        mensagem: data.mensagem,
        regime_casamento: data.regime_casamento || null,
        tem_filhos: data.tem_filhos || null,
        bens_partilhar: data.bens_partilhar || null,
        valor_estimado_bens: data.valor_estimado_bens || null,
        numero_herdeiros: data.numero_herdeiros || null,
        situacao_atual: data.situacao_atual || null,
        valor_pretendido: data.valor_pretendido || null,
        outro_tipo_processo: data.outro_tipo_processo || null,
        outro_como_conheceu: data.outro_como_conheceu || null,
        documentos,
        lgpd_consent: data.lgpd_consent,
      };

      const { error } = await supabase
        .from('contact_submissions')
        .insert([submissionData]);

      if (error) throw error;

      toast.success("Formulário enviado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nome_completo" className="text-card-foreground/90">
            Nome Completo *
          </Label>
          <Input
            id="nome_completo"
            {...register("nome_completo")}
            className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
            placeholder="Seu nome completo"
          />
          {errors.nome_completo && (
            <p className="text-destructive text-sm mt-1">{errors.nome_completo.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-card-foreground/90">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="telefone" className="text-card-foreground/90">
            Telefone *
          </Label>
          <InputMask
            mask="(99) 99999-9999"
            value={telefone || ""}
            onChange={(e) => setValue("telefone", e.target.value)}
          >
            {(inputProps: any) => (
              <Input
                {...inputProps}
                id="telefone"
                className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
                placeholder="(00) 00000-0000"
              />
            )}
          </InputMask>
          {errors.telefone && (
            <p className="text-destructive text-sm mt-1">{errors.telefone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tipo_processo" className="text-card-foreground/90">
            Tipo de Processo *
          </Label>
          <Select onValueChange={(value) => setValue("tipo_processo", value as any)}>
            <SelectTrigger className="mt-1.5 bg-card/50 backdrop-blur-sm border-border">
              <SelectValue placeholder="Selecione o tipo de processo" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="divorcio">Divórcio</SelectItem>
              <SelectItem value="inventario">Inventário</SelectItem>
              <SelectItem value="pensao_alimenticia">Pensão Alimentícia</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipo_processo && (
            <p className="text-destructive text-sm mt-1">{errors.tipo_processo.message}</p>
          )}
        </div>

        {/* Conditional Field - Outro Tipo de Processo */}
        {tipoProcesso === "outro" && (
          <div>
            <Label htmlFor="outro_tipo_processo" className="text-card-foreground/90">
              Especifique o tipo de processo *
            </Label>
            <Input
              id="outro_tipo_processo"
              {...register("outro_tipo_processo")}
              className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
              placeholder="Descreva o tipo de processo que deseja consultar"
            />
            {errors.outro_tipo_processo && (
              <p className="text-destructive text-sm mt-1">{errors.outro_tipo_processo.message}</p>
            )}
          </div>
        )}

        {/* Conditional Fields - Divórcio */}
        {tipoProcesso === "divorcio" && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="font-medium text-card-foreground">Informações sobre o Divórcio</h3>
            
            <div>
              <Label htmlFor="regime_casamento" className="text-card-foreground/90">
                Regime de Casamento
              </Label>
              <Input
                id="regime_casamento"
                {...register("regime_casamento")}
                className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
                placeholder="Ex: Comunhão parcial de bens"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tem_filhos"
                onCheckedChange={(checked) => setValue("tem_filhos", checked as boolean)}
              />
              <Label htmlFor="tem_filhos" className="text-card-foreground/90">
                Tem filhos?
              </Label>
            </div>

            <div>
              <Label htmlFor="bens_partilhar" className="text-card-foreground/90">
                Bens a Partilhar
              </Label>
              <Textarea
                id="bens_partilhar"
                {...register("bens_partilhar")}
                className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
                placeholder="Descreva os bens a serem partilhados"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Conditional Fields - Inventário */}
        {tipoProcesso === "inventario" && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="font-medium text-card-foreground">Informações sobre o Inventário</h3>
            
            <div>
              <Label htmlFor="valor_estimado_bens" className="text-card-foreground/90">
                Valor Estimado dos Bens
              </Label>
              <Input
                id="valor_estimado_bens"
                {...register("valor_estimado_bens")}
                className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
                placeholder="Ex: R$ 500.000,00"
              />
            </div>

            <div>
              <Label htmlFor="numero_herdeiros" className="text-card-foreground/90">
                Número de Herdeiros
              </Label>
              <Input
                id="numero_herdeiros"
                type="number"
                {...register("numero_herdeiros", { valueAsNumber: true })}
                className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
                placeholder="Ex: 3"
              />
            </div>
          </div>
        )}

        {/* Conditional Fields - Pensão Alimentícia */}
        {tipoProcesso === "pensao_alimenticia" && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="font-medium text-card-foreground">Informações sobre Pensão Alimentícia</h3>
            
            <div>
              <Label htmlFor="situacao_atual" className="text-card-foreground/90">
                Situação Atual
              </Label>
              <Textarea
                id="situacao_atual"
                {...register("situacao_atual")}
                className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
                placeholder="Descreva a situação atual"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="valor_pretendido" className="text-card-foreground/90">
                Valor Pretendido
              </Label>
              <Input
                id="valor_pretendido"
                {...register("valor_pretendido")}
                className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
                placeholder="Ex: R$ 2.000,00/mês"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="como_conheceu" className="text-card-foreground/90">
            Como nos conheceu? *
          </Label>
          <Select onValueChange={(value) => setValue("como_conheceu", value as any)}>
            <SelectTrigger className="mt-1.5 bg-card/50 backdrop-blur-sm border-border">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.como_conheceu && (
            <p className="text-destructive text-sm mt-1">{errors.como_conheceu.message}</p>
          )}
        </div>

        {/* Conditional Field - Outro Como Conheceu */}
        {comoConheceu === "outro" && (
          <div>
            <Label htmlFor="outro_como_conheceu" className="text-card-foreground/90">
              Especifique como nos conheceu *
            </Label>
            <Input
              id="outro_como_conheceu"
              {...register("outro_como_conheceu")}
              className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
              placeholder="Descreva como conheceu nosso escritório"
            />
            {errors.outro_como_conheceu && (
              <p className="text-destructive text-sm mt-1">{errors.outro_como_conheceu.message}</p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="mensagem" className="text-card-foreground/90">
            Mensagem / Dúvida *
          </Label>
          <Textarea
            id="mensagem"
            {...register("mensagem")}
            className="mt-1.5 bg-card/50 backdrop-blur-sm border-border"
            placeholder="Conte-nos sobre sua situação e como podemos ajudar..."
            rows={5}
          />
          {errors.mensagem && (
            <p className="text-destructive text-sm mt-1">{errors.mensagem.message}</p>
          )}
        </div>

        <div>
          <Label className="text-card-foreground/90">Upload de Documentos</Label>
          <div className="mt-1.5">
            <label className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-lg cursor-pointer bg-card/50 backdrop-blur-sm border-border hover:border-primary">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para fazer upload (RG, CPF, outros)
                </span>
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>
          
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border"
                >
                  <span className="text-sm text-card-foreground truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start space-x-2 p-4 rounded-lg bg-muted/30 border border-border">
          <Checkbox
            id="lgpd_consent"
            onCheckedChange={(checked) => setValue("lgpd_consent", checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="lgpd_consent"
              className="text-sm text-card-foreground/90 cursor-pointer"
            >
              Autorizo o tratamento dos meus dados pessoais *
            </Label>
            <p className="text-xs text-muted-foreground">
              Concordo que meus dados sejam utilizados para análise do caso e contato do escritório,
              conforme a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
            </p>
          </div>
        </div>
        {errors.lgpd_consent && (
          <p className="text-destructive text-sm">{errors.lgpd_consent.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Contato"
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full font-medium py-6 text-lg"
          onClick={() => window.open('https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20a%20B%26Z%20Advocacia.', '_blank')}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Falar com a B&Z
        </Button>
      </div>
    </form>
  );
}

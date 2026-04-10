import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, ORIGEM_LABELS, TIPO_PROCESSO_OPTIONS, LEAD_STATUS_LABELS } from "@/types/leads";
import { useCreateLead, useUpdateLead } from "@/hooks/useLeads";
import { useEffect } from "react";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";

const leadFormSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().optional(),
  data_nascimento: z.string().optional(),
  tipo_processo: z.string().optional(),
  origem: z.string().optional(),
  origem_descricao: z.string().optional(),
  estagio: z.string().optional(),
  mensagem: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface NewLeadDialogProps {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
  isCliente?: boolean;
}

export function NewLeadDialog({ open, onClose, lead, isCliente = false }: NewLeadDialogProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const isEditing = !!lead;
  const { data: origensDb } = useOpcoesSistema('origem_lead', true);
  const { data: tiposProcessoDb } = useOpcoesSistema('tipo_processo', true);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      cpf: "",
      data_nascimento: "",
      tipo_processo: "",
      origem: "site",
      origem_descricao: "",
      estagio: isCliente ? "fechado" : "novo",
      mensagem: "",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        nome_completo: lead.nome_completo,
        email: lead.email,
        telefone: lead.telefone,
        cpf: lead.cpf || "",
        data_nascimento: lead.data_nascimento || "",
        tipo_processo: lead.tipo_processo,
        origem: lead.origem,
        origem_descricao: lead.origem_descricao || "",
        estagio: lead.estagio,
        mensagem: lead.mensagem,
      });
    } else {
      form.reset({
        nome_completo: "",
        email: "",
        telefone: "",
        cpf: "",
        data_nascimento: "",
        tipo_processo: "",
        origem: "site",
        origem_descricao: "",
        estagio: isCliente ? "fechado" : "novo",
        mensagem: "",
      });
    }
  }, [lead, form, isCliente]);

  const onSubmit = async (values: LeadFormValues) => {
    try {
      if (isEditing && lead) {
        await updateLead.mutateAsync({
          id: lead.id,
          nome_completo: values.nome_completo,
          email: values.email,
          telefone: values.telefone,
          cpf: values.cpf || null,
          data_nascimento: values.data_nascimento || null,
          tipo_processo: values.tipo_processo,
          origem: values.origem as any,
          outro_como_conheceu: values.origem_descricao || null,
          estagio: values.estagio as any,
          mensagem: values.mensagem,
          como_conheceu: values.origem,
        });
      } else {
        await createLead.mutateAsync({
          nome_completo: values.nome_completo,
          email: values.email,
          telefone: values.telefone,
          cpf: values.cpf || null,
          data_nascimento: values.data_nascimento || null,
          tipo_processo: values.tipo_processo,
          origem: values.origem as any,
          outro_como_conheceu: values.origem_descricao || null,
          estagio: values.estagio as any,
          mensagem: values.mensagem,
          como_conheceu: values.origem,
        });
      }
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error saving lead:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? (isCliente ? "Editar Cliente" : "Editar Lead")
              : (isCliente ? "Novo Cliente" : "Novo Lead")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? (isCliente ? "Atualize as informações do cliente" : "Atualize as informações do lead")
              : (isCliente ? "Cadastre um novo cliente" : "Cadastre um novo lead manualmente")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_processo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Processo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(tiposProcessoDb && tiposProcessoDb.length > 0
                          ? tiposProcessoDb.map(o => o.label)
                          : TIPO_PROCESSO_OPTIONS
                        ).map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(origensDb && origensDb.length > 0
                          ? origensDb.map(o => ({ key: o.valor, label: o.label }))
                          : Object.entries(ORIGEM_LABELS).map(([key, label]) => ({ key, label }))
                        ).map(({ key, label }) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origem_descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Origem</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Parceiro João, Campanha Verão 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isCliente && (
                <FormField
                  control={form.control}
                  name="estagio"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Estágio Inicial *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="mensagem"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Mensagem/Observações *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes do caso ou observações iniciais"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLead.isPending || updateLead.isPending}>
                {isEditing ? "Atualizar" : (isCliente ? "Salvar Cliente" : "Salvar Lead")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

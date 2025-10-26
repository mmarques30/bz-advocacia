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

const leadFormSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  tipo_processo: z.string().min(1, "Selecione um tipo de processo"),
  origem: z.string().min(1, "Selecione uma origem"),
  estagio: z.string().min(1, "Selecione um estágio"),
  mensagem: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface NewLeadDialogProps {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

export function NewLeadDialog({ open, onClose, lead }: NewLeadDialogProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const isEditing = !!lead;

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      tipo_processo: "",
      origem: "site",
      estagio: "novo",
      mensagem: "",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        nome_completo: lead.nome_completo,
        email: lead.email,
        telefone: lead.telefone,
        tipo_processo: lead.tipo_processo,
        origem: lead.origem,
        estagio: lead.estagio,
        mensagem: lead.mensagem,
      });
    } else {
      form.reset({
        nome_completo: "",
        email: "",
        telefone: "",
        tipo_processo: "",
        origem: "site",
        estagio: "novo",
        mensagem: "",
      });
    }
  }, [lead, form]);

  const onSubmit = async (values: LeadFormValues) => {
    try {
      if (isEditing && lead) {
        await updateLead.mutateAsync({
          id: lead.id,
          nome_completo: values.nome_completo,
          email: values.email,
          telefone: values.telefone,
          tipo_processo: values.tipo_processo,
          origem: values.origem as any,
          estagio: values.estagio as any,
          mensagem: values.mensagem,
          como_conheceu: values.origem,
        });
      } else {
        await createLead.mutateAsync({
          nome_completo: values.nome_completo,
          email: values.email,
          telefone: values.telefone,
          tipo_processo: values.tipo_processo,
          origem: values.origem as any,
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
          <DialogTitle>{isEditing ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do lead"
              : "Cadastre um novo lead manualmente"}
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
                    <FormLabel>Email *</FormLabel>
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
                        {TIPO_PROCESSO_OPTIONS.map((tipo) => (
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
                        {Object.entries(ORIGEM_LABELS).map(([key, label]) => (
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
                {isEditing ? "Atualizar" : "Salvar Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

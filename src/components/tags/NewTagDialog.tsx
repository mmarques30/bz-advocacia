import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTag } from "@/hooks/useTags";
import ColorPicker from "./ColorPicker";
import TagBadge from "./TagBadge";
import type { TagTipo } from "@/types/tags";
import { TIPO_LABELS } from "@/types/tags";

const tagSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(30, "Nome deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9\sÀ-ÿ]+$/, "Use apenas letras, números e espaços"),
  tipo: z.enum(['lead', 'processo', 'geral']),
  cor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido"),
  descricao: z.string()
    .max(200, "Descrição deve ter no máximo 200 caracteres")
    .optional(),
});

type TagFormData = z.infer<typeof tagSchema>;

interface NewTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewTagDialog({ open, onOpenChange }: NewTagDialogProps) {
  const createTag = useCreateTag();

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      nome: '',
      tipo: 'geral',
      cor: '#3B82F6',
      descricao: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = form;

  const watchedValues = watch();

  const onSubmit = async (data: TagFormData) => {
    await createTag.mutateAsync({
      nome: data.nome,
      tipo: data.tipo,
      cor: data.cor,
      descricao: data.descricao,
    });
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: Cliente Prioritário"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={watchedValues.tipo || 'geral'}
              onValueChange={(value: TagTipo) => setValue('tipo', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">{TIPO_LABELS.lead}</SelectItem>
                <SelectItem value="processo">{TIPO_LABELS.processo}</SelectItem>
                <SelectItem value="geral">{TIPO_LABELS.geral}</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-sm text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          <ColorPicker
            value={watchedValues.cor || '#3B82F6'}
            onChange={(cor) => setValue('cor', cor)}
          />
          {errors.cor && (
            <p className="text-sm text-destructive">{errors.cor.message}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Opcional: Descreva quando usar esta tag"
              rows={3}
            />
            {errors.descricao && (
              <p className="text-sm text-destructive">{errors.descricao.message}</p>
            )}
          </div>

          {watchedValues.nome && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Preview</Label>
              <div>
                <TagBadge
                  nome={watchedValues.nome}
                  cor={watchedValues.cor || '#3B82F6'}
                  size="lg"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTag.isPending}>
              {createTag.isPending ? 'Criando...' : 'Criar Tag'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

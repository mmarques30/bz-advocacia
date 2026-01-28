import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PROCESSO_STATUS_LABELS, TRIBUNAIS_OPCOES, ProcessosFilters as FiltersType, ProcessoStatus } from "@/types/processos";
import { supabase } from "@/integrations/supabase/client";

interface ProcessosFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: FiltersType;
  onApply: (filters: FiltersType) => void;
}

export function ProcessosFilters({
  open,
  onClose,
  filters,
  onApply,
}: ProcessosFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Buscar clientes (leads com estagio = fechado)
  const { data: clientes } = useQuery({
    queryKey: ["clientes-para-filtro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id, nome_completo")
        .eq("estagio", "fechado")
        .order("nome_completo");
      
      if (error) throw error;
      return data;
    },
  });

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared: FiltersType = { status: ["em_andamento"] };
    setLocalFilters(cleared);
    onApply(cleared);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status */}
          <div>
            <Label className="text-base font-semibold">Status</Label>
            <div className="space-y-2 mt-3">
              {Object.entries(PROCESSO_STATUS_LABELS).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${value}`}
                    checked={localFilters.status.includes(value as ProcessoStatus)}
                    onCheckedChange={(checked) => {
                      setLocalFilters({
                        ...localFilters,
                        status: checked
                          ? [...localFilters.status, value as ProcessoStatus]
                          : localFilters.status.filter((s) => s !== value),
                      });
                    }}
                  />
                  <Label htmlFor={`status-${value}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por Documentos */}
          <div>
            <Label className="text-base font-semibold">Documentos Vinculados</Label>
            <RadioGroup
              className="mt-3 space-y-2"
              value={localFilters.filtro_documentos || "todos"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  filtro_documentos: value === "todos" ? undefined : value as "com_docs" | "sem_docs",
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todos" id="docs-todos" />
                <Label htmlFor="docs-todos" className="font-normal cursor-pointer">
                  Todos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="com_docs" id="docs-com" />
                <Label htmlFor="docs-com" className="font-normal cursor-pointer">
                  Com documentos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sem_docs" id="docs-sem" />
                <Label htmlFor="docs-sem" className="font-normal cursor-pointer">
                  Sem documentos
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cliente */}
          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Select
              value={localFilters.cliente_id || "all"}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, cliente_id: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome_completo}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Tribunal */}
          <div>
            <Label htmlFor="tribunal">Tribunal</Label>
            <Select
              value={localFilters.tribunal || "all"}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, tribunal: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TRIBUNAIS_OPCOES.map((tribunal) => (
                  <SelectItem key={tribunal} value={tribunal}>
                    {tribunal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Processo */}
          <div>
            <Label htmlFor="tipo">Tipo de Processo</Label>
            <Input
              id="tipo"
              placeholder="Ex: Divórcio, Inventário..."
              value={localFilters.tipo || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, tipo: e.target.value || undefined })
              }
            />
          </div>

          {/* Tem prazo próximo */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prazo-proximo"
              checked={localFilters.tem_prazo_proximo || false}
              onCheckedChange={(checked) =>
                setLocalFilters({ ...localFilters, tem_prazo_proximo: checked as boolean })
              }
            />
            <Label htmlFor="prazo-proximo" className="font-normal cursor-pointer">
              Tem prazo próximo (&lt; 7 dias)
            </Label>
          </div>

          {/* Sem atualização há X dias */}
          <div>
            <Label htmlFor="sem-atualizacao">Sem atualização há (dias)</Label>
            <Input
              id="sem-atualizacao"
              type="number"
              placeholder="Ex: 30"
              value={localFilters.sem_atualizacao_dias || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  sem_atualizacao_dias: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={handleClear} className="flex-1">
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

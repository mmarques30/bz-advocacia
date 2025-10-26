import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, User, Building2, Briefcase, Calendar } from "lucide-react";
import { TEMPLATE_VARIABLES } from "@/lib/templateVariables";
import { Badge } from "@/components/ui/badge";

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

const categoryIcons = {
  cliente: User,
  escritorio: Building2,
  processo: Briefcase,
  sistema: Calendar,
};

const categoryLabels = {
  cliente: 'Cliente',
  escritorio: 'Escritório',
  processo: 'Processo',
  sistema: 'Sistema',
};

export default function TemplateEditor({ value, onChange, id = "conteudo" }: TemplateEditorProps) {
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(id) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + variable + value.substring(end);
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const usedVariables = value.match(/\{[^}]+\}/g) || [];
  const uniqueUsedVariables = Array.from(new Set(usedVariables));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Conteúdo do Template</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {value.length} caracteres
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Inserir Variável
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {variables.map(variable => (
                          <Button
                            key={variable.value}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => insertVariable(variable.value)}
                          >
                            <code className="bg-muted px-1.5 py-0.5 rounded mr-2">
                              {variable.value}
                            </code>
                            {variable.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite o conteúdo do template aqui. Use {variavel} para inserir dados dinâmicos..."
        className="min-h-[300px] font-mono text-sm"
      />

      {uniqueUsedVariables.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            Variáveis utilizadas:
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {uniqueUsedVariables.map(variable => (
              <Badge key={variable} variant="secondary" className="text-xs font-mono">
                {variable}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

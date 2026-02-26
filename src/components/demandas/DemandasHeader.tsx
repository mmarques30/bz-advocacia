import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DemandasHeaderProps {
  onNewDemanda: () => void;
}

export const DemandasHeader = ({ onNewDemanda }: DemandasHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">Consultoria</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe a evolução e melhorias do sistema
        </p>
      </div>
      <Button size="sm" onClick={onNewDemanda}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Demanda
      </Button>
    </div>
  );
};
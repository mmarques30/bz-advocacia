import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Briefcase } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

export function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading } = useGlobalSearch(searchTerm);
  const navigate = useNavigate();
  
  // Atalho de teclado Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  
  const handleSelect = (url: string) => {
    setIsOpen(false);
    setSearchTerm("");
    navigate(url);
  };
  
  // Agrupar resultados por tipo
  const leadResults = results.filter(r => r.type === 'lead');
  const processoResults = results.filter(r => r.type === 'processo');
  
  return (
    <>
      {/* Input de busca visível */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar... (Ctrl+K)"
          onClick={() => setIsOpen(true)}
          className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          readOnly
        />
      </div>
      
      {/* Dialog de resultados */}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput 
          placeholder="Buscar pessoas, processos..." 
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm">Buscando...</div>
          )}
          
          {!isLoading && results.length === 0 && searchTerm.length >= 2 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}
          
          {!isLoading && leadResults.length > 0 && (
            <CommandGroup heading="Vendas">
              {leadResults.map(result => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result.url)}
                  className="flex items-start gap-3"
                >
                  <Users className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {!isLoading && processoResults.length > 0 && (
            <CommandGroup heading="Processos">
              {processoResults.map(result => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result.url)}
                  className="flex items-start gap-3"
                >
                  <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

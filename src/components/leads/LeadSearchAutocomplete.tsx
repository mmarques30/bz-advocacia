import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, User, Phone, Mail, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Lead } from "@/types/leads";

interface LeadSearchAutocompleteProps {
  leads: Lead[] | undefined;
  onSelect: (lead: Lead) => void;
  onSearchChange: (search: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  lead: Lead;
  matchField: string;
  matchValue: string;
  icon: typeof User;
}

export function LeadSearchAutocomplete({
  leads,
  onSelect,
  onSearchChange,
  placeholder = "Buscar por nome, telefone, email ou CPF...",
  className,
}: LeadSearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!query || query.length < 2 || !leads) return [];

    const q = query.toLowerCase().trim();
    const seen = new Set<string>();
    const results: Suggestion[] = [];

    for (const lead of leads) {
      if (results.length >= 8) break;
      if (seen.has(lead.id)) continue;

      if (lead.nome_completo?.toLowerCase().includes(q)) {
        seen.add(lead.id);
        results.push({ lead, matchField: "Nome", matchValue: lead.nome_completo, icon: User });
      } else if (lead.telefone?.includes(q)) {
        seen.add(lead.id);
        results.push({ lead, matchField: "Telefone", matchValue: lead.telefone, icon: Phone });
      } else if (lead.email?.toLowerCase().includes(q)) {
        seen.add(lead.id);
        results.push({ lead, matchField: "Email", matchValue: lead.email, icon: Mail });
      } else if (lead.cpf?.includes(q)) {
        seen.add(lead.id);
        results.push({ lead, matchField: "CPF", matchValue: lead.cpf, icon: FileText });
      }
    }

    return results;
  }, [query, leads]);

  useEffect(() => {
    setHighlightIndex(-1);
    setIsOpen(suggestions.length > 0);
  }, [suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    onSelect(suggestion.lead);
    setQuery("");
    onSearchChange("");
    setIsOpen(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setQuery("");
    onSearchChange("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string) => {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-primary">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-8"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
          <ul className="py-1 max-h-[320px] overflow-y-auto">
            {suggestions.map((s, idx) => (
              <li
                key={s.lead.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm",
                  idx === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onMouseEnter={() => setHighlightIndex(idx)}
                onClick={() => handleSelect(s)}
              >
                <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {highlightMatch(s.lead.nome_completo)}
                  </p>
                  {s.matchField !== "Nome" && (
                    <p className="text-xs text-muted-foreground truncate">
                      {s.matchField}: {highlightMatch(s.matchValue)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {s.lead.tipo_processo}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

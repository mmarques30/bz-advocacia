import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_PERMISSIONS, PagePermission, getChildrenKeys } from "@/lib/pagePermissions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PagePermissionsEditorProps {
  permissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PagePermissionsEditor({ 
  permissions, 
  onChange, 
  disabled = false 
}: PagePermissionsEditorProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const isChecked = (key: string) => permissions.includes(key);

  const handleToggle = (key: string, hasChildren: boolean, childKeys?: string[]) => {
    let newPermissions = [...permissions];

    if (isChecked(key)) {
      // Remover a permissão
      newPermissions = newPermissions.filter(p => p !== key);
      // Se for pai, remover todos os filhos também
      if (hasChildren && childKeys) {
        newPermissions = newPermissions.filter(p => !childKeys.includes(p));
      }
    } else {
      // Adicionar a permissão
      newPermissions.push(key);
      // Se for pai, adicionar todos os filhos também
      if (hasChildren && childKeys) {
        childKeys.forEach(childKey => {
          if (!newPermissions.includes(childKey)) {
            newPermissions.push(childKey);
          }
        });
      }
    }

    // Se for filho, verificar se o pai deve ser marcado/desmarcado
    const parentPage = PAGE_PERMISSIONS.find(p => 
      p.children?.some(c => c.key === key)
    );
    
    if (parentPage) {
      const allChildrenKeys = parentPage.children!.map(c => c.key);
      const checkedChildren = allChildrenKeys.filter(ck => newPermissions.includes(ck));
      
      if (checkedChildren.length === allChildrenKeys.length) {
        // Todos os filhos estão marcados, marcar o pai
        if (!newPermissions.includes(parentPage.key)) {
          newPermissions.push(parentPage.key);
        }
      } else {
        // Nem todos os filhos estão marcados, desmarcar o pai
        newPermissions = newPermissions.filter(p => p !== parentPage.key);
      }
    }

    onChange(newPermissions);
  };

  const renderPageItem = (page: PagePermission, isChild = false) => {
    const hasChildren = page.children && page.children.length > 0;
    const childKeys = hasChildren ? page.children!.map(c => c.key) : undefined;
    const isExpanded = expandedSections.includes(page.key);
    const checked = isChecked(page.key);
    
    // Para pais, verificar estado indeterminado
    let isIndeterminate = false;
    if (hasChildren && !checked) {
      const someChildrenChecked = childKeys!.some(ck => permissions.includes(ck));
      isIndeterminate = someChildrenChecked;
    }

    if (hasChildren) {
      return (
        <Collapsible
          key={page.key}
          open={isExpanded}
          onOpenChange={() => toggleSection(page.key)}
        >
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
            <CollapsibleTrigger asChild>
              <button 
                type="button"
                className="p-1 hover:bg-muted rounded"
                disabled={disabled}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <Checkbox
              id={page.key}
              checked={checked}
              onCheckedChange={() => handleToggle(page.key, true, childKeys)}
              disabled={disabled}
              className={cn(isIndeterminate && "opacity-50")}
            />
            <div className="flex-1">
              <Label 
                htmlFor={page.key} 
                className={cn(
                  "cursor-pointer font-medium",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {page.label}
              </Label>
              {page.description && (
                <p className="text-xs text-muted-foreground">{page.description}</p>
              )}
            </div>
          </div>
          
          <CollapsibleContent>
            <div className="ml-8 border-l border-border pl-2 space-y-1">
              {page.children!.map(child => renderPageItem(child, true))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div 
        key={page.key}
        className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50",
          isChild && "ml-2"
        )}
      >
        <Checkbox
          id={page.key}
          checked={checked}
          onCheckedChange={() => handleToggle(page.key, false)}
          disabled={disabled}
        />
        <div className="flex-1">
          <Label 
            htmlFor={page.key} 
            className={cn(
              "cursor-pointer",
              isChild ? "font-normal" : "font-medium",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {page.label}
          </Label>
          {page.description && !isChild && (
            <p className="text-xs text-muted-foreground">{page.description}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
      {PAGE_PERMISSIONS.map(page => renderPageItem(page))}
    </div>
  );
}

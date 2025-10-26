import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  nome: string;
  cor: string;
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
  className?: string;
}

export default function TagBadge({ nome, cor, size = 'md', onRemove, className }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${cor}20`,
        color: cor,
        border: `1px solid ${cor}40`,
      }}
    >
      {nome}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-current/20 p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

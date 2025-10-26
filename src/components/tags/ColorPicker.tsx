import { TAG_COLORS } from "@/types/tags";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <Label>Cor</Label>
      <div className="grid grid-cols-5 gap-2">
        {TAG_COLORS.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => onChange(color.hex)}
            className={cn(
              "h-10 rounded-md border-2 transition-all hover:scale-110",
              value === color.hex ? "border-foreground ring-2 ring-primary" : "border-border"
            )}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-10 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono uppercase"
          maxLength={7}
        />
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-10 w-20 rounded-md border"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm text-muted-foreground">Preview</span>
      </div>
    </div>
  );
}

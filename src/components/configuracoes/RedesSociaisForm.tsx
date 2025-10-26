import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Linkedin, Facebook, Twitter, Globe } from "lucide-react";

interface RedesSociaisFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function RedesSociaisForm({ data, onChange }: RedesSociaisFormProps) {
  const handleRedeChange = (rede: string, value: string) => {
    onChange("redes_sociais", {
      ...(data?.redes_sociais || {}),
      [rede]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes Sociais e Web</CardTitle>
        <CardDescription>Presença online do escritório</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Site
          </Label>
          <Input
            id="site"
            value={data?.site || ""}
            onChange={(e) => onChange("site", e.target.value)}
            placeholder="https://www.escritorio.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </Label>
          <Input
            id="instagram"
            value={data?.redes_sociais?.instagram || ""}
            onChange={(e) => handleRedeChange("instagram", e.target.value)}
            placeholder="@escritorio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Label>
          <Input
            id="linkedin"
            value={data?.redes_sociais?.linkedin || ""}
            onChange={(e) => handleRedeChange("linkedin", e.target.value)}
            placeholder="linkedin.com/company/escritorio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </Label>
          <Input
            id="facebook"
            value={data?.redes_sociais?.facebook || ""}
            onChange={(e) => handleRedeChange("facebook", e.target.value)}
            placeholder="facebook.com/escritorio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter/X
          </Label>
          <Input
            id="twitter"
            value={data?.redes_sociais?.twitter || ""}
            onChange={(e) => handleRedeChange("twitter", e.target.value)}
            placeholder="@escritorio"
          />
        </div>
      </CardContent>
    </Card>
  );
}

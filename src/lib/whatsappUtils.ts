import { toast } from "@/hooks/use-toast";

export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
}

export function openWhatsAppLink(phone: string, message?: string) {
  if (!phone) {
    toast({ title: "Telefone não informado", variant: "destructive" });
    return;
  }

  const formatted = formatPhoneForWhatsApp(phone);
  const url = message
    ? `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${formatted}`;

  // Use <a> tag click to bypass iframe sandbox restrictions on window.open
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

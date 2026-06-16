// Inicial(is) de um nome pra avatar. Defensivo: nome null/undefined/vazio
// devolve "?" em vez de "undefined" ou crash. Garante max 2 caracteres
// pra nao estourar o avatar redondo de w-7 h-7.
export function getIniciais(nome: string | null | undefined): string {
  if (!nome || typeof nome !== "string") return "?";
  const limpo = nome.trim();
  if (!limpo) return "?";
  const parts = limpo.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

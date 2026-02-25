import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQEcRKqnsvUsXiq4jmdqLo9zAqtsAwrPQrivVFE1jehceflnM-hliX8goacOyMw4S2LjYSMHbJUOGIF/pub?output=csv";

export interface CsvLead {
  id: string;
  nome: string;
  telefone: string;
  plataforma: "fb" | "ig" | "organic" | string;
  plataformaLabel: string;
  campanha: string;
  estagio: string;
  situacao: string;
  situacaoCor: string;
  data: string;
  dataRaw: Date | null;
  diasParado: number;
  whatsappStatus: string;
  tipoServico: string;
}

export interface CsvSummary {
  total: number;
  hoje: number;
  enviados: number;
  created: number;
  semStatus: number;
}

function parsePlatform(platform: string | null, isOrganic: boolean | null): { key: string; label: string } {
  if (isOrganic) return { key: "organic", label: "Orgânico" };
  if (platform === "fb") return { key: "fb", label: "Facebook" };
  if (platform === "ig") return { key: "ig", label: "Instagram" };
  return { key: platform || "outro", label: platform || "Outro" };
}

function formatDate(d: Date | null): string {
  if (!d) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function calcDiasParado(d: Date | null): number {
  if (!d) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function mapSituacao(status: string | null): { label: string; cor: string } {
  const s = (status || "").toUpperCase().trim();
  if (s === "ENVIADO") return { label: "Enviado", cor: "bg-green-100 text-green-800 border-green-200" };
  if (s === "CREATED") return { label: "Criado", cor: "bg-blue-100 text-blue-800 border-blue-200" };
  if (s === "QUALIFICADO") return { label: "Qualificado", cor: "bg-purple-100 text-purple-800 border-purple-200" };
  if (s === "CONVERTIDO") return { label: "Convertido", cor: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  return { label: s || "Sem status", cor: "bg-gray-100 text-gray-800 border-gray-200" };
}

function mapEstagio(status: string | null): string {
  const s = (status || "").toUpperCase().trim();
  if (s === "ENVIADO") return "Enviado";
  if (s === "CREATED") return "Novo";
  if (s === "QUALIFICADO") return "Qualificado";
  if (s === "CONVERTIDO") return "Convertido";
  return s || "Pendente";
}

function mapTipoServico(raw: string | null): string {
  if (!raw) return "-";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useLeadsCsv() {
  return useQuery({
    queryKey: ["leads-csv"],
    queryFn: async (): Promise<{ leads: CsvLead[]; summary: CsvSummary }> => {
      const res = await fetch(CSV_URL);
      const text = await res.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const rows = parsed.data as Record<string, string>[];

      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

      let enviados = 0;
      let created = 0;
      let semStatus = 0;
      let hoje = 0;

      const leads: CsvLead[] = rows.map((row, idx) => {
        const isOrganic = (row.is_organic || "").toLowerCase() === "true";
        const platform = parsePlatform(row.platform || null, isOrganic);
        const dateObj = row.created_time ? new Date(row.created_time) : null;
        const dateFormatted = formatDate(dateObj);
        const situacaoInfo = mapSituacao(row.lead_status || null);

        const statusUpper = (row.lead_status || "").toUpperCase().trim();
        if (statusUpper === "ENVIADO") enviados++;
        else if (statusUpper === "CREATED") created++;
        else semStatus++;

        if (dateFormatted === todayStr) hoje++;

        return {
          id: row.id || String(idx),
          nome: row.full_name || "Sem nome",
          telefone: (row.phone_number || "").replace("p:", ""),
          plataforma: platform.key,
          plataformaLabel: platform.label,
          campanha: row.campaign_name || "-",
          estagio: mapEstagio(row.lead_status || null),
          situacao: situacaoInfo.label,
          situacaoCor: situacaoInfo.cor,
          data: dateFormatted,
          dataRaw: dateObj,
          diasParado: calcDiasParado(dateObj),
          whatsappStatus: row.contato_whatsapp || "",
          tipoServico: mapTipoServico(row.tipo_servico || null),
        };
      });

      return {
        leads,
        summary: { total: leads.length, hoje, enviados, created, semStatus },
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}

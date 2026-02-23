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
  data: string; // DD/MM/AAAA
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

function parsePlatform(platform: string, isOrganic: string): { key: string; label: string } {
  if (isOrganic === "true") return { key: "organic", label: "Orgânico" };
  if (platform === "fb") return { key: "fb", label: "Facebook" };
  if (platform === "ig") return { key: "ig", label: "Instagram" };
  return { key: platform || "outro", label: platform || "Outro" };
}

function parseDate(raw: string): Date | null {
  if (!raw || raw === "#ERROR!") return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
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
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function mapSituacao(status: string): { label: string; cor: string } {
  const s = (status || "").toUpperCase().trim();
  if (s === "ENVIADO") return { label: "Enviado", cor: "bg-green-100 text-green-800 border-green-200" };
  if (s === "CREATED") return { label: "Criado", cor: "bg-blue-100 text-blue-800 border-blue-200" };
  return { label: s || "Sem status", cor: "bg-gray-100 text-gray-800 border-gray-200" };
}

function mapEstagio(status: string): string {
  const s = (status || "").toUpperCase().trim();
  if (s === "ENVIADO") return "Enviado";
  if (s === "CREATED") return "Novo";
  return s || "Pendente";
}

function mapTipoServico(raw: string): string {
  if (!raw) return "-";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useLeadsCsv() {
  return useQuery({
    queryKey: ["leads-csv"],
    queryFn: async (): Promise<{ leads: CsvLead[]; summary: CsvSummary }> => {
      const response = await fetch(CSV_URL);
      const text = await response.text();

      const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

      let enviados = 0;
      let created = 0;
      let semStatus = 0;
      let hoje = 0;

      const leads: CsvLead[] = (data as any[]).map((row, idx) => {
        const platform = parsePlatform(row.platform, row.is_organic);
        const dateObj = parseDate(row.created_time);
        const dateFormatted = formatDate(dateObj);
        const situacaoInfo = mapSituacao(row.lead_status);
        const whatsapp = row["Contato no WhatsApp"] || "";

        const statusUpper = (row.lead_status || "").toUpperCase().trim();
        if (statusUpper === "ENVIADO") enviados++;
        else if (statusUpper === "CREATED") created++;
        else semStatus++;

        if (dateFormatted === todayStr) hoje++;

        return {
          id: row.id || `csv-${idx}`,
          nome: row.full_name || "Sem nome",
          telefone: (row.phone_number || "").replace("p:", ""),
          plataforma: platform.key,
          plataformaLabel: platform.label,
          campanha: row.campaign_name || "-",
          estagio: mapEstagio(row.lead_status),
          situacao: situacaoInfo.label,
          situacaoCor: situacaoInfo.cor,
          data: dateFormatted,
          dataRaw: dateObj,
          diasParado: calcDiasParado(dateObj),
          whatsappStatus: whatsapp,
          tipoServico: mapTipoServico(row["qual_tipo_de_serviço_você_procura?"]),
        };
      });

      return {
        leads,
        summary: {
          total: leads.length,
          hoje,
          enviados,
          created,
          semStatus,
        },
      };
    },
    staleTime: 0, // Always refetch on mount
    refetchOnMount: "always",
  });
}

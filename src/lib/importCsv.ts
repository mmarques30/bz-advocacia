/**
 * Shared utilities for CSV / XLSX import flows.
 *
 * The codebase has 5+ bespoke Import*Dialog components (ImportLeads,
 * ImportFaturamento, ImportDespesas, ImportTransacoes, ImportClientes)
 * each re-implementing file parsing, mes/ano normalization, and brl
 * currency parsing. Rather than forcing a risky one-size-fits-all
 * refactor of the dialogs (each has domain-specific validation), this
 * module extracts only the truly shared primitives. Existing dialogs
 * keep working untouched; new code and future refactors import from
 * here to reduce duplication incrementally.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

export const MESES_MAP: Record<string, number> = {
  janeiro: 1, jan: 1,
  fevereiro: 2, fev: 2,
  março: 3, marco: 3, mar: 3,
  abril: 4, abr: 4,
  maio: 5, mai: 5,
  junho: 6, jun: 6,
  julho: 7, jul: 7,
  agosto: 8, ago: 8,
  setembro: 9, set: 9,
  outubro: 10, out: 10,
  novembro: 11, nov: 11,
  dezembro: 12, dez: 12,
};

export function parseMesPtBR(raw: string): number | null {
  if (!raw) return null;
  const key = raw.toString().trim().toLowerCase();
  const direct = MESES_MAP[key];
  if (direct) return direct;
  const n = parseInt(key, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 12) return n;
  return null;
}

/**
 * Parses a Brazilian-formatted currency/number string into a number.
 * Accepts: "1.234,56", "R$ 1234.56", "1234,5", "1234", etc.
 * Returns NaN when the input cannot be parsed.
 */
export function parseBRLNumber(raw: string | number | null | undefined): number {
  if (raw == null) return NaN;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw)
    .replace(/[^\d,.\-]/g, "") // drop R$, spaces, unicode symbols
    .replace(/\./g, "") // drop thousand separators
    .replace(",", "."); // normalize decimal separator
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export type ParsedFileRows = Record<string, string>[];

/** Parse a CSV File (returns rows keyed by header). */
export async function parseCsvFile(file: File): Promise<ParsedFileRows> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    });
  });
}

/** Parse the first worksheet of an XLSX / XLS file into keyed rows. */
export async function parseXlsxFile(file: File): Promise<ParsedFileRows> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });
}

/** Detect file type by extension and delegate to the right parser. */
export async function parseSpreadsheetFile(file: File): Promise<ParsedFileRows> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCsvFile(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXlsxFile(file);
  throw new Error(`Formato não suportado: ${file.name}`);
}

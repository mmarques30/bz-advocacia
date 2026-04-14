import { describe, expect, it } from "vitest";
import {
  mapCategoriaCodigo,
  resolveCategoriaLabel,
} from "@/lib/categoriaDespesa";

describe("mapCategoriaCodigo", () => {
  it("maps known short codes to CategoriaDespesa enum values", () => {
    expect(mapCategoriaCodigo("aluguel")).toBe("aluguel_condominio");
    expect(mapCategoriaCodigo("salarios")).toBe("salarios_encargos");
    expect(mapCategoriaCodigo("telefonia")).toBe("telefonia_internet");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(mapCategoriaCodigo(" Aluguel ")).toBe("aluguel_condominio");
    expect(mapCategoriaCodigo("IMPOSTOS")).toBe("impostos_taxas");
  });

  it("falls back to 'outros' for unknown or empty codes", () => {
    expect(mapCategoriaCodigo(null)).toBe("outros");
    expect(mapCategoriaCodigo("")).toBe("outros");
    expect(mapCategoriaCodigo("juliana")).toBe("outros");
    expect(mapCategoriaCodigo("operacional")).toBe("outros");
  });
});

describe("resolveCategoriaLabel", () => {
  it("returns official label for known enum codes", () => {
    expect(resolveCategoriaLabel("aluguel")).toBe("Aluguel e Condomínio");
    expect(resolveCategoriaLabel("salarios")).toBe("Salários e Encargos");
    expect(resolveCategoriaLabel("impostos")).toBe("Impostos e Taxas");
  });

  it("returns 'Outros' for explicit outros code", () => {
    expect(resolveCategoriaLabel("outros")).toBe("Outros");
    expect(resolveCategoriaLabel("OUTROS")).toBe("Outros");
  });

  it("returns Title Case label for unknown codes (the bug fix)", () => {
    // These are the exact codes from the live DB that were breaking the chart.
    expect(resolveCategoriaLabel("juliana")).toBe("Juliana");
    expect(resolveCategoriaLabel("eliziane")).toBe("Eliziane");
    expect(resolveCategoriaLabel("operacional")).toBe("Operacional");
    expect(resolveCategoriaLabel("clientes")).toBe("Clientes");
  });

  it("handles multi-word codes with underscores", () => {
    expect(resolveCategoriaLabel("cartao_credito")).toBe("Cartao Credito");
    expect(resolveCategoriaLabel("folha_de_pagamento")).toBe("Folha De Pagamento");
  });

  it("handles null/empty/whitespace input gracefully", () => {
    expect(resolveCategoriaLabel(null)).toBe("Outros");
    expect(resolveCategoriaLabel("")).toBe("Outros");
    expect(resolveCategoriaLabel("   ")).toBe("Outros");
  });

  it("never returns the same label for different unknown codes (regression)", () => {
    // The original bug produced 4+ pie slices all labeled "Outros".
    // Ensure different unknown codes now produce distinct labels.
    const a = resolveCategoriaLabel("juliana");
    const b = resolveCategoriaLabel("eliziane");
    const c = resolveCategoriaLabel("operacional");
    const d = resolveCategoriaLabel("clientes");
    expect(new Set([a, b, c, d]).size).toBe(4);
  });
});

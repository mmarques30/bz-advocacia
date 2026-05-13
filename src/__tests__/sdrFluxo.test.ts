import { describe, it, expect } from "vitest";
import { fluxoFromArea } from "@/lib/sdrFluxo";

describe("SDR — fluxoFromArea (cobertura área → fluxo)", () => {
  it("mapeia saúde", () => {
    expect(fluxoFromArea("saude")).toBe("saude");
    expect(fluxoFromArea("saúde")).toBe("saude");
    expect(fluxoFromArea("SAUDE")).toBe("saude");
  });

  it("mapeia inventário", () => {
    expect(fluxoFromArea("inventario")).toBe("inventario");
    expect(fluxoFromArea("inventário")).toBe("inventario");
  });

  it("mapeia áreas de qualificação geral", () => {
    for (const a of [
      "familia",
      "família",
      "civel",
      "cível",
      "consumidor",
      "trabalhista",
      "previdenciario",
      "previdenciário",
    ]) {
      expect(fluxoFromArea(a)).toBe("qualificacao_geral");
    }
  });

  it("área vazia/null vira qualificacao_geral", () => {
    expect(fluxoFromArea(null)).toBe("qualificacao_geral");
    expect(fluxoFromArea(undefined)).toBe("qualificacao_geral");
    expect(fluxoFromArea("")).toBe("qualificacao_geral");
  });

  it("área desconhecida vira fora_escopo", () => {
    expect(fluxoFromArea("criminal")).toBe("fora_escopo");
    expect(fluxoFromArea("tributario")).toBe("fora_escopo");
    expect(fluxoFromArea("xpto")).toBe("fora_escopo");
  });
});

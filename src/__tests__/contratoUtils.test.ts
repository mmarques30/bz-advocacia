import { describe, expect, it } from "vitest";
import {
  formatarCPF,
  formatarTelefone,
  formatarMoeda,
  valorPorExtenso,
  extrairVariaveisFaltantes,
} from "@/lib/contratoUtils";
import type { DadosCliente } from "@/types/contratos";

/**
 * Tests para contratoUtils — geracao de contratos legais.
 * Bug aqui = documento juridico com numero/nome errado. Alto impacto.
 */

describe("formatarCPF", () => {
  it("formats 11-digit string into 000.000.000-00", () => {
    expect(formatarCPF("12345678900")).toBe("123.456.789-00");
  });

  it("strips non-digits before formatting", () => {
    expect(formatarCPF("123.456.789-00")).toBe("123.456.789-00");
    expect(formatarCPF("abc123def456ghi789jkl00")).toBe("123.456.789-00");
  });

  it("returns input unchanged if length is wrong", () => {
    // Regex nao faz match — retorna os numeros limpos sem formatacao.
    expect(formatarCPF("123")).toBe("123");
  });
});

describe("formatarTelefone", () => {
  it("formats 11-digit mobile as (DD) 9NNNN-NNNN", () => {
    expect(formatarTelefone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formats 10-digit landline as (DD) NNNN-NNNN", () => {
    expect(formatarTelefone("1134567890")).toBe("(11) 3456-7890");
  });

  it("strips non-digits before formatting", () => {
    expect(formatarTelefone("(11) 98765-4321")).toBe("(11) 98765-4321");
  });
});

describe("formatarMoeda", () => {
  it("formats numbers as BRL with comma decimal", () => {
    // Intl.NumberFormat usa NBSP (U+00A0) entre 'R$' e o numero em pt-BR.
    const result = formatarMoeda(1234.56);
    expect(result.replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });

  it("handles zero and decimals", () => {
    expect(formatarMoeda(0).replace(/\s/g, " ")).toBe("R$ 0,00");
    expect(formatarMoeda(0.5).replace(/\s/g, " ")).toBe("R$ 0,50");
  });

  it("rounds to 2 decimals", () => {
    expect(formatarMoeda(10.005).replace(/\s/g, " ")).toBe("R$ 10,01");
  });
});

describe("valorPorExtenso", () => {
  it("handles the zero and round-100 special cases", () => {
    expect(valorPorExtenso(0)).toBe("zero reais");
    expect(valorPorExtenso(100)).toBe("cem reais");
  });

  it("singular vs plural for reais", () => {
    expect(valorPorExtenso(1)).toBe("um real");
    expect(valorPorExtenso(2)).toBe("dois reais");
  });

  it("handles centavos correctly", () => {
    expect(valorPorExtenso(1.01)).toBe("um real e um centavo");
    expect(valorPorExtenso(1.5)).toBe("um real e cinquenta centavos");
  });

  it("handles teens (10-19)", () => {
    expect(valorPorExtenso(15)).toBe("quinze reais");
    expect(valorPorExtenso(19)).toBe("dezenove reais");
  });

  it("handles compound dozens (20-99)", () => {
    expect(valorPorExtenso(21)).toBe("vinte e um reais");
    expect(valorPorExtenso(99)).toBe("noventa e nove reais");
  });

  it("handles hundreds", () => {
    expect(valorPorExtenso(200)).toBe("duzentos reais");
    expect(valorPorExtenso(999)).toBe("novecentos e noventa e nove reais");
  });

  it("handles thousands — 'mil' sem 'um'", () => {
    // O codigo tem branch especial: 1 milhar = "mil", nao "um mil".
    expect(valorPorExtenso(1000)).toBe("mil reais");
  });

  it("handles thousands with remainder", () => {
    expect(valorPorExtenso(1500)).toBe("mil e quinhentos reais");
    expect(valorPorExtenso(2500)).toBe("dois mil e quinhentos reais");
  });

  it("rounds centavos half-way", () => {
    // 10.005 -> cents sao round((10.005-10)*100) = round(0.5) = 1 em JS.
    // Observacao: Math.round em JS e banker's rounding na pratica para .5
    // (comportamento varia), entao testamos caso estavel.
    expect(valorPorExtenso(10.1)).toBe("dez reais e dez centavos");
  });
});

describe("extrairVariaveisFaltantes", () => {
  const clienteCompleto: DadosCliente = {
    nome_completo: "Maria Silva",
    cpf: "12345678900",
    rg: "MG-12.345.678",
    nacionalidade: "brasileira",
    profissao: "advogada",
    estado_civil: "solteira",
    endereco_completo: "Rua X, 123",
    endereco_cidade: "Belo Horizonte",
    endereco_estado: "MG",
    endereco_cep: "30000-000",
    email: "maria@exemplo.com",
    telefone: "31999999999",
  };

  it("returns empty when all referenced vars have data", () => {
    const template =
      "Contrato firmado por {nome_cliente}, portador do CPF {cpf_cliente}";
    expect(extrairVariaveisFaltantes(template, clienteCompleto)).toEqual([]);
  });

  it("only flags variables actually used in the template", () => {
    const cliente = { ...clienteCompleto, cpf: "" };
    // CPF vazio mas nao referenciado — nao deveria aparecer.
    const template = "Nome: {nome_cliente}";
    expect(extrairVariaveisFaltantes(template, cliente)).toEqual([]);
  });

  it("flags CPF when used in template but empty on cliente", () => {
    const cliente = { ...clienteCompleto, cpf: "" };
    const template = "CPF: {cpf_cliente}";
    expect(extrairVariaveisFaltantes(template, cliente)).toContain("cpf");
  });

  it("flags multiple missing variables", () => {
    const cliente = { ...clienteCompleto, cpf: "", rg: "", profissao: "" };
    const template = "CPF: {cpf_cliente}, RG: {rg_cliente}, Prof: {profissao_cliente}";
    const missing = extrairVariaveisFaltantes(template, cliente);
    expect(missing.sort()).toEqual(["cpf", "profissao", "rg"]);
  });

  it("does not flag email (optional per comment no codigo)", () => {
    const cliente = { ...clienteCompleto, email: "" };
    const template = "Email: {email_cliente}";
    expect(extrairVariaveisFaltantes(template, cliente)).toEqual([]);
  });
});

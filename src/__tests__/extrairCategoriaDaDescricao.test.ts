import { describe, expect, it } from "vitest";
import { extrairCategoriaDaDescricao } from "@/hooks/useVisaoGeralFinanceiro";

describe("extrairCategoriaDaDescricao", () => {
  describe("padrão legado '(Categoria)' no final", () => {
    it("reconhece categorias explicitamente mapeadas", () => {
      expect(extrairCategoriaDaDescricao("Pagamento X (Aluguel)")).toBe("Aluguel");
      expect(extrairCategoriaDaDescricao("Fatura Y (Cartão de Crédito)")).toBe("Cartão de Crédito");
      expect(extrairCategoriaDaDescricao("DARF (Impostos)")).toBe("Impostos");
    });

    it("colapsa categorias secundárias em Outros (comportamento do produto)", () => {
      expect(extrairCategoriaDaDescricao("Conta luz (Energia)")).toBe("Outros");
      expect(extrairCategoriaDaDescricao("Claro (Telefonia)")).toBe("Outros");
      expect(extrairCategoriaDaDescricao("Estapar (Estacionamento)")).toBe("Outros");
    });

    it("retorna Outros se a categoria do padrão não está no map", () => {
      expect(extrairCategoriaDaDescricao("X (CategoriaDesconhecida)")).toBe("Outros");
    });
  });

  describe("keywords na descrição (fix do bug 'tudo vira Outros')", () => {
    // Exemplos reais vindos do banco — antes, todos caiam em "Outros"
    it("reconhece cartão de crédito", () => {
      expect(extrairCategoriaDaDescricao("Cartão de crédito")).toBe("Cartão de Crédito");
    });

    it("reconhece tecnologia/IA por vendors", () => {
      expect(extrairCategoriaDaDescricao("Google")).toBe("Tecnologia/IA");
      expect(extrairCategoriaDaDescricao("OpenAI assinatura")).toBe("Tecnologia/IA");
      expect(extrairCategoriaDaDescricao("Apify plano mensal")).toBe("Tecnologia/IA");
    });

    it("reconhece impostos por siglas", () => {
      expect(extrairCategoriaDaDescricao("Darf")).toBe("Impostos");
      expect(extrairCategoriaDaDescricao("Simples Nacional")).toBe("Impostos");
    });

    it("reconhece aluguel/condomínio", () => {
      expect(extrairCategoriaDaDescricao("Auxiliadora Predial")).toBe("Aluguel");
      expect(extrairCategoriaDaDescricao("Condomínio Janeiro")).toBe("Aluguel");
    });

    it("reconhece folha de pagamento", () => {
      expect(extrairCategoriaDaDescricao("Salário mensal")).toBe("Folha de Pagamento");
      expect(extrairCategoriaDaDescricao("Elaine diarista")).toBe("Folha de Pagamento");
      expect(extrairCategoriaDaDescricao("Agencia de estágios")).toBe("Folha de Pagamento");
    });
  });

  describe("fallback para descrição quando não há match", () => {
    it("retorna a descrição em Title Case (primeira letra maiúscula)", () => {
      // Descrição que não tem padrão nem keyword → usa a própria descrição
      expect(extrairCategoriaDaDescricao("alguma despesa aleatória")).toBe(
        "Alguma despesa aleatória",
      );
    });

    it("trunca descrições longas para evitar poluir o eixo do gráfico", () => {
      const longa = "Pagamento referente ao serviço especializado de consultoria tributária";
      const result = extrairCategoriaDaDescricao(longa);
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result.endsWith("…")).toBe(true);
    });

    it("garante labels distintos para descrições diferentes (regressão do bug)", () => {
      // O bug antigo fazia todas essas caírem em "Outros". Agora cada uma
      // ganha seu próprio label.
      const labels = new Set([
        extrairCategoriaDaDescricao("Vendor A"),
        extrairCategoriaDaDescricao("Vendor B"),
        extrairCategoriaDaDescricao("Vendor C"),
      ]);
      expect(labels.size).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("retorna Outros para descrição vazia ou só espaços", () => {
      expect(extrairCategoriaDaDescricao("")).toBe("Outros");
      expect(extrairCategoriaDaDescricao("   ")).toBe("Outros");
    });
  });
});

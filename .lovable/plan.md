

# Plano: Ajustes no Sistema de Documentos

## Objetivo
1. **Remover "Taborda"** do nome "Eliziane Zembruski Taborda" em todas as propostas e contratos
2. **Permitir criação de novos modelos** de proposta/contrato via upload de documento com análise por IA

---

## Parte 1: Remover Sobrenome "Taborda"

### Arquivos Afetados

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `src/components/documentos/PropostaPDF.tsx` | 327 | "Eliziane Zembruski Taborda" → "Eliziane Zembruski" |
| `src/components/documentos/PropostaPreview.tsx` | 180 | "Eliziane Zembruski Taborda" → "Eliziane Zembruski" |

### Mudança Específica

**Antes:**
```tsx
<Text style={styles.contactText}>Eliziane Zembruski Taborda</Text>
```

**Depois:**
```tsx
<Text style={styles.contactText}>Eliziane Zembruski</Text>
```

---

## Parte 2: Sistema de Upload com Análise por IA

### Fluxo Proposto

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Aba "Modelos" - Novo Botão "Criar Modelo com IA"                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Upload de Documento                                                 │
│     ┌──────────────────────────────────────────────────────────────┐   │
│     │  [Arraste o documento aqui ou clique para selecionar]        │   │
│     │  Formatos: PDF, DOCX, TXT                                    │   │
│     └──────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  2. Selecionar Tipo                                                     │
│     ○ Proposta (gera modelo visual 4 páginas)                          │
│     ○ Contrato (gera modelo texto estruturado)                         │
│                                                                         │
│  3. Nome do Modelo: [_________________________________]                 │
│     Categoria: [_Saúde_____▾] (select: Saúde, Família, Cível...)       │
│                                                                         │
│  [Analisar com IA]                                                      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  4. Resultado (após análise)                                            │
│                                                                         │
│  A IA extrai:                                                           │
│  • Descrição do serviço padrão                                         │
│  • Tipo de ação identificado                                           │
│  • Variáveis detectadas (valores, prazos, etc.)                        │
│                                                                         │
│  [Preview do Modelo]  [Salvar Modelo]  [Cancelar]                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/analyze-document/index.ts` | Criar | Edge function que usa Lovable AI para analisar documento |
| `src/components/documentos/UploadModeloDialog.tsx` | Criar | Dialog com upload, tipo e análise IA |
| `src/components/documentos/ModelosContrato.tsx` | Modificar | Adicionar botão "Criar Modelo com IA" |
| `src/lib/propostaTemplates.ts` | Modificar | Suportar modelos dinâmicos do banco |
| `src/hooks/useModelosDocumentos.ts` | Criar | Hook para buscar modelos personalizados da tabela templates |

### Edge Function: analyze-document

Usa Lovable AI (gemini-3-flash-preview) para:
- Extrair texto do documento enviado
- Identificar tipo de ação jurídica (saúde, família, trabalhista, etc.)
- Gerar descrição padrão do serviço
- Identificar variáveis (nome cliente, valores, datas)

**Payload de entrada:**
```json
{
  "content": "texto do documento",
  "tipo": "proposta" | "contrato"
}
```

**Payload de saída:**
```json
{
  "servico_padrao": "assessoria jurídica em...",
  "tipo_identificado": "saude",
  "variaveis": ["valor_entrada", "percentual_exito"],
  "descricao_modelo": "Modelo para ações de saúde..."
}
```

### Integração com Tabela Templates

O modelo criado será salvo na tabela `templates` existente:

```typescript
{
  nome: "Proposta - Ação de Saúde",
  tipo: "proposta", // ou "contrato"
  categoria: "saude",
  conteudo: JSON.stringify({
    servico_padrao: "...",
    tipo_modelo: "proposta",
    fonte: "upload_ia"
  }),
  descricao: "Modelo criado via upload com análise IA",
  ativo: true,
  variaveis: ["valor_entrada", "percentual_exito"]
}
```

### Componente UploadModeloDialog

**Funcionalidades:**
- Drag & drop para upload de arquivo
- Leitura de texto do arquivo (PDF via browser, DOCX via lib)
- Seleção de tipo (proposta/contrato)
- Input para nome e categoria
- Botão "Analisar com IA" que chama edge function
- Preview do resultado
- Botão "Salvar Modelo" que persiste na tabela templates

**Estados:**
- `idle` - aguardando upload
- `uploading` - processando arquivo
- `analyzing` - chamando IA
- `preview` - mostrando resultado
- `saving` - salvando no banco

### Modificação em ModelosContrato.tsx

Adicionar:
1. Botão "Criar Modelo com IA" no topo da lista
2. Buscar modelos personalizados do banco além dos estáticos
3. Badge "IA" para modelos criados via upload

### Modificação em GerarPropostaForm.tsx

Atualizar para:
1. Combinar `MODELOS_PROPOSTA` estáticos com modelos do banco
2. Identificar modelos de categoria "saude" para ações de saúde

---

## Detalhamento Técnico

### 1. Edge Function analyze-document

```typescript
// supabase/functions/analyze-document/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { content, tipo } = await req.json();
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const systemPrompt = `Você é um assistente jurídico especializado em análise de documentos.
Analise o documento e extraia:
1. Uma descrição padrão do serviço (max 200 caracteres)
2. O tipo de ação jurídica (saude, familia, civel, trabalhista, consumidor, previdenciario)
3. Variáveis que podem ser personalizadas

Responda APENAS em JSON válido.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analise este documento (${tipo}): ${content}` }
      ],
      tools: [/* ... tool para structured output */]
    }),
  });

  // Parse e retorna resultado
});
```

### 2. Hook useModelosDocumentos

```typescript
// src/hooks/useModelosDocumentos.ts
export const useModelosPersonalizados = (tipo: 'proposta' | 'contrato') => {
  return useQuery({
    queryKey: ['modelos-personalizados', tipo],
    queryFn: async () => {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('tipo', tipo)
        .eq('ativo', true);
      return data;
    }
  });
};
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/documentos/PropostaPDF.tsx` | Modificar (remover "Taborda") |
| `src/components/documentos/PropostaPreview.tsx` | Modificar (remover "Taborda") |
| `supabase/functions/analyze-document/index.ts` | Criar |
| `src/components/documentos/UploadModeloDialog.tsx` | Criar |
| `src/components/documentos/ModelosContrato.tsx` | Modificar |
| `src/hooks/useModelosDocumentos.ts` | Criar |
| `src/lib/propostaTemplates.ts` | Modificar |
| `src/components/documentos/GerarPropostaForm.tsx` | Modificar |

---

## Benefícios

1. **Personalização**: Escritório pode criar modelos específicos para ações de saúde
2. **Eficiência**: IA extrai automaticamente informações do documento fonte
3. **Consistência**: Novos modelos seguem o padrão visual já definido
4. **Escalabilidade**: Sistema suporta múltiplos tipos de ação sem código adicional


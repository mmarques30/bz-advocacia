
# Plano: Integrar CPF/CNPJ em Documentos e Criar Aba de Documentos no Cliente

## Visão Geral

O usuário solicitou dois ajustes importantes:
1. Garantir que CPF/CNPJ seja incluído na geração de Contratos e Propostas
2. Criar uma aba de documentos no detalhamento do cliente, listando todos os contratos e propostas emitidos para ele

## Análise Atual

### Contrato
- O sistema de contratos **já utiliza CPF** nos templates através da variável `{cpf_cliente}`
- A função `substituirVariaveis` em `contratoUtils.ts` já faz a substituição correta
- O CPF é buscado do cliente selecionado em `GerarContratoForm.tsx` (linha 78)
- **Status**: Funcional, porém se o cliente não tiver CPF cadastrado, o campo fica vazio no contrato

### Proposta
- O componente `PropostaPDF.tsx` **NÃO inclui CPF/CNPJ** do cliente
- O `GerarPropostaForm.tsx` não busca nem passa o CPF para o PDF
- **Status**: Precisa de ajuste para incluir CPF/CNPJ

### Histórico de Documentos por Cliente
- A tabela `contratos_gerados` possui campo `cliente_id` que referencia o cliente
- O componente `LeadDetailsDialog` tem 3 abas: Informações, Documentos (arquivos anexados), Notas
- **Status**: Precisa criar aba para listar contratos/propostas do cliente

## Implementação

### 1. Atualizar PropostaPDF para incluir CPF/CNPJ

**Arquivo**: `src/components/documentos/PropostaPDF.tsx`

Adicionar prop `clienteCPF` e exibi-lo na página 2 (Proposta) abaixo do nome:

```typescript
interface PropostaPDFProps {
  clienteNome: string;
  clienteCPF?: string;  // Nova prop
  // ... demais props
}

// Na página 2, após a saudação:
<Text style={styles.greeting}>
  Prezado(a) Sr(a). {clienteNome},
</Text>
{clienteCPF && (
  <Text style={styles.clienteCPF}>
    CPF/CNPJ: {clienteCPF}
  </Text>
)}
```

### 2. Atualizar GerarPropostaForm para buscar e passar CPF

**Arquivo**: `src/components/documentos/GerarPropostaForm.tsx`

Buscar CPF do cliente selecionado e passar para o componente PropostaPDF e PropostaPreview:

```typescript
const clienteCPF = useMemo(() => {
  const cliente = leads.find(l => l.id === clienteSelecionado);
  return cliente?.cpf || '';
}, [leads, clienteSelecionado]);

// Passar para PropostaPDF
<PropostaPDF
  clienteNome={clienteNome}
  clienteCPF={clienteCPF}
  // ... demais props
/>
```

### 3. Atualizar PropostaPreview para exibir CPF

**Arquivo**: `src/components/documentos/PropostaPreview.tsx`

Adicionar exibição do CPF/CNPJ no preview:

```typescript
interface PropostaPreviewProps {
  clienteNome: string;
  clienteCPF?: string;
  // ... demais props
}
```

### 4. Criar hook para buscar contratos do cliente

**Arquivo**: `src/hooks/useClienteContratos.ts` (novo)

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClienteContratos(clienteId: string) {
  return useQuery({
    queryKey: ['cliente-contratos', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_gerados')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}
```

### 5. Criar componente de aba de documentos do cliente

**Arquivo**: `src/components/leads/LeadContratosTab.tsx` (novo)

Componente que lista os contratos e propostas do cliente:

```typescript
import { useClienteContratos } from "@/hooks/useClienteContratos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadContratosTabProps {
  clienteId: string;
}

export function LeadContratosTab({ clienteId }: LeadContratosTabProps) {
  const { data: contratos, isLoading } = useClienteContratos(clienteId);
  
  // Renderizar lista de contratos com ações de visualizar/baixar PDF
}
```

### 6. Atualizar LeadDetailsDialog para incluir nova aba

**Arquivo**: `src/components/leads/LeadDetailsDialog.tsx`

Adicionar aba "Contratos" para exibir documentos gerados:

```typescript
<Tabs defaultValue="info" className="mt-4">
  <TabsList className="grid w-full grid-cols-4">  {/* De 3 para 4 colunas */}
    <TabsTrigger value="info">Informações</TabsTrigger>
    <TabsTrigger value="contratos">Contratos</TabsTrigger>  {/* Nova aba */}
    <TabsTrigger value="documentos">Documentos</TabsTrigger>
    <TabsTrigger value="notas">Notas Internas</TabsTrigger>
  </TabsList>

  <TabsContent value="contratos" className="mt-4">
    <LeadContratosTab clienteId={lead.id} />
  </TabsContent>
  {/* ... demais abas */}
</Tabs>
```

### 7. Garantir salvamento de propostas no histórico

**Arquivo**: `src/components/documentos/GerarPropostaForm.tsx`

Atualmente a proposta é apenas gerada como PDF e baixada, mas não é salva no banco. Precisamos salvar na tabela `contratos_gerados`:

```typescript
// Após gerar o PDF, salvar no banco
await supabase.from('contratos_gerados').insert({
  cliente_id: clienteSelecionado,
  titulo: `Proposta - ${clienteNome}`,
  tipo_contrato: 'proposta',  // Identificador para propostas
  conteudo_final: descricaoServico,
  valores: {
    valor_entrada: valorEntrada,
    desconto_avista: descontoAvista,
    percentual_exito: percentualExito,
  },
  dados_contrato: {
    condicoes_adicionais: condicoesAdicionais,
  },
  status: 'finalizado',
});
```

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/documentos/PropostaPDF.tsx` | Adicionar prop e exibição de CPF/CNPJ |
| `src/components/documentos/PropostaPreview.tsx` | Adicionar prop e exibição de CPF/CNPJ |
| `src/components/documentos/GerarPropostaForm.tsx` | Buscar CPF, passar para componentes, salvar no banco |
| `src/hooks/useClienteContratos.ts` | **Novo** - Hook para buscar contratos do cliente |
| `src/components/leads/LeadContratosTab.tsx` | **Novo** - Componente da aba de contratos |
| `src/components/leads/LeadDetailsDialog.tsx` | Adicionar nova aba "Contratos" |
| `src/types/contratos.ts` | Adicionar 'proposta' aos tipos de contrato |

## Fluxo de Uso Esperado

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa Gestão de Clientes > Clientes                 │
├─────────────────────────────────────────────────────────────────┤
│ 2. Clica em um cliente para ver detalhes                        │
├─────────────────────────────────────────────────────────────────┤
│ 3. Nova aba "Contratos" lista todos os documentos gerados       │
│    ┌───────────────────────────────────────────────────────┐    │
│    │ Contratos e Propostas                                  │    │
│    ├───────────────────────────────────────────────────────┤    │
│    │ Proposta - João Silva      | Proposta | 28/01/2026    │    │
│    │ Contrato Divórcio         | Divórcio | 15/01/2026    │    │
│    └───────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│ 4. Pode visualizar ou baixar PDF de cada documento              │
└─────────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

1. Propostas incluem CPF/CNPJ do cliente no documento
2. Contratos continuam incluindo CPF/CNPJ (já funciona)
3. Propostas são salvas no histórico junto com contratos
4. Nova aba no detalhamento do cliente mostra todos os documentos gerados
5. Links para download/visualização dos PDFs disponíveis
6. Centralização de todos os documentos do cliente em um único lugar

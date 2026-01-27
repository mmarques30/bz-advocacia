
# Plano: Importação de Clientes e Processos da Planilha B&Z

## Visão Geral

Criar funcionalidade completa para importar a planilha de clientes do escritório, onde:
1. **Cada cliente** vira um registro na tabela `contact_submissions` (com estágio "fechado")
2. **Cada número de processo separado por `|`** vira um registro individual na tabela `processos`, vinculado ao cliente

---

## Análise da Planilha

### Estrutura identificada:

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| CLIENTES | Nome (pode ter observações em parênteses) | "Amélia Zanetti (karoline)" |
| TJRS - 1º GRAU | Processos separados por `\|` | "5008779-67.2022.821.6001 \| 5008243-51.2025.8.21.6001" |
| TJ RS - 2º GRAU | Processos separados por `\|` | "5176281-41.2022.8.21.7000" |
| OUTROS TRIBUNAIS | Outros tribunais com indicação entre parênteses | "0710570-24.2022.8.07.0014 (TJDF)" |
| LINK DA PASTA | URL Google Drive | "https://drive.google.com/..." |
| SITUAÇÃO | Ativo/Inativo | "Ativo" |

### Dados da planilha:
- **~182 clientes** no total
- **Múltiplos processos por cliente** (alguns com 6+ processos)
- **Processos em diferentes tribunais** (TJRS 1º Grau, 2º Grau, TJDF, JFRS, VT POA)
- **Clientes ativos e inativos** a serem importados

### Exemplo de parsing de processos:

```text
Cliente: "Ademar Lunardelli"

TJRS 1º Grau: "5008779-67.2022.821.6001 | 5008243-51.2025.8.21.6001"
  → Processo 1: 5008779-67.2022.821.6001 (TJRS, 1º Grau)
  → Processo 2: 5008243-51.2025.8.21.6001 (TJRS, 1º Grau)

TJ RS 2º Grau: "5176281-41.2022.8.21.7000 | 5198232-91.2022.8.21.7000"
  → Processo 3: 5176281-41.2022.8.21.7000 (TJRS, 2º Grau)
  → Processo 4: 5198232-91.2022.8.21.7000 (TJRS, 2º Grau)

Total: 4 registros na tabela processos, todos vinculados ao mesmo lead_id
```

---

## 1. Alterações no Banco de Dados (Migração SQL)

### A) Tabela `contact_submissions` - Novos campos:

```sql
-- Link da pasta Google Drive do cliente
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS pasta_drive_url TEXT;

-- Status do cliente (ativo/inativo)
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS status_cliente TEXT DEFAULT 'ativo';

-- Estado civil (para preenchimento posterior)
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS estado_civil TEXT;

-- Endereço completo (para preenchimento posterior)
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
```

### B) Tabela `processos` - Novos campos:

```sql
-- Grau do tribunal (1º Grau, 2º Grau, Instância Superior)
ALTER TABLE processos 
ADD COLUMN IF NOT EXISTS grau_tribunal TEXT;

-- Instância específica (para organização adicional)
ALTER TABLE processos 
ADD COLUMN IF NOT EXISTS instancia TEXT;
```

---

## 2. Novo Componente: `ImportClientesPlanilhaDialog.tsx`

### Arquivo: `src/components/leads/ImportClientesPlanilhaDialog.tsx`

Dialog especializado para importar a planilha específica do B&Z com 4 etapas:
1. Upload do arquivo XLSX
2. Preview com contagem de clientes e processos
3. Progresso da importação
4. Resultado final

### Lógica de parsing:

```typescript
interface ClienteImportado {
  nome: string;
  observacao: string | null;  // Texto entre parênteses
  pastaUrl: string | null;
  situacao: 'ativo' | 'inativo';
  processos: ProcessoImportado[];
}

interface ProcessoImportado {
  numero: string;
  tribunal: string;  // TJRS, TJDF, JFRS, VT-POA
  grau: string;      // 1º Grau, 2º Grau, Outros
}

// Extração de nome e observação
function parseNomeCliente(nome: string) {
  // "Amélia Zanetti (karoline)" → { nome: "Amélia Zanetti", observacao: "karoline" }
  const match = nome.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { nome: match[1].trim(), observacao: match[2].trim() };
  }
  return { nome: nome.trim(), observacao: null };
}

// Extração de processos - CADA PROCESSO SEPARADO POR | = 1 REGISTRO
function parseProcessos(texto: string, tribunal: string, grau: string): ProcessoImportado[] {
  if (!texto || texto === '~' || texto.toLowerCase().includes('não encontrei')) return [];
  
  return texto
    .split('|')  // Separa por pipe
    .map(p => p.trim())
    .filter(p => p.match(/\d{7}-\d{2}\.\d{4}/))  // Valida formato CNJ
    .map(p => {
      // Detecta tribunal nos parênteses: "0710570-24.2022.8.07.0014 (TJDF)"
      const tribunalMatch = p.match(/\(([^)]+)\)/);
      return {
        numero: p.replace(/\([^)]+\)/g, '').trim(),
        tribunal: tribunalMatch ? tribunalMatch[1].trim() : tribunal,
        grau: tribunalMatch ? 'Outros' : grau,
      };
    });
}
```

### Fluxo de processamento da planilha:

```text
┌─────────────────────────────────────────────────────────────┐
│ PASSO 1: Upload                                             │
│ Usuário seleciona arquivo XLSX                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 2: Parse das colunas                                  │
│                                                             │
│ Para cada linha:                                            │
│   1. Extrai nome e observação da coluna CLIENTES            │
│   2. Parse TJRS 1º GRAU → split por | → N processos         │
│   3. Parse TJ RS 2º GRAU → split por | → N processos        │
│   4. Parse OUTROS TRIBUNAIS → split por | → N processos     │
│   5. Extrai link da pasta                                   │
│   6. Extrai situação (Ativo/Inativo)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 3: Preview                                            │
│                                                             │
│ 📊 182 clientes encontrados                                 │
│ ⚖️ 347 processos a serem criados                            │
│ ✅ 75 ativos | ⚪ 107 inativos                               │
│                                                             │
│ [Ver detalhes] [Importar]                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ PASSO 4: Importação                                         │
│                                                             │
│ Para cada cliente:                                          │
│   1. INSERT em contact_submissions → retorna cliente.id     │
│   2. Para cada processo do cliente:                         │
│      INSERT em processos com lead_id = cliente.id           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Novo Hook: `useImportClientesPlanilha.ts`

### Arquivo: `src/hooks/useImportClientesPlanilha.ts`

Hook para gerenciar a importação em lote:

```typescript
interface ImportResult {
  clientesCriados: number;
  processosCriados: number;
  erros: string[];
}

export function useImportClientesPlanilha() {
  return useMutation({
    mutationFn: async (clientes: ClienteImportado[]): Promise<ImportResult> => {
      const result: ImportResult = {
        clientesCriados: 0,
        processosCriados: 0,
        erros: [],
      };

      for (const cliente of clientes) {
        try {
          // 1. Criar cliente na contact_submissions
          const { data: clienteData, error: clienteError } = await supabase
            .from('contact_submissions')
            .insert({
              nome_completo: cliente.nome,
              email: '',
              telefone: '',
              tipo_processo: 'Importado',
              como_conheceu: 'importacao',
              mensagem: cliente.observacao || 'Importado da planilha B&Z',
              estagio: 'fechado',
              origem: 'outro',
              pasta_drive_url: cliente.pastaUrl,
              status_cliente: cliente.situacao,
              lgpd_consent: true,
            })
            .select()
            .single();

          if (clienteError) throw clienteError;
          result.clientesCriados++;

          // 2. Criar CADA processo separadamente
          for (const processo of cliente.processos) {
            const { error: processoError } = await supabase
              .from('processos')
              .insert({
                lead_id: clienteData.id,
                numero_processo: processo.numero,
                tipo: 'Importado',
                status: cliente.situacao === 'ativo' ? 'em_andamento' : 'arquivado',
                tribunal: processo.tribunal,
                grau_tribunal: processo.grau,
                data_inicio: new Date().toISOString().split('T')[0],
              });

            if (!processoError) {
              result.processosCriados++;
            } else {
              result.erros.push(`Processo ${processo.numero}: ${processoError.message}`);
            }
          }
        } catch (error: any) {
          result.erros.push(`Cliente ${cliente.nome}: ${error.message}`);
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['processos'] });
    },
  });
}
```

---

## 4. Mapeamento de Colunas da Planilha

| Coluna XLSX | Campo `contact_submissions` | Campo `processos` |
|-------------|----------------------------|-------------------|
| CLIENTES | `nome_completo` | - |
| (parênteses no nome) | `mensagem` (observação) | - |
| TJRS - 1º GRAU | - | `numero_processo`, `tribunal: 'TJRS'`, `grau_tribunal: '1º Grau'` |
| TJ RS - 2º GRAU | - | `numero_processo`, `tribunal: 'TJRS'`, `grau_tribunal: '2º Grau'` |
| OUTROS TRIBUNAIS | - | `numero_processo`, `tribunal: (extraído)`, `grau_tribunal: 'Outros'` |
| LINK DA PASTA | `pasta_drive_url` | - |
| SITUAÇÃO | `status_cliente`, `estagio` | `status` |

---

## 5. Tratamento de Casos Especiais

| Caso | Exemplo | Tratamento |
|------|---------|------------|
| Nome com parênteses | "Amélia Zanetti (karoline)" | Separa nome de observação |
| Dois nomes | "Carol Kunzler e Alceu Ricardo" | Mantém como nome único |
| "NÃO ENCONTREI O PROCESSO" | Camila Avellar | Ignora, não cria processo |
| "~" na coluna | Fabio Marcelo Taborda | Ignora, não cria processo |
| "não encontrei pasta" | Julia Moreira | Deixa `pasta_drive_url` null |
| Processo com tribunal nos parênteses | "0710570-24.2022.8.07.0014 (TJDF)" | Extrai TJDF como tribunal |
| Múltiplos processos por `\|` | "5008779-67... \| 5008243-51..." | Cada um = 1 registro separado |
| Processo em coluna "Procurei no eproc..." | Ceni Maria da Luz | Ignora texto, não cria processo |

---

## 6. Layout do Dialog de Importação

### Tela de Upload:

```text
┌─────────────────────────────────────────────────────────────┐
│ 📊 Importar Planilha de Clientes B&Z                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           📤 Arraste a planilha ou clique            │    │
│  │                  (formato XLSX)                      │    │
│  │                                                     │    │
│  │              [Selecionar arquivo]                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ℹ️ Formato esperado:                                       │
│  • Coluna A: CLIENTES                                       │
│  • Coluna B: TJRS - 1º GRAU                                 │
│  • Coluna C: TJ RS - 2º GRAU                                │
│  • Coluna D: OUTROS TRIBUNAIS                               │
│  • Coluna E: LINK DA PASTA                                  │
│  • Coluna F: SITUAÇÃO                                       │
│                                                             │
│  ⚠️ Processos separados por | serão cadastrados             │
│     individualmente para cada cliente                       │
└─────────────────────────────────────────────────────────────┘
```

### Tela de Preview:

```text
┌─────────────────────────────────────────────────────────────┐
│ 📊 Preview da Importação                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👥 182 clientes    ⚖️ 347 processos    ✅ 75 ativos        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Cliente              │ Processos │ Tribunais    │ Situação  │
│─────────────────────────────────────────────────────────────│
│ Ademar Lunardelli    │ 4         │ TJRS         │ 🟢 Ativo  │
│   ├─ 5008779-67.2022.821.6001 (TJRS 1º Grau)                │
│   ├─ 5008243-51.2025.8.21.6001 (TJRS 1º Grau)               │
│   ├─ 5176281-41.2022.8.21.7000 (TJRS 2º Grau)               │
│   └─ 5198232-91.2022.8.21.7000 (TJRS 2º Grau)               │
│─────────────────────────────────────────────────────────────│
│ Adriana Pacheco      │ 0         │ -            │ ⚪ Inativo│
│─────────────────────────────────────────────────────────────│
│ Airton Tonelo        │ 6         │ TJRS         │ 🟢 Ativo  │
│   ├─ 5107452-19.2023.8.21.0001 (TJRS 1º Grau)               │
│   ├─ 5085558-50.2024.8.21.0001 (TJRS 1º Grau)               │
│   ├─ ... +4 processos                                       │
│─────────────────────────────────────────────────────────────│
│ Fabio Marcelo Taborda│ 1         │ TJDF         │ 🟢 Ativo  │
│   └─ 0710570-24.2022.8.07.0014 (TJDF)                       │
├─────────────────────────────────────────────────────────────┤
│                      [Cancelar] [Importar 182 clientes]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Atualização do Header de Leads

### Arquivo: `src/components/leads/LeadsHeader.tsx`

Transformar botão "Importar" em dropdown com duas opções:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Upload className="h-4 w-4 mr-2" />
      Importar
      <ChevronDown className="h-4 w-4 ml-1" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={onImport}>
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Importar CSV/XLSX simples
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={onImportPlanilha}>
      <Table className="h-4 w-4 mr-2" />
      Importar Planilha B&Z (com processos)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 8. Atualização de Tipos

### Arquivo: `src/types/leads.ts`

Adicionar novos campos:

```typescript
export interface Lead {
  // ... campos existentes
  pasta_drive_url: string | null;   // NOVO
  status_cliente: 'ativo' | 'inativo' | null;  // NOVO
  estado_civil: string | null;      // NOVO
  endereco_completo: string | null; // NOVO
}
```

### Arquivo: `src/types/processos.ts`

Adicionar novos campos:

```typescript
export interface Processo {
  // ... campos existentes
  grau_tribunal: string | null;  // NOVO: "1º Grau", "2º Grau", "Outros"
  instancia: string | null;      // NOVO: para organização adicional
}

// Atualizar opções de tribunais
export const TRIBUNAIS_OPCOES = [
  'TJRS', 'TJSP', 'TJRJ', 'TJMG', 'TJPR', 'TJSC', 'TJBA',
  'TJDF',  // Tribunal de Justiça do DF
  'JFRS',  // Justiça Federal RS
  'VT-POA', // Vara do Trabalho POA
  'TRF-1', 'TRF-2', 'TRF-3', 'TRF-4', 'TRF-5', 'TRF-6',
  'STJ', 'STF', 'TST', 'TSE',
];
```

---

## Resumo das Alterações

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Migração SQL** | Criar | Adicionar 4 colunas em `contact_submissions` e 2 em `processos` |
| `src/components/leads/ImportClientesPlanilhaDialog.tsx` | **Criar** | Dialog especializado para importação B&Z |
| `src/hooks/useImportClientesPlanilha.ts` | **Criar** | Hook para importação em lote |
| `src/types/leads.ts` | **Atualizar** | Adicionar novos campos |
| `src/types/processos.ts` | **Atualizar** | Adicionar novos campos + tribunais |
| `src/pages/Leads.tsx` | **Atualizar** | Integrar novo dialog |
| `src/components/leads/LeadsHeader.tsx` | **Atualizar** | Dropdown de importação |

---

## Resultado Esperado

Após a importação:

1. **~182 clientes** criados na `contact_submissions` com:
   - Estágio "fechado"
   - Status "ativo" ou "inativo"
   - Link da pasta do Google Drive
   - Observações extraídas dos parênteses

2. **~347 processos** criados na tabela `processos`:
   - **Cada número separado por `|` = 1 registro individual**
   - Vinculados ao cliente correto via `lead_id`
   - Tribunal identificado (TJRS, TJDF, JFRS, VT-POA)
   - Grau do tribunal (1º Grau, 2º Grau, Outros)
   - Status baseado na situação do cliente

3. **Automação contínua**: Estrutura preparada para adicionar novos dados posteriormente

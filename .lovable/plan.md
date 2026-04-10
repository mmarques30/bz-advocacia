

## Corrigir formulário de Proposta para focar em Leads

### Problema
O formulário `GerarPropostaForm` já filtra corretamente leads não-fechados (linha 44), mas a linguagem da interface ainda referencia "cliente" em vários pontos (placeholder "Selecione o cliente", variáveis internas `clienteSelecionado`, `clienteData`, etc.), causando confusão conceitual.

### Alteração em `src/components/documentos/GerarPropostaForm.tsx`

1. **Placeholder do Select**: `"Selecione o cliente"` → `"Selecione o lead"`
2. **Exibir estágio do lead** no dropdown para contexto (ex: "João Silva - Divórcio · Novo")
3. **Renomear variáveis internas** de `clienteSelecionado`/`clienteData` para `leadSelecionado`/`leadData` para consistência semântica
4. **Adicionar texto informativo** abaixo do select explicando que propostas são geradas para leads em fase de negociação

### O que NÃO muda
- Lógica de filtro (já correta — exclui `fechado`)
- Estrutura de dados e tabelas
- Automação de status (`atualizarLeadParaPropostaEnviada`)
- PDF e preview


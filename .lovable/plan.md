Plano de ação:

1. Limpeza no banco, dentro de uma transação
   - Remover todos os registros financeiros com referência a 2026 nas tabelas operacionais, mantendo intactas as tabelas de configuração:
     - `historico_pagamentos`
     - `parcelas_financeiras`
     - `acordos_financeiros`
     - `creditos_condicionais`
     - `despesas`
     - `transacoes_financeiras`
     - `metas_mensais`
     - `financeiro` legacy, se ainda houver algo por vencimento/pagamento em 2026
   - Incluir critérios por data operacional e também por criação quando fizer sentido, para pegar resíduos que a primeira limpeza não pegou.

2. Validar antes e depois
   - Contar registros e somatórios de 2026 por tabela antes da exclusão.
   - Rodar a limpeza.
   - Contar novamente e confirmar que ficou zerado para 2026.
   - Pelo diagnóstico inicial, ainda existem 26 despesas de 2026 somando R$ 29.995,77; as fontes principais de receita de 2026 (`transacoes_financeiras`, `parcelas_financeiras`, `acordos_financeiros`) já aparecem zeradas.

3. Corrigir a causa visual da tela
   - A tela mostra o seletor global em 2026, mas a aba “Faturamento” hoje não aplica automaticamente esse ano aos KPIs/gráfico/tabela; ela mostra receitas de todos os anos quando o filtro de período interno está vazio.
   - Vou fazer o ano selecionado no topo limitar também a aba “Faturamento” para o período de 01/01/2026 a 31/12/2026, salvo quando você escolher “Todos” ou um período manual específico.
   - Isso evita aparecer “Receita Realizada” antiga enquanto o topo está em 2026.

4. Confirmação final
   - Entrego a lista de totais pós-limpeza por tabela.
   - Confirmo que o filtro 2026 da tela de Faturamento passa a mostrar zero quando não houver dados de 2026.

Objetivo: corrigir o bloqueio na emissão de contrato quando o estado civil já foi preenchido.

Implementação

1) Corrigir origem do campo de estado civil no formulário de contrato
- Arquivo: `src/components/documentos/GerarContratoForm.tsx`
- Ajustar `dadosCliente.estado_civil` para usar prioridade:
  - `clienteSelecionado.estado_civil`
  - fallback: `clienteSelecionado.situacao_atual`
- Isso elimina o falso “campo faltante” quando o dado está salvo na coluna correta.

2) Validar com dados atualizados do backend antes de emitir contrato
- Arquivo: `src/components/documentos/GerarContratoForm.tsx`
- Em `handleGerarPDF`, buscar o cliente direto no backend (`contact_submissions`) antes de validar `camposFaltantes`.
- Recalcular `dadosCliente` e `camposFaltantes` com esse snapshot atualizado.
- Só abrir `ComplementarDadosDialog` se ainda houver faltantes após essa leitura atual.
- Gerar `conteudo_final` usando os dados atualizados (não só o estado React em memória).

3) Evitar loop após “Salvar e Continuar”
- Arquivo: `src/components/documentos/ComplementarDadosDialog.tsx`
- No submit de `estado_civil`, salvar em:
  - `estado_civil` (campo principal)
  - `situacao_atual` (compatibilidade com dados legados, enquanto existir uso histórico)
- Garantir `await` completo do update antes de chamar `onComplete`.

4) Ajustar callback de continuação
- Arquivo: `src/components/documentos/GerarContratoForm.tsx`
- No `onComplete` do dialog, chamar emissão com revalidação forçada (passo 2), para não depender de refetch assíncrono de query cache.

5) Critérios de aceite
- Ao preencher estado civil no dialog e clicar “Salvar e Continuar”, o contrato deve avançar sem reabrir o modal.
- Se estado civil já estiver salvo previamente no lead, o dialog não deve abrir.
- Emissão deve funcionar tanto para registros antigos (`situacao_atual`) quanto novos (`estado_civil`).

Detalhes técnicos
- Causa raiz identificada:
  - mismatch de campos: validação usa `situacao_atual`, salvamento do dialog usa `estado_civil`.
  - corrida de estado: emissão é reexecutada com dados React possivelmente desatualizados logo após salvar.
- Evidência no banco: existem registros com `estado_civil` preenchido e `situacao_atual` vazio, confirmando o desalinhamento.

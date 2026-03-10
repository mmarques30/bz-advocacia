

## Problema

A máscara de telefone no `EscritorioForm` é fixa como `(99) 99999-9999` (celular, 9 dígitos). O número do escritório `(51) 9339-8924` tem 8 dígitos (fixo), então a máscara não fecha — fica `(51) 93398-924_`.

## Solução

Trocar a máscara fixa por uma **máscara dinâmica** que detecta o número de dígitos:
- Se o 3º dígito for 9 → celular: `(99) 99999-9999`  
- Senão → fixo: `(99) 9999-9999`

Alternativamente (mais simples e robusto): **remover a máscara** do campo telefone do escritório e usar um `Input` normal com placeholder `(51) 9339-8924`, já que telefones de escritório podem ter formatos variados (fixo, celular, com ramal, etc.).

### Arquivo alterado
- `src/components/configuracoes/EscritorioForm.tsx` — substituir o `InputMask` do telefone por um `Input` simples, ou implementar máscara dinâmica




## Ajustar overlay escuro para cobrir toda a imagem na proposta

### Alterações

**1. `src/components/documentos/PropostaPreview.tsx` (linha 63)**
- Mudar o gradiente de `from-black/70 via-black/40 to-black/10` para `from-black/70 via-black/50 to-black/40` — cobrindo toda a imagem com sombreado uniforme, mais forte embaixo para legibilidade do texto.

**2. `src/components/documentos/PropostaPDF.tsx` (linhas 36-41)**
- Mudar `page1Overlay` de `height: '70%'` e `bottom: 0` para `height: '100%'` e `top: 0`, cobrindo a imagem inteira no PDF também.




## Reformular Página 1 da Proposta — Imagem de fundo integrada

### Alterações

1. **Copiar imagem** `user-uploads://IMG_8296.jpg` para `src/assets/advogadas-bz.png` (substituir a atual)

2. **`src/components/documentos/PropostaPDF.tsx`** — Página 1:
   - Remover layout split (45% imagem / 55% texto)
   - Imagem ocupa 100% da página como fundo (full bleed)
   - Overlay escuro semi-transparente sobre a imagem (gradiente de baixo para cima)
   - Texto posicionado na metade direita/inferior sobre o overlay
   - Título "Muito prazer, somos Borges & Zembruski Advocacia" em branco
   - Subtítulo "Escuta ativa, Advocacia Artesanal" em branco/dourado
   - Texto institucional em branco com opacidade
   - Usar position absolute para empilhar imagem + overlay + texto

3. **`src/components/documentos/PropostaPreview.tsx`** — Página 1:
   - Mesmo conceito: imagem como background com `object-fit: cover`
   - Overlay com gradiente via CSS (`bg-gradient-to-t from-black/70 to-black/20`)
   - Texto em branco posicionado sobre a imagem (absolute positioning)
   - Resultado visual elegante e integrado

### Resultado
Página 1 terá a foto das advogadas como fundo de página inteira, com gradiente escuro e texto institucional sobreposto em branco — visual profissional e integrado, sem a divisão quadrada atual.


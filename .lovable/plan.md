

## Plano: Adicionar aba "Escritório" na página Cadastros

O formulário de configurações do escritório (`EscritorioForm`) já existe com todos os campos necessários (nome, CNPJ, OAB, telefone, email, endereço, logo, redes sociais). Ele só não está acessível — não há link nem rota para chegar nele.

### Solução

Adicionar uma terceira aba **"Escritório"** na página `Cadastros.tsx` (Configurações → Cadastros), ao lado de "Meu Perfil" e "Usuários".

### Arquivo alterado

**`src/pages/configuracoes/Cadastros.tsx`**:
- Importar `Building2` do lucide-react e `EscritorioForm` do componente existente
- Adicionar `TabsTrigger` "Escritório" com ícone `Building2`
- Adicionar `TabsContent` que renderiza `<EscritorioForm />`

### Resultado

Ao acessar **Configurações → Cadastros → Escritório**, você poderá preencher:
- Nome do escritório: "Borges & Zembruski Advocacia"
- OAB: "OAB/RS 83.345" (ou ambas)
- Telefone: (51) 9339-8924
- Endereço: Av. Ipiranga, 7464, sala 416
- Cidade: Porto Alegre, Estado: RS

Esses dados serão automaticamente usados nas variáveis dos templates de WhatsApp (`{{nome_escritorio}}`, `{{telefone_escritorio}}`, etc.).


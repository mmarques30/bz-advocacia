

# Plano: Atualizar CPFs dos Clientes Importados

## Objetivo
Cadastrar os CPFs de todos os clientes importados da planilha B&Z no banco de dados, associando corretamente pelo nome do cliente.

## Análise dos Dados

### Planilha Excel
- **Total de clientes**: 182 registros
- **Clientes COM CPF na planilha**: ~95 clientes
- **Clientes SEM CPF**: ~87 clientes (campos vazios)

### Banco de Dados (contact_submissions)
- Todos os clientes importados estão com `cpf = null`
- Clientes estão com `estagio = 'fechado'`
- Match será feito pelo campo `nome_completo`

## Mapeamento de CPFs

A planilha contém CPFs no formato numérico (ex: `97833770000`, `17733073049`). Alguns pontos importantes:

1. **Nomes com observações entre parênteses**: Na importação, observações foram removidas
   - Planilha: "Amélia Zanetti (karoline)" → Banco: "Amélia Zanetti"
   - Planilha: "Bianca Schuller (Pedro)" → Banco: "Bianca Schuller"

2. **CPFs variam entre CPF (11 dígitos) e CNPJ (14 dígitos)**
   - CPF: `97833770000` (11 dígitos)
   - CNPJ: `42082795000174` (14 dígitos para CB Move)

3. **Clientes sem CPF serão ignorados** (não há dado para atualizar)

## Estratégia de Implementação

Criarei um script SQL que:
1. Faz UPDATE direto na tabela `contact_submissions`
2. Usa `nome_completo` como chave de match (com tratamento para nomes com observações)
3. Formata CPF/CNPJ para o padrão brasileiro

## Detalhamento Técnico

### Script SQL de Atualização

Será executado via ferramenta de migração do Supabase:

```sql
-- Atualizar CPFs dos clientes importados
UPDATE contact_submissions SET cpf = '978.337.700-00' WHERE nome_completo = 'Adem Campão Rodrigues Júnior' AND estagio = 'fechado';
UPDATE contact_submissions SET cpf = '177.330.730-49' WHERE nome_completo = 'Ademar Lunardelli' AND estagio = 'fechado';
UPDATE contact_submissions SET cpf = '899.389.500-78' WHERE nome_completo = 'Adriana Pacheco' AND estagio = 'fechado';
-- ... continua para todos os clientes com CPF na planilha
```

### Lista Completa de Atualizações

| Nome | CPF/CNPJ (formatado) |
|------|---------------------|
| Adem Campão Rodrigues Júnior | 978.337.700-00 |
| Ademar Lunardelli | 177.330.730-49 |
| Adriana Pacheco | 899.389.500-78 |
| Airton Tonelo | 309.949.690-15 |
| Aline Michelon Rizzi | 010.202.060-47 |
| Alvaro Marcelo Martins de Oliveira | 897.747.790-53 |
| Amanda Biachi Simon da Silva | 025.876.340-08 |
| Amélia Zanetti | 252.188.080-91 |
| Ana Esmeralda de Quevedo | 342.777.570-49 |
| Artur Fernando Wagner | 135.148.300-53 |
| Assis Marques de Vasconcellos | 827.730.090-53 |
| Bianca Sattler | 036.970.340-57 |
| Bianca Schuller | 719.739.230-68 |
| Camila Avellar | 837.016.800-00 |
| Carol Kunzler e Alceu Ricardo | 432.872.710-91 |
| CB Move - Charlene | 42.082.795/0001-74 (CNPJ) |
| Ceni Maria da Luz Correia | 954.761.990-04 |
| Cintia Demoliner | 012.725.890-64 |
| Cintia Pimentel da Silva | 975.101.140-04 |
| Darlan Garcia da Silva | 028.111.410-22 |
| Debora Secchi | 005.132.740-65 |
| Denise Leão | 817.244.200-97 |
| Dennis Rimoli Machado | 017.206.500-39 |
| Elaine Flores da Silva | 738.969.850-00 |
| Elizabete Homrich e Silvano Homrich | 278.927.780-04 |
| Eraldo Luiz Perin | 270.166.840-91 |
| Fabio Duarte Stumpf | 987.624.780-87 |
| Fabio Marcelo Taborda | 929.357.610-49 |
| Gabriel Braga Sampaio | 137.181.067-28 |
| Gabriela da Silva Nodari | 023.332.290-63 |
| Geovane Rosa Ferreira | 023.052.120-70 |
| Germano Daniel Iserhard | 368.274.360-04 |
| Giane Alves Santos | 005.313.970-41 |
| Giovani Facchin | 251.961.700-49 |
| Helena Maria Bom | 527.496.810-49 |
| Isabela Stefanny da Rosa Oliveira | 872.194.760-00 |
| Jalma Mariculi Soares | 001.649.440-79 |
| João Francisco do Carmo | 502.607.820-68 |
| Joaquim de Oliveira Borges | 056.591.670-04 |
| Josiara | 014.569.430-57 |
| Josué Schostack e Rebecca Schostack | 151.535.920-49 |
| Joyce Silva | 009.793.730-42 |
| Julio Cezar Saquete | 199.617.660-91 |
| Kaquini Athayde dos Santos Martins | 017.341.879-13 |
| Karen Viviane Brito de Oliveira | 860.083.660-34 |
| Ketlyn Priscila dos Santos/Erika Eduarda | 028.309.580-63 |
| Lauren Boeira, Elba Fargas e Vitor | 943.672.210-91 |
| Leda Jeremias | 057.729.849-69 |
| Lenice Lutckmeier e Carlos Andre | 284.013.520-53 |
| Leoni Flores | 945.889.880-34 |
| Lia Mailander | 607.393.470-04 |
| Liberia Gutterres | 909.970.180-20 |
| Lilia Mercedes Silva | 560.173.240-04 |
| Liria Janaína Muller | 916.312.380-00 |
| Luiz Fabrício Almeida | 868.685.780-91 |
| Lourdes Elena Fritz | 286.354.500-00 |
| Luciane Oliveira Mangia | 808.279.500-04 |
| Marcia Silvana da Silva | 625.765.500-53 |
| Maria da Graça Garbini | 168.128.670-04 |
| Maria de Fátima Pereira | 651.929.900-68 |
| Maria Isabel de Azevedo | 001.208.300-35 |
| Maria Helena Mendes Hofmeister | 920.189.630-15 |
| Maria Luiza Amaral da Rosa | 198.067.100-10 |
| Maria Zélia Bimkowski | 241.436.500-53 |
| Marilaine Martins da Silveira | 429.954.000-00 |
| Marilene Amado Severo | 286.402.920-00 |
| Marlene de Mello Bica | 289.980.140-68 |
| Marina Mello Lima BB | 547.488.950-04 |
| Neiva Ongaratto | 609.297.070-87 |
| Priscila Gomes de Aguiar | 024.613.340-64 |
| Rafael Silveira da Silva | 004.838.270-10 |
| Rafaela Alessandra Duarte de Araujo | 890.193.500-72 |
| Rafaela Vargas de Oliveira | 812.629.490-68 |
| Reus Rogerio dos Santos Guedes | 606.317.320-04 |
| Ricardo Pufal | 262.067.060-87 |
| Rita Ferreira | 533.774.600-63 |
| Rodrigo Faggiano | 980.306.710-91 |
| Rodrigo Neto | 929.679.570-20 |
| Roger Souza Marques/ Mary | 862.355.080-34 |
| Ronaldo Renck | 564.064.520-20 |
| Rosalinda Pasini/Tamara | 176.182.740-53 |
| Roseane Rocha e Luciano Moreira | 900.342.600-72 |
| Roselia Portella Lewis | 369.002.140-53 |
| Silvano Homrich | 553.339.150-91 |
| Thais Regina Lorenzatto de Lima | 032.226.530-46 |
| Tiago Meurer Brum | 001.753.920-05 |
| Vanessa Garcia Rodrigues | 819.320.810-20 |
| Victor Hugo Sartori | 264.053.770-91 |
| Victoria Caroline Vaz Schutze | 032.887.950-94 |

## Arquivos/Ações

| Ação | Descrição |
|------|-----------|
| Migração SQL | Script UPDATE para 86 clientes com CPF |

## Considerações

1. **Match por nome**: Alguns nomes podem ter variações leves (acentos, espaços)
2. **Formato CPF**: Será salvo já formatado (XXX.XXX.XXX-XX)
3. **CNPJ**: CB Move será salvo no formato CNPJ (XX.XXX.XXX/XXXX-XX)
4. **Clientes sem CPF**: ~87 clientes permanecerão sem CPF (não há dado na planilha)

## Benefícios

1. **Dados completos**: Clientes terão CPF para geração de contratos/propostas
2. **Documentos legais**: Contratos serão gerados com identificação correta
3. **Consistência**: Base de dados alinhada com planilha original


import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransacoesExternas, TransacoesFilters } from "@/hooks/useTransacoesExternas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search } from "lucide-react";

export function TransacoesExternasTable() {
  const [filters, setFilters] = useState<TransacoesFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { data: transacoes, isLoading } = useTransacoesExternas(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredTransacoes = transacoes?.filter(t => 
    !searchTerm || 
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subcategoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subcategorias = [...new Set(transacoes?.map(t => t.subcategoria).filter(Boolean))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transações do Banco Externo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select
            value={filters.tipo || "all"}
            onValueChange={(v) => setFilters(f => ({ ...f, tipo: v === "all" ? undefined : v as 'receita' | 'despesa' }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.categoria || "all"}
            onValueChange={(v) => setFilters(f => ({ ...f, categoria: v === "all" ? undefined : v }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pf">PF</SelectItem>
              <SelectItem value="pj">PJ</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.subcategoria || "all"}
            onValueChange={(v) => setFilters(f => ({ ...f, subcategoria: v === "all" ? undefined : v }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {subcategorias.map(sub => (
                <SelectItem key={sub} value={sub!}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Subcategoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredTransacoes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada. Clique em "Sincronizar Dados" para importar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransacoes?.slice(0, 50).map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell>
                      {format(new Date(transacao.data_transacao), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {transacao.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transacao.tipo === 'receita' ? 'default' : 'destructive'}>
                        {transacao.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transacao.categoria?.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{transacao.subcategoria || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {transacao.tipo === 'despesa' ? '-' : ''}{formatCurrency(transacao.valor)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredTransacoes && filteredTransacoes.length > 50 && (
          <p className="text-sm text-muted-foreground mt-2">
            Mostrando 50 de {filteredTransacoes.length} transações
          </p>
        )}
      </CardContent>
    </Card>
  );
}

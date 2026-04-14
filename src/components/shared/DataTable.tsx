import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free DataTable built on top of the existing
 * shadcn Table primitive. Designed to replace the dozens of bespoke
 * table implementations across the app (UsuariosTable, ChannelComparisonTable,
 * etc.) without pulling in @tanstack/react-table.
 *
 * Features:
 *   - Generic `columns` declaration with custom cell renderers.
 *   - Optional client-side text search across "searchable" columns.
 *   - Optional column-based sorting.
 *   - Optional client-side pagination.
 *
 * It is intentionally CONSERVATIVE: existing tables continue to work
 * untouched. Migrate one table at a time when convenient.
 */

export interface DataTableColumn<T> {
  /** Stable id, also used as default sort key. */
  id: string;
  /** Header label rendered in the <th>. */
  header: React.ReactNode;
  /** Cell renderer; default reads `row[id]` if it's a key of T. */
  cell?: (row: T) => React.ReactNode;
  /** Used by the search input to match cell contents. */
  searchable?: boolean;
  /** Allow header click to sort by this column (uses `sortValue` or cell text). */
  sortable?: boolean;
  /** Custom value to compare on sort; defaults to row[id]. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Tailwind class applied to the <th>/<td> for width/alignment. */
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Stable React key per row; defaults to index. */
  rowKey?: (row: T, index: number) => React.Key;
  /** Optional click handler for an entire row. */
  onRowClick?: (row: T) => void;
  /** Search box placeholder. Pass `null` to hide the search box. */
  searchPlaceholder?: string | null;
  /** Page size for client-side pagination. Pass 0 to disable. */
  pageSize?: number;
  /** Shown when `data` is empty (or filtered to empty). */
  emptyMessage?: React.ReactNode;
  className?: string;
}

type SortState = { columnId: string; direction: "asc" | "desc" } | null;

function defaultCell<T>(row: T, id: string): React.ReactNode {
  const v = (row as Record<string, unknown>)[id];
  if (v == null) return "";
  if (v instanceof Date) return v.toLocaleDateString("pt-BR");
  return String(v);
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR");
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  searchPlaceholder = "Buscar...",
  pageSize = 25,
  emptyMessage = "Nenhum resultado encontrado.",
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(0);

  const searchableCols = React.useMemo(
    () => columns.filter((c) => c.searchable),
    [columns],
  );

  const filtered = React.useMemo(() => {
    if (!search.trim() || searchableCols.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchableCols.some((c) => {
        const text = c.cell ? c.cell(row) : defaultCell(row, c.id);
        return String(text ?? "").toLowerCase().includes(q);
      }),
    );
  }, [data, search, searchableCols]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col) return filtered;
    const getValue = col.sortValue
      ? col.sortValue
      : (row: T) => (row as Record<string, unknown>)[col.id];
    const sgn = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => sgn * compare(getValue(a), getValue(b)));
  }, [filtered, sort, columns]);

  const effectivePageSize = pageSize > 0 ? pageSize : sorted.length || 1;
  const totalPages = Math.max(1, Math.ceil(sorted.length / effectivePageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = pageSize > 0
    ? sorted.slice(safePage * effectivePageSize, (safePage + 1) * effectivePageSize)
    : sorted;

  React.useEffect(() => {
    setPage(0);
  }, [search, sort]);

  const toggleSort = (colId: string) => {
    setSort((prev) => {
      if (!prev || prev.columnId !== colId) return { columnId: colId, direction: "asc" };
      if (prev.direction === "asc") return { columnId: colId, direction: "desc" };
      return null;
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {searchPlaceholder !== null && searchableCols.length > 0 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-sm"
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.id} className={c.className}>
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.id)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.header}
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, i) => (
                <TableRow
                  key={rowKey ? rowKey(row, i) : i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {columns.map((c) => (
                    <TableCell key={c.id} className={c.className}>
                      {c.cell ? c.cell(row) : defaultCell(row, c.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {safePage + 1} de {totalPages} · {sorted.length} registro(s)
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

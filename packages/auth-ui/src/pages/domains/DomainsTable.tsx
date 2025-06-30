import { useMemo } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

type Domain = components['schemas']['domain'];
type SortField = 'domain';
type SortDirection = 'asc' | 'desc';

interface DomainsTableProps {
  domains: Domain[];
  onSort: (field: SortField) => void;
  sortDirection: (field: SortField) => SortDirection | null;
}

export const DomainsTable = ({ domains, onSort, sortDirection }: DomainsTableProps) => {
  const columns: ColumnDef<Domain>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: () => {
          const currentSort = sortDirection('domain');
          return (
            <Button variant="ghost" onClick={() => onSort('domain')}>
              Name
              {currentSort === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : currentSort === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
      },
    ],
    [onSort, sortDirection]
  );

  const table = useReactTable({
    data: domains,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="h-full flex flex-col">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No domains found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

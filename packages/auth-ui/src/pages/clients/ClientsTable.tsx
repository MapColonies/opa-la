import { useMemo } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Pencil, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, Row } from '@tanstack/react-table';

type Client = components['schemas']['client'];
type SortField = 'created-at' | 'updated-at' | 'name' | 'heb-name' | 'branch';
type SortDirection = 'asc' | 'desc';

interface ClientsTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onSort: (field: SortField) => void;
  sortDirection: (field: SortField) => SortDirection | null;
}

export const ClientsTable = ({ clients, onEditClient, onSort, sortDirection }: ClientsTableProps) => {
  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: () => {
          const currentSort = sortDirection('name');
          return (
            <Button variant="ghost" onClick={() => onSort('name')}>
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
      {
        accessorKey: 'hebName',
        header: () => {
          const currentSort = sortDirection('heb-name');
          return (
            <Button variant="ghost" onClick={() => onSort('heb-name')}>
              Hebrew Name
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
      {
        accessorKey: 'description',
        header: 'Description',
      },
      {
        accessorKey: 'branch',
        header: () => {
          const currentSort = sortDirection('branch');
          return (
            <Button variant="ghost" onClick={() => onSort('branch')}>
              Branch
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
      {
        accessorKey: 'createdAt',
        header: () => {
          const currentSort = sortDirection('created-at');
          return (
            <Button variant="ghost" onClick={() => onSort('created-at')}>
              Created At
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
        cell: ({ row }: { row: Row<Client> }) => {
          const date = new Date(row.original.createdAt);
          return (
            <span>
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: () => {
          const currentSort = sortDirection('updated-at');
          return (
            <Button variant="ghost" onClick={() => onSort('updated-at')}>
              Updated At
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
        cell: ({ row }: { row: Row<Client> }) => {
          const date = new Date(row.original.updatedAt);
          return (
            <span>
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }: { row: Row<Client> }) => {
          const tags = row.original.tags || [];
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }: { row: Row<Client> }) => {
          const client = row.original;
          return (
            <Button variant="ghost" size="sm" onClick={() => onEditClient(client)}>
              <Pencil className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [onEditClient, onSort, sortDirection]
  );

  const table = useReactTable({
    data: clients,
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
                No clients found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

import { useState, useMemo } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Pencil, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '../../components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getSortedRowModel, SortingState, Column } from '@tanstack/react-table';

type Connection = components['schemas']['connection'];

interface ConnectionsTableProps {
  connections: Connection[];
  onEditConnection: (connection: Connection) => void;
}

export const ConnectionsTable = ({ connections, onEditConnection }: ConnectionsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Connection>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }: { column: Column<Connection> }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Name
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
      },
      {
        accessorKey: 'environment',
        header: ({ column }: { column: Column<Connection> }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Environment
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const env = row.original.environment;
          return <Badge variant={env === 'prod' ? 'destructive' : env === 'stage' ? 'secondary' : 'default'}>{env}</Badge>;
        },
      },
      {
        accessorKey: 'version',
        header: ({ column }: { column: Column<Connection> }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Version
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
      },
      {
        accessorKey: 'enabled',
        header: ({ column }: { column: Column<Connection> }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
              Status
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const enabled = row.original.enabled;
          return <Badge variant={enabled ? 'outline' : 'secondary'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>;
        },
      },
      {
        accessorKey: 'domains',
        header: 'Domains',
        cell: ({ row }) => {
          const domains = row.original.domains || [];
          return (
            <div className="flex flex-wrap gap-1">
              {domains.map((domain: string) => (
                <Badge key={domain} variant="outline">
                  {domain}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'origins',
        header: 'Origins',
        cell: ({ row }) => {
          const origins = row.original.origins || [];
          return (
            <div className="flex flex-wrap gap-1">
              {origins.map((origin: string) => (
                <Badge key={origin} variant="outline">
                  {origin}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const connection = row.original;
          return (
            <Button variant="ghost" size="sm" onClick={() => onEditConnection(connection)}>
              <Pencil className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [onEditConnection]
  );

  const table = useReactTable({
    data: connections,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
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
                No connections found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableCaption className="mt-4 mb-2">A list of your connections and their configurations.</TableCaption>
      </Table>
    </div>
  );
};

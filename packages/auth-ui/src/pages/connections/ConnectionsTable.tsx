import { useState, useMemo } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Pencil, ArrowUpDown, ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '../../components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, Column } from '@tanstack/react-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { toast } from 'sonner';

type Connection = components['schemas']['connection'];
type SortField = 'created-at' | 'name' | 'version' | 'enabled' | 'environment';
type SortDirection = 'asc' | 'desc';

const CopyTokenButton = ({ token }: { token: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setIsCopied(true);
      toast.success('Token copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy token');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleCopyToken} className={isCopied ? 'text-green-500' : ''}>
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isCopied ? 'Copied!' : 'Copy token'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ConnectionsTableProps {
  connections: Connection[];
  onEditConnection: (connection: Connection) => void;
  onSort: (field: SortField) => void;
  sortDirection: (field: SortField) => SortDirection | null;
}

export const ConnectionsTable = ({ connections, onEditConnection, onSort, sortDirection }: ConnectionsTableProps) => {
  const columns: ColumnDef<Connection>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }: { column: Column<Connection> }) => {
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
        accessorKey: 'environment',
        header: ({ column }: { column: Column<Connection> }) => {
          const currentSort = sortDirection('environment');
          return (
            <Button variant="ghost" onClick={() => onSort('environment')}>
              Environment
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
        cell: ({ row }) => {
          const env = row.original.environment;
          return <Badge variant={env === 'prod' ? 'destructive' : env === 'stage' ? 'secondary' : 'default'}>{env}</Badge>;
        },
      },
      {
        accessorKey: 'version',
        header: ({ column }: { column: Column<Connection> }) => {
          const currentSort = sortDirection('version');
          return (
            <Button variant="ghost" onClick={() => onSort('version')}>
              Version
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
        accessorKey: 'enabled',
        header: ({ column }: { column: Column<Connection> }) => {
          const currentSort = sortDirection('enabled');
          return (
            <Button variant="ghost" onClick={() => onSort('enabled')}>
              Status
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
            <div className="flex gap-2">
              <CopyTokenButton token={connection.token} />
              <Button variant="ghost" size="sm" onClick={() => onEditConnection(connection)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEditConnection, onSort, sortDirection]
  );

  const table = useReactTable({
    data: connections,
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
                No connections found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

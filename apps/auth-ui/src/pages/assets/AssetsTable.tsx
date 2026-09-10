import type { components } from 'auth-openapi';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import type { AssetSortField, SortDirection } from './sorting';

type Asset = components['schemas']['asset'];

interface AssetsTableProps {
  assets: Asset[];
  onSort: (field: AssetSortField) => void;
  sortDirection: (field: AssetSortField) => SortDirection | null;
}

const COLUMNS: { field: AssetSortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'version', label: 'Version' },
  { field: 'type', label: 'Type' },
  { field: 'environment', label: 'Environments' },
  { field: 'isTemplate', label: 'Template' },
  { field: 'uri', label: 'URI' },
  { field: 'createdAt', label: 'Created' },
];

export const AssetsTable = ({ assets, onSort, sortDirection }: AssetsTableProps) => {
  const headers = useMemo(
    () =>
      COLUMNS.map(({ field, label }) => {
        const direction = sortDirection(field);
        return (
          <TableHead key={field}>
            <Button variant="ghost" onClick={() => onSort(field)}>
              {label}
              {direction === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : direction === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </TableHead>
        );
      }),
    [onSort, sortDirection]
  );

  return (
    <div className="h-full flex flex-col">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>{headers}</TableRow>
        </TableHeader>
        <TableBody>
          {assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length} className="h-24 text-center">
                No assets found.
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => (
              <TableRow key={asset.name}>
                <TableCell className="font-medium">
                  <Link to={`/assets/${encodeURIComponent(asset.name)}`} className="hover:underline">
                    {asset.name}
                  </Link>
                </TableCell>
                <TableCell>{asset.version}</TableCell>
                <TableCell>
                  <Badge variant="outline">{asset.type}</Badge>
                </TableCell>
                <TableCell>
                  <EnvironmentBadges environments={asset.environment} />
                </TableCell>
                <TableCell>
                  {asset.isTemplate ? <Badge variant="secondary">Template</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {/* Kept off the row's critical width, with the full value one hover away. */}
                  <span className="block max-w-[16rem] truncate text-muted-foreground" title={asset.uri}>
                    {asset.uri}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatCreatedAt(asset.createdAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

/** An asset targeting nothing reaches no bundle, so the gap is marked rather than left blank. */
const EnvironmentBadges = ({ environments }: { environments: Asset['environment'] }) =>
  environments.length === 0 ? (
    <Badge variant="destructive">No environments</Badge>
  ) : (
    <div className="flex flex-wrap gap-1">
      {environments.map((environment) => (
        <Badge key={environment} variant="secondary">
          {environment}
        </Badge>
      ))}
    </div>
  );

const formatCreatedAt = (createdAt: string): string => {
  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? createdAt : parsed.toLocaleString();
};

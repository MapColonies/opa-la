import type { components } from 'auth-openapi';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { formatTimestamp } from '../../lib/utils';

type Bundle = components['schemas']['bundle'];

interface BundlesTableProps {
  bundles: Bundle[];
}

const COLUMNS = ['Created At', 'Environment', 'Revision', 'OPA Version', 'Id'];

export const BundlesTable = ({ bundles }: BundlesTableProps) => (
  <div className="h-full flex flex-col">
    <Table>
      <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow>
          {COLUMNS.map((label) => (
            <TableHead key={label}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bundles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMNS.length} className="h-24 text-center">
              No bundles found.
            </TableCell>
          </TableRow>
        ) : (
          bundles.map((bundle) => (
            <TableRow key={bundle.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{bundle.createdAt ? formatTimestamp(bundle.createdAt) : '—'}</TableCell>
              <TableCell>
                <Badge variant={bundle.environment === 'prod' ? 'destructive' : bundle.environment === 'stage' ? 'secondary' : 'default'}>
                  {bundle.environment}
                </Badge>
              </TableCell>
              <TableCell>{bundle.revision}</TableCell>
              <TableCell>{bundle.opaVersion}</TableCell>
              <TableCell>{bundle.id}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

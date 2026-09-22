import type { components } from 'auth-openapi';
import { Badge } from '../../components/ui/badge';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';

type Bundle = components['schemas']['bundle'];

interface BundleDetailsModalProps {
  bundle: Bundle;
}

export const BundleDetailsModal = ({ bundle }: BundleDetailsModalProps) => (
  // A bundle's assets/connections lists have no upper bound in practice, so the header
  // (and its close button) stays outside the scrolling area rather than scrolling away
  // with a long list.
  <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>Bundle {bundle.id}</DialogTitle>
      <DialogDescription>
        {bundle.environment} · {bundle.revision}
      </DialogDescription>
    </DialogHeader>

    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Hash" value={bundle.hash} />
        <Field label="Key version" value={bundle.keyVersion?.toString()} />
      </div>

      <BundleEntryList title="Assets" emptyLabel="No assets" entries={bundle.assets} />
      <BundleEntryList title="Connections" emptyLabel="No connections" entries={bundle.connections} />

      <div>
        <h3 className="mb-2 text-sm font-medium">Metadata</h3>
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">{JSON.stringify(bundle.metadata ?? {}, null, 2)}</pre>
      </div>
    </div>
  </DialogContent>
);

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="break-all text-sm">{value ?? '—'}</p>
  </div>
);

const BundleEntryList = ({ title, emptyLabel, entries }: { title: string; emptyLabel: string; entries?: { name: string; version: number }[] }) => (
  <div>
    <h3 className="mb-2 text-sm font-medium">{title}</h3>
    {entries && entries.length > 0 ? (
      // Bounded and independently scrollable: a bundle can carry hundreds of these, and
      // the list shouldn't force scrolling past everything else to reach what follows it.
      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
        {entries.map((entry, index) => (
          // The index guards against a duplicate name+version pair; the API contract
          // marks this array uniqueItems, but nothing enforces that at this layer.
          <li key={`${index}-${entry.name}-${entry.version}`} className="flex items-center gap-2 text-sm">
            <span>{entry.name}</span>
            <Badge variant="outline">v{entry.version}</Badge>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    )}
  </div>
);

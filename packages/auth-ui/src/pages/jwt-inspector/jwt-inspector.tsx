import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { JsonTreeViewer } from '../../components/internal/json-tree-viewer';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface JWTPayload {
  [key: string]: JsonValue;
}

export function JWTInspectorPage() {
  const [token, setToken] = useState('');
  const [decodedPayload, setDecodedPayload] = useState<JWTPayload | null>(null);

  const decodeJWT = (token: string): JWTPayload => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const base64Url = parts[1];
      if (!base64Url) {
        throw new Error('Invalid JWT format');
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  };

  const handleInspect = () => {
    try {
      if (!token) {
        toast.error('Please enter a JWT token');
        return;
      }

      const payload = decodeJWT(token);
      setDecodedPayload(payload);
      toast.success('JWT token decoded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to decode JWT token');
      setDecodedPayload(null);
    }
  };

  const copyToClipboard = () => {
    if (decodedPayload) {
      const formattedJson = JSON.stringify(decodedPayload, null, 2);
      navigator.clipboard
        .writeText(formattedJson)
        .then(() => {
          toast.success('Payload copied to clipboard');
        })
        .catch(() => {
          toast.error('Failed to copy to clipboard');
        });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>JWT Inspector</CardTitle>
          <CardDescription>Paste your JWT token to inspect its payload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your JWT token here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="min-h-[100px] font-mono"
            />
            <Button onClick={handleInspect}>Inspect Token</Button>

            {decodedPayload && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Decoded Payload:</h3>
                <div className="relative">
                  <JsonTreeViewer data={decodedPayload} />
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="absolute top-2 right-2 flex items-center gap-1">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

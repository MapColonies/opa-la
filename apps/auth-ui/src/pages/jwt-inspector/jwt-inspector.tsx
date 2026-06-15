import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { JsonTreeViewer } from '../../components/internal/json-tree-viewer';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface JWTPayload {
  [key: string]: JsonValue;
}

const STORAGE_KEY = 'jwt-inspector-token';

export function JWTInspectorPage() {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY);
    return savedToken || '';
  });
  const [decodedHeaders, setDecodedHeaders] = useState<JWTPayload | null>(null);
  const [decodedPayload, setDecodedPayload] = useState<JWTPayload | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, token);
  }, [token]);

  const decodeJWT = (token: string): { headers: JWTPayload; payload: JWTPayload } => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const base64UrlHeader = parts[0];
      const base64UrlPayload = parts[1];

      if (!base64UrlHeader || !base64UrlPayload) {
        throw new Error('Invalid JWT format');
      }

      const base64Header = base64UrlHeader.replace(/-/g, '+').replace(/_/g, '/');
      const base64Payload = base64UrlPayload.replace(/-/g, '+').replace(/_/g, '/');

      const jsonHeader = decodeURIComponent(
        atob(base64Header)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const jsonPayload = decodeURIComponent(
        atob(base64Payload)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return {
        headers: JSON.parse(jsonHeader),
        payload: JSON.parse(jsonPayload),
      };
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  };

  useEffect(() => {
    if (token.trim()) {
      try {
        const { headers, payload } = decodeJWT(token);
        setDecodedHeaders(headers);
        setDecodedPayload(payload);
      } catch (error) {
        setDecodedHeaders(null);
        setDecodedPayload(null);
      }
    } else {
      setDecodedHeaders(null);
      setDecodedPayload(null);
    }
  }, [token]);

  const copyToClipboard = (data: JWTPayload, section: string) => {
    const formattedJson = JSON.stringify(data, null, 2);
    navigator.clipboard
      .writeText(formattedJson)
      .then(() => {
        toast.success(`${section} copied to clipboard`);
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">JWT Inspector</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your JWT token here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="min-h-[100px] font-mono"
            />

            {decodedHeaders && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Headers:</h3>
                <div className="relative">
                  <JsonTreeViewer initialTheme="light" data={decodedHeaders} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(decodedHeaders, 'Headers')}
                    className="absolute top-2 right-2 flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {decodedPayload && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Payload:</h3>
                <div className="relative">
                  <JsonTreeViewer initialTheme="light" data={decodedPayload} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(decodedPayload, 'Payload')}
                    className="absolute top-2 right-2 flex items-center gap-1"
                  >
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

import { useState, useEffect } from 'react';
import { $api } from '@/lib/http-client';
import { TokenCard } from '@/components/token';
import { Shield, X, Lock, CheckCircle } from 'lucide-react';

export function MainPage() {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isCustomLoading, setIsCustomLoading] = useState(false);

  // Use React Query for token fetching
  const { data: tokenData, isError, error, refetch, isFetching } = $api.useQuery('get', '/token', undefined, { enabled: false });

  // Use custom loading state that includes our artificial delay
  const isLoading = isCustomLoading || isFetching;

  // Simulate progress bar for UX when fetching
  useEffect(() => {
    let active = true;
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      setProgress(0);
      (async () => {
        // Simulate a more realistic loading experience
        const steps = 20; // More granular progress
        const minDuration = 1500; // Minimum 1.5 seconds for better UX
        const stepDuration = minDuration / steps;

        for (let i = 1; i <= steps; i++) {
          if (!active) return;

          // Use exponential easing for more natural progress
          const easedProgress = Math.min(95, Math.pow(i / steps, 0.7) * 95);
          setProgress(easedProgress);

          await new Promise((res) => {
            timeoutId = setTimeout(res, stepDuration);
          });
        }

        // Complete the progress bar when done
        if (active) {
          setProgress(100);
        }
      })();
    } else {
      // Reset progress when not fetching
      setProgress(0);
    }

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const fetchToken = async () => {
    setIsCustomLoading(true);

    try {
      // Start the minimum delay timer
      const minDelay = 1500; // 1.5 seconds minimum
      const startTime = Date.now();

      // Start the API call
      await refetch();

      // Calculate remaining delay needed
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, minDelay - elapsed);

      // Wait for the remaining delay if needed
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }
    } finally {
      setIsCustomLoading(false);
    }
  };

  const handleCopy = () => {
    if (tokenData) {
      navigator.clipboard.writeText(tokenData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start min-h-[calc(100vh-3rem)]">
          {/* Left Column: Title and Supported Apps */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-6">
              {/* Logo Section */}
              <div className="flex items-center justify-center gap-4">
                {/* Token Kiosk Icon */}
                <div className="relative">
                  <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                    <Shield className="h-8 w-8 text-primary" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Lock className="h-2 w-2 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-px bg-border"></div>
                  <X className="h-3 w-3 text-muted-foreground" />
                  <div className="w-6 h-px bg-border"></div>
                </div>

                <div className="p-2 bg-muted/50 rounded-lg border">
                  <img src="/src/assets/mapcolonies.png" alt="MapColonies" className="h-8 w-auto" />
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-3 text-center">
                <h1 className="text-3xl font-bold text-foreground">Token Kiosk</h1>
                <div className="space-y-2">
                  <p className="text-lg text-muted-foreground leading-relaxed">Generate temporary tokens for GIS desktop applications</p>
                  <p className="text-sm text-muted-foreground/80">Authentication for QGIS and ArcGIS Pro</p>
                </div>
              </div>
            </div>

            {/* Supported Applications */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Supported Applications</h2>

              {/* QGIS Card */}
              <div className="p-4 bg-card border rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <img src="/src/assets/qgis-icon128.svg" alt="QGIS" className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">QGIS Desktop</h3>
                    <p className="text-xs text-muted-foreground">Open Source GIS</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-xs text-muted-foreground mt-2">Mapping & analysis</div>
              </div>

              {/* ArcGIS Pro Card */}
              <div className="p-4 bg-card border rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <img src="/src/assets/ArcGIS_logo.png" alt="ArcGIS Pro" className="h-8 w-auto" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">ArcGIS Pro</h3>
                    <p className="text-xs text-muted-foreground">Desktop Platform</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-xs text-muted-foreground mt-2">Geospatial analysis</div>
              </div>

              <div className="text-xs text-muted-foreground text-center mt-4 p-3 bg-muted/20 rounded-lg">
                Both applications support token authentication
              </div>
            </div>
          </div>

          {/* Right Column: Token Generation */}
          <div className="flex items-center justify-center">
            <TokenCard
              tokenData={tokenData}
              isLoading={isLoading}
              isError={isError}
              error={error}
              progress={progress}
              copied={copied}
              onFetchToken={fetchToken}
              onCopy={handleCopy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { $api } from '@/lib/http-client';
import { TokenCard } from '@/components/token';

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
    <div className="w-full flex flex-col items-center">
      <div className="h-8" />
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
  );
}

import { TokenCard } from '@/components/token';
import { PageHeader, SupportedApplications } from '@/components/main-page';
import { useTokenGeneration } from '@/hooks/use-token-generation';

export function MainPage() {
  const { tokenData, isLoading, isError, error, progress, copied, fetchToken, handleCopy } = useTokenGeneration();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start min-h-[calc(100vh-3rem)]">
          {/* Left Column: Title and Supported Apps */}
          <div className="space-y-8">
            <PageHeader />
            <SupportedApplications />
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

import { ErrorDisplay } from '@/components/error';

interface ErrorPageProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  showReload?: boolean;
}

export function ErrorPage(props: ErrorPageProps) {
  return <ErrorDisplay {...props} />;
}

import { useState, useEffect, ReactNode } from 'react';
import { ErrorPage } from '../pages/error';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ErrorBoundary = ({ children, fallback }: ErrorBoundaryProps) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
      // Prevent the error from propagating
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <ErrorPage title="Application Error" message={error?.message || 'An unexpected error occurred in the application.'} code="500" />;
  }

  return <>{children}</>;
};

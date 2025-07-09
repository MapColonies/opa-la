import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  toastDescription?: string;
  logToConsole?: boolean;
  onError?: (error: Error) => void;
}

export function useErrorHandler() {
  const handleError = useCallback((error: Error | unknown, options: ErrorHandlerOptions = {}) => {
    const { showToast = true, toastTitle = 'Something went wrong', toastDescription, logToConsole = true, onError } = options;

    // Ensure we have an Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Log to console if enabled
    if (logToConsole) {
      console.error('Error handled:', errorObj);
    }

    // Show toast notification if enabled
    if (showToast) {
      toast.error(toastTitle, {
        description: toastDescription || errorObj.message,
      });
    }

    // Call custom error handler if provided
    if (onError) {
      onError(errorObj);
    }

    return errorObj;
  }, []);

  return { handleError };
}

import { Component, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ErrorPage } from '@/pages/error';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    console.log('ErrorBoundary: Constructor called');
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.log('ErrorBoundary: getDerivedStateFromError called with:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary: Error caught by boundary:', error, errorInfo);
    console.error('ErrorBoundary: Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show toast notification
    toast.error('Application Error', {
      description: error.message || 'An unexpected error occurred in the application.',
      action: {
        label: 'Reload',
        onClick: () => window.location.reload(),
      },
    });
  }

  render() {
    console.log('ErrorBoundary: Render called, hasError:', this.state.hasError);

    if (this.state.hasError) {
      console.log('ErrorBoundary: Rendering error state with error:', this.state.error);

      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use ErrorPage component for better UX
      return (
        <ErrorPage
          title="Application Error"
          message={this.state.error?.message || 'An unexpected error occurred in the application.'}
          code="500"
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

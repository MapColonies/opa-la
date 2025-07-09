import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ToastDemo() {
  const showErrorToast = () => {
    toast.error('API Error', {
      description: 'Failed to fetch user info: Unexpected token',
    });
  };

  const showSuccessToast = () => {
    toast.success('Success!', {
      description: 'Data was saved successfully',
    });
  };

  const showWarningToast = () => {
    toast.warning('Warning', {
      description: 'This action cannot be undone',
    });
  };

  const showInfoToast = () => {
    toast('Information', {
      description: 'This is an informational message',
    });
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h2 className="text-xl font-semibold">Toast Demo - Improved Colors</h2>
      <p className="text-muted-foreground">Test the improved toast colors for better readability:</p>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={showErrorToast} variant="destructive" size="sm">
          Error Toast
        </Button>
        <Button onClick={showSuccessToast} variant="default" size="sm">
          Success Toast
        </Button>
        <Button onClick={showWarningToast} variant="secondary" size="sm">
          Warning Toast
        </Button>
        <Button onClick={showInfoToast} variant="outline" size="sm">
          Info Toast
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>All toasts now have proper contrast and readable colors.</p>
      </div>
    </div>
  );
}

import { useTheme } from '@/hooks';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'hsl(var(--background))',
          '--normal-text': 'hsl(var(--foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--error-bg': 'hsl(var(--destructive))',
          '--error-text': 'hsl(var(--destructive-foreground))',
          '--error-border': 'hsl(var(--destructive))',
          '--success-bg': 'hsl(var(--primary))',
          '--success-text': 'hsl(var(--primary-foreground))',
          '--success-border': 'hsl(var(--primary))',
          '--warning-bg': 'hsl(var(--secondary))',
          '--warning-text': 'hsl(var(--secondary-foreground))',
          '--warning-border': 'hsl(var(--secondary))',
        } as React.CSSProperties
      }
      position="bottom-right"
      expand={false}
      closeButton
      richColors
      {...props}
    />
  );
};

export { Toaster };

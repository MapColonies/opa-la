import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  title?: string;
  message?: string;
  code?: string;
  actionText?: string;
  actionHref?: string;
}

export const ErrorPage = ({
  title = 'An error occurred',
  message = 'Something went wrong. Please try again later.',
  code = '500',
  actionText = 'Return Home',
  actionHref = '/',
}: ErrorPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">{code}</h1>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Link to={actionHref}>
          <Button variant="outline">{actionText}</Button>
        </Link>
      </div>
    </div>
  );
};

import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileQuestion } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileQuestion className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">The page you are looking for doesn't exist or has been moved.</p>
        <Button asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
};

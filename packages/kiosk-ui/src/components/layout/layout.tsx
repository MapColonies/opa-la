import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Token Kiosk</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3">
                {user.picture ? <img src={user.picture} alt={user.name || 'User'} className="h-8 w-8 rounded-full" /> : <User className="h-4 w-4" />}
                <span className="text-sm font-medium">{user.name || user.email}</span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

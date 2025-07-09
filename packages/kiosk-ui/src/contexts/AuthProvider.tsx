import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { AuthContext, type User, type AuthContextType } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that manages authentication state and provides
 * authentication methods to the application.
 *
 * This provider wraps the app and handles:
 * - Session validation via /auth/me endpoint
 * - Login/logout redirects to Auth0 endpoints
 * - Global authentication state management
 * - 401 error handling integration
 */

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        setUser(null);
      } else {
        console.error('Failed to check authentication status:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(() => {
    // Redirect to the backend login endpoint
    window.location.href = '/login';
  }, []);

  const logout = useCallback(() => {
    // Redirect to the backend logout endpoint
    window.location.href = '/logout';
  }, []);

  const redirectToWelcome = useCallback(() => {
    // Clear user state and force a re-check
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    redirectToWelcome,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

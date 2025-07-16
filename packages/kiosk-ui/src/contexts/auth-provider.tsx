import { type ReactNode, useMemo, useCallback } from 'react';
import { AuthContext, type User, type AuthContextType } from './auth-context';
import { $api } from '@/lib/http-client';

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
  const query = $api.useQuery('get', '/auth/me');

  const user = query.data as User | null;
  const isLoading = query.isLoading;
  const isAuthenticated = !!user && !query.isError;

  const login = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const logout = useCallback(() => {
    window.location.href = '/logout';
  }, []);

  const redirectToWelcome = useCallback(() => {
    // Optionally, you could refetch or reset the query here
    // queryClient.invalidateQueries(['/auth/me']);
  }, []);

  const checkAuth = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      checkAuth,
      redirectToWelcome,
    }),
    [user, isLoading, isAuthenticated, login, logout, checkAuth, redirectToWelcome]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

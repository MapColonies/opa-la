import { createContext } from 'react';

/**
 * User interface representing the authenticated user data
 * following Auth0's user profile structure
 */
export interface User {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  nickname?: string;
  [key: string]: unknown;
}

/**
 * Authentication context type definition with all methods
 * and state needed for authentication management
 */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  redirectToWelcome: () => void;
}

/**
 * React context for authentication state management.
 * Used in conjunction with AuthProvider to provide authentication
 * state and methods throughout the application.
 */
export const AuthContext = createContext<AuthContextType | null>(null);

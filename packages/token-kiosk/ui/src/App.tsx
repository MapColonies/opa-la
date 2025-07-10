import { useState, useEffect } from 'react';
import './App.css';

/**
 * User information interface matching the OpenAPI schema
 */
interface UserInfo {
  readonly sub: string;
  readonly name?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly middleName?: string;
  readonly nickname?: string;
  readonly preferredUsername?: string;
  readonly email?: string;
  readonly gender?: string;
  readonly phoneNumber?: string;
}

/**
 * User information interface matching the OpenAPI schema
 */
interface UserInfo {
  readonly sub: string;
  readonly name?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly middleName?: string;
  readonly nickname?: string;
  readonly preferredUsername?: string;
  readonly email?: string;
  readonly gender?: string;
  readonly phoneNumber?: string;
}

/**
 * Token response interface matching the OpenAPI schema
 */
interface TokenResponse {
  readonly token: string;
  readonly expiration: string;
  readonly domains: readonly string[];
}

/**
 * Authentication states for the application
 */
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
} as const;

type AuthState = (typeof AUTH_STATES)[keyof typeof AUTH_STATES];

/**
 * Token fetch states for the application
 */
const TOKEN_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type TokenState = (typeof TOKEN_STATES)[keyof typeof TOKEN_STATES];

/**
 * Main application component that handles authentication and user display
 */
function App() {
  const [authState, setAuthState] = useState<AuthState>(AUTH_STATES.LOADING);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState>(TOKEN_STATES.IDLE);
  const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  /**
   * Fetch current user information from the API
   */
  const fetchUserInfo = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies for session
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const user: UserInfo = await response.json();
        setUserInfo(user);
        setAuthState(AUTH_STATES.AUTHENTICATED);
      } else if (response.status === 401) {
        // User is not authenticated
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      } else {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setAuthState(AUTH_STATES.ERROR);
    }
  };

  /**
   * Fetch a new token from the API
   */
  const fetchToken = async (): Promise<void> => {
    setTokenState(TOKEN_STATES.LOADING);
    setTokenError(null);

    try {
      const response = await fetch('/api/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const token: TokenResponse = await response.json();
        setTokenResponse(token);
        setTokenState(TOKEN_STATES.SUCCESS);
      } else {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setTokenError(errorMessage);
      setTokenState(TOKEN_STATES.ERROR);
    }
  };

  /**
   * Handle user login action
   */
  const handleLogin = (): void => {
    // The express-openid-connect middleware handles the login redirect
    window.location.href = '/login';
  };

  /**
   * Check authentication status on component mount
   */
  useEffect(() => {
    fetchUserInfo();
  }, []);

  /**
   * Render loading state
   */
  if (authState === AUTH_STATES.LOADING) {
    return (
      <div className="App">
        <div className="loading">
          <h2>Loading...</h2>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (authState === AUTH_STATES.ERROR) {
    return (
      <div className="App">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  /**
   * Render login screen for unauthenticated users
   */
  if (authState === AUTH_STATES.UNAUTHENTICATED) {
    return (
      <div className="App">
        <div className="login-screen">
          <h1>Token Kiosk</h1>
          <p>Welcome to the Token Kiosk authentication service.</p>
          <p>Please log in to access your user information.</p>
          <button onClick={handleLogin} className="login-button">
            Login
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render authenticated user dashboard
   */
  if (authState === AUTH_STATES.AUTHENTICATED && userInfo) {
    return (
      <div className="App">
        <header className="app-header">
          <h2>Token Kiosk Dashboard</h2>
        </header>

        <main className="user-info">
          <div className="user-details">
            <h3>User Information</h3>
            <div className="user-field">
              <strong>User ID:</strong> {userInfo.sub}
            </div>

            {userInfo.name && (
              <div className="user-field">
                <strong>Full Name:</strong> {userInfo.name}
              </div>
            )}

            {userInfo.givenName && (
              <div className="user-field">
                <strong>First Name:</strong> {userInfo.givenName}
              </div>
            )}

            {userInfo.familyName && (
              <div className="user-field">
                <strong>Last Name:</strong> {userInfo.familyName}
              </div>
            )}

            {userInfo.email && (
              <div className="user-field">
                <strong>Email:</strong> {userInfo.email}
              </div>
            )}

            {userInfo.preferredUsername && (
              <div className="user-field">
                <strong>Username:</strong> {userInfo.preferredUsername}
              </div>
            )}

            {userInfo.phoneNumber && (
              <div className="user-field">
                <strong>Phone:</strong> {userInfo.phoneNumber}
              </div>
            )}
          </div>

          {/* Token Section */}
          <div className="token-section">
            <h3>Access Token</h3>

            <div className="token-controls">
              <button onClick={fetchToken} disabled={tokenState === TOKEN_STATES.LOADING} className="primary-button">
                {tokenState === TOKEN_STATES.LOADING ? 'Loading...' : 'Get New Token'}
              </button>
            </div>

            {tokenState === TOKEN_STATES.ERROR && tokenError && (
              <div className="error-message">
                <strong>Error:</strong> {tokenError}
              </div>
            )}

            {tokenState === TOKEN_STATES.SUCCESS && tokenResponse && (
              <div className="token-details">
                <div className="token-field">
                  <label>
                    <strong>Token:</strong>
                  </label>
                  <div className="token-input-group">
                    <textarea value={tokenResponse.token} readOnly className="token-textarea" rows={3} />
                    <button
                      onClick={() => navigator.clipboard.writeText(tokenResponse.token)}
                      className="copy-button"
                      title="Copy token to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="token-metadata">
                  <div className="metadata-item">
                    <strong>Expiration:</strong>
                    <span>{new Date(tokenResponse.expiration).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Fallback - should not reach here
  return null;
}

export default App;

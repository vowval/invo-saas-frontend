'use client';

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type AuthUser = {
  userId: string;
  userName: string;
  companyId: string | null;
  companyName: string | null;
  role: string;
};

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_CHANGE_EVENT = 'auth-change';

/**
 * Check if user is authenticated by verifying httpOnly cookie exists
 * The actual JWT token is stored securely in httpOnly cookie by the backend
 */
function getAuthStatus() {
  if (typeof window === 'undefined') return null;
  // Check if httpOnly cookie is set (indirectly by checking if we can make authenticated requests)
  return document.cookie.includes('token=') ? 'authenticated' : null;
}

/**
 * Get stored user info from localStorage (NOT the token)
 * Token is stored in httpOnly cookie and not accessible to JavaScript
 */
function getStoredUser() {
  return typeof window === 'undefined' ? null : localStorage.getItem('user');
}

function subscribeToAuthChanges(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(AUTH_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, onStoreChange);
  };
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authStatus = useSyncExternalStore(subscribeToAuthChanges, getAuthStatus, () => null);
  const storedUser = useSyncExternalStore(subscribeToAuthChanges, getStoredUser, () => null);
  const user = useMemo(
    () => (storedUser ? JSON.parse(storedUser) as AuthUser : null),
    [storedUser],
  );
  const router = useRouter();

  function login(jwt: string) {
    // Extract user info from JWT payload (for display purposes only)
    const payload = JSON.parse(
      atob(jwt.split('.')[1]),
    ) as AuthUser;

    // Store JWT token in localStorage for Authorization header in API requests
    localStorage.setItem('token', jwt);
    
    // Store user info in localStorage (not sensitive)
    localStorage.setItem('user', JSON.stringify(payload));
    
    // Also set non-httpOnly cookie as fallback for auth status checks
    document.cookie = `token=${jwt}; path=/; SameSite=Strict; Secure`;
    
    notifyAuthChange();
    router.push(payload.role === 'SUPER_ADMIN' ? '/super-admin/companies' : '/dashboard');
  }

  async function logout() {
    try {
      // Call backend logout endpoint to clear httpOnly cookie
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }

    // Remove user info from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear the non-httpOnly cookie fallback
    document.cookie = 'token=; Max-Age=0; path=/';
    document.cookie = 'token=; Max-Age=0; path=/; domain=' + window.location.hostname;

    notifyAuthChange();
    
    // Add a small delay to ensure cookies are cleared before redirecting
    setTimeout(() => {
      router.push('/login');
    }, 100);
  }

  return (
    <AuthContext.Provider
      value={{
        token: authStatus ? 'authenticated' : null,
        user,
        isAuthenticated: !!authStatus && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

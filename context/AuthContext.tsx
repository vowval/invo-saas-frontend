'use client';

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/navigation';

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

function getStoredToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem('token');
}

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
  const token = useSyncExternalStore(subscribeToAuthChanges, getStoredToken, () => null);
  const storedUser = useSyncExternalStore(subscribeToAuthChanges, getStoredUser, () => null);
  const user = useMemo(
    () => (storedUser ? JSON.parse(storedUser) as AuthUser : null),
    [storedUser],
  );
  const router = useRouter();

  function login(jwt: string) {
    const payload = JSON.parse(
      atob(jwt.split('.')[1]),
    ) as AuthUser;

    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(payload));
    document.cookie = `token=${jwt}; path=/`;
    notifyAuthChange();
    router.push(payload.role === 'SUPER_ADMIN' ? '/super-admin/companies' : '/dashboard');
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; Max-Age=0; path=/';

    notifyAuthChange();
    router.push('/login');
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
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

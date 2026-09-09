'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  function login(jwt: string) {
    const payload = JSON.parse(
      atob(jwt.split('.')[1]),
    ) as AuthUser;

    setToken(jwt);
    setUser(payload);

    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(payload));

    document.cookie = `token=${jwt}; path=/`;
    router.push(payload.role === 'SUPER_ADMIN' ? '/super-admin/companies' : '/dashboard');
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; Max-Age=0; path=/';

    setToken(null);
    setUser(null);
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

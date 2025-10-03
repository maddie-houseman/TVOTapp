// AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId: string | null;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
}

export interface AuthData {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthData>({
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export { AuthContext };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const me = await api.me();
      if (me) {
        setUser({
          id: me.id,
          email: me.email || '',
          name: me.name || '',
          role: me.role,
          companyId: me.companyId,
        });
        // TODO: Fetch company details if needed
        setCompany({
          id: me.companyId || '',
          name: 'Your Company', // TODO: Fetch from API
          domain: 'yourcompany.com', // TODO: Fetch from API
        });
      }
    } catch {
      console.log('Not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    await checkAuth();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      company,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};


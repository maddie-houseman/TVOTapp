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
  signup: (email: string, password: string, name: string, companyName?: string, companyDomain?: string, role?: 'ADMIN' | 'EMPLOYEE') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthData>({
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
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
        
        // Fetch company details if user has a company
        if (me.companyId) {
          try {
            const companyData = await api.getCompany();
            if (companyData) {
              setCompany(companyData);
            } else {
              setCompany(null);
            }
          } catch {
            setCompany(null);
          }
        } else {
          setCompany(null);
        }
      }
    } catch {
      // Not authenticated
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

  const signup = async (email: string, password: string, name: string, companyName?: string, companyDomain?: string, role?: 'ADMIN' | 'EMPLOYEE') => {
    await api.signup(email, password, name, companyName, companyDomain, role);
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
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};


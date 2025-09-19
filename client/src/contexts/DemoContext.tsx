// DemoContext.tsx
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react'; // ✅ type-only
// (removed useState)

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId: string;
  companyName: string;
}

export interface DemoCompany {
  id: string;
  name: string;
  domain: string;
}

export interface DemoData {
  user: DemoUser;
  company: DemoCompany;
  isDemoMode: boolean;
}

const defaultDemoData: DemoData = {
  user: {
    id: 'demo-user-1',
    email: 'admin@example.com',
    name: 'Demo Admin',
    role: 'ADMIN',
    companyId: 'demo-company-1',
    companyName: 'Demo Corp',
  },
  company: {
    id: 'demo-company-1',
    name: 'Demo Company',
    domain: 'demo.com',
  },
  isDemoMode: true,
};

const DemoContext = createContext<DemoData>(defaultDemoData);

// eslint-disable-next-line react-refresh/only-export-components
export const useDemo = () => useContext(DemoContext);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <DemoContext.Provider value={defaultDemoData}>{children}</DemoContext.Provider>;
};


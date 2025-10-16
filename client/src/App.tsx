import { Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--light-grey)' }}>
        <Navigation />
        <Outlet />
      </div>
    </AuthProvider>
  );
}

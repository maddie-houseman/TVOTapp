
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export default function Navigation() {
  const location = useLocation();
  const { isAuthenticated, company, user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/framework', label: 'Framework Entry', icon: '📊' },
    { path: '/dashboard', label: 'Dashboard', icon: '📈' },
    { path: '/account', label: 'Account', icon: '👤' }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200" style={{ backgroundColor: 'var(--primary-navy)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">TVOT Framework</h1>
              {!isAuthenticated && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--accent-teal)', color: 'white' }}>
                  Not Authenticated
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'text-white border-b-2 border-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                style={location.pathname === item.path ? { backgroundColor: 'var(--primary-teal)' } : {}}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && company && (
              <div className="text-sm text-slate-300">
                <span className="font-medium">{company.name}</span>
              </div>
            )}
            {isAuthenticated && user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-300">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-slate-300 hover:text-white hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDemo } from '../contexts/DemoContext';

export default function Navigation() {
  const location = useLocation();
  const { isDemoMode, company } = useDemo();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/framework', label: 'Framework Entry', icon: '📊' },
    { path: '/dashboard', label: 'Dashboard', icon: '📈' },
    { path: '/account', label: 'Account', icon: '👤' }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">TVOT Framework</h1>
              {isDemoMode && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Demo Mode
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
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{company.name}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}


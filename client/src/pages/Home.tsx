// import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export default function Home() {
  const { isAuthenticated, company } = useAuth();

  const frameworkLayers = [
    {
      title: 'Business Units & Capabilities',
      description: 'Define your business units and their capabilities. Track budgets, headcount, and strategic objectives for each unit.',
      icon: '🏢',
      color: 'bg-blue-500',
      link: '/business-framework',
      view: 'business-units'
    },
    {
      title: 'Services',
      description: 'Map IT services to business units. Track service costs, SLAs, utilization, and how services support business capabilities.',
      icon: '⚙️',
      color: 'bg-green-500',
      link: '/business-framework',
      view: 'services'
    },
    {
      title: 'IT Towers',
      description: 'Manage your IT infrastructure towers: data centers, compute, storage, network, applications, and security components.',
      icon: '🏗️',
      color: 'bg-purple-500',
      link: '/business-framework',
      view: 'it-towers'
    },
    {
      title: 'Cost Pools',
      description: 'Track and allocate costs across different pools: labor, hardware, software, facilities, telecom, and external services.',
      icon: '💰',
      color: 'bg-yellow-500',
      link: '/business-framework',
      view: 'cost-pools'
    },
    {
      title: 'Business Insights',
      description: 'Get AI-powered insights on cost optimization, performance analysis, capacity planning, and strategic alignment.',
      icon: '💡',
      color: 'bg-indigo-500',
      link: '/business-framework',
      view: 'insights'
    },
    {
      title: 'Framework Overview',
      description: 'Comprehensive dashboard showing the complete business framework with key metrics, relationships, and performance indicators.',
      icon: '📊',
      color: 'bg-teal-500',
      link: '/business-framework',
      view: 'overview'
    }
  ];

  return (
    <div className="py-16 bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Business Framework
              <span className="block text-blue-600">Management</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Transform your business operations with a comprehensive 4-layer framework. Connect business units to IT infrastructure and get actionable insights.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/business-framework"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Explore Framework
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  to="/dashboard"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Framework Overview */}
      <div className="py-16 bg-gray-50 text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Four-Layer Business Framework
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              A comprehensive approach to align business units with IT infrastructure and cost management
            </p>
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200 max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Framework Structure</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Business Units:</strong> Define your organizational structure and capabilities</p>
                <p><strong>Services:</strong> Map IT services to business units with cost and performance tracking</p>
                <p><strong>IT Towers:</strong> Manage infrastructure components and their utilization</p>
                <p><strong>Cost Pools:</strong> Track and allocate costs across different expense categories</p>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {frameworkLayers.map((layer, index) => (
                <div key={index} className="relative group">
                  <div className={`${layer.color} rounded-lg p-6 text-white transform transition-transform group-hover:scale-105`}>
                    <div className="text-4xl mb-4">{layer.icon}</div>
                    <h3 className="text-lg font-semibold mb-2">{layer.title}</h3>
                    <p className="text-sm opacity-90">{layer.description}</p>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white rounded-full p-2 shadow-lg">
                      <span className="text-gray-600 font-bold">{index + 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Notice */}
      {!isAuthenticated && (
        <div className="p-4" style={{ backgroundColor: 'var(--light-blue)', borderLeft: '4px solid var(--primary-teal)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span style={{ color: 'var(--primary-teal)' }}>ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm" style={{ color: 'var(--primary-navy)' }}>
                      <strong>Authentication Required:</strong>  
                      Please log in to access your TBM framework data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Info */}
      <div className="py-12" style={{ backgroundColor: 'var(--light-grey)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6" style={{ border: '1px solid var(--light-blue)' }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--dark-grey)' }}>Current Company</h3>
            {company ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--medium-grey)' }}>Company Name</p>
                  <p className="text-lg" style={{ color: 'var(--dark-grey)' }}>{company.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--medium-grey)' }}>Domain</p>
                  <p className="text-lg" style={{ color: 'var(--dark-grey)' }}>{company.domain}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p style={{ color: 'var(--medium-grey)' }}>Please log in to view company information</p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors"
                  style={{ backgroundColor: 'var(--primary-blue)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-navy)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-blue)'}
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


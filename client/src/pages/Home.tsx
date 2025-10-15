// import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export default function Home() {
  const { isAuthenticated, company } = useAuth();

  const frameworkLayers = [
    {
      title: 'L1 - Operational Inputs',
      description: 'Capture current operational metrics including headcount, budget allocation, for micheal.',
      icon: '📊',
      color: 'bg-blue-500',
      link: '/framework'
    },
    {
      title: 'L2 - Tower Allocation',
      description: 'Define resource distribution across TBM towers (App Dev, Cloud, End User, etc.) with percentage weights.',
      icon: '🏗️',
      color: 'bg-cyan-500',
      link: '/framework'
    },
    {
      title: 'L3 - Benefit Categories',
      description: 'Categorize and weight business benefits including productivity gains and revenue uplift.',
      icon: '🎯',
      color: 'bg-purple-500',
      link: '/framework'
    },
    {
      title: 'L4 - ROI Snapshots',
      description: 'Generate comprehensive ROI analysis with cost-benefit calculations and performance metrics.',
      icon: '📈',
      color: 'bg-sky-500',
      link: '/dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Technology Business Management
              <span className="block text-primary-600">Framework</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Optimize your technology investments with data-driven insights. Track costs, measure benefits, and demonstrate ROI across your IT portfolio.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/framework"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                >
                  Get Started
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  to="/dashboard"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Framework Overview */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Four-Layer Framework
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Our comprehensive approach to technology business management
            </p>
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


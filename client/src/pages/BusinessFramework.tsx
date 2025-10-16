import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { 
  api, 
  type BusinessUnitModel, 
  type Service, 
  type ItTowerModel, 
  type CostPoolModel
} from '../lib/api';
import BusinessInsights from '../components/BusinessInsights';
import FrameworkOverviewComponent from '../components/FrameworkOverview';

export default function BusinessFramework() {
  const { user } = useAuth();
  
  // Period selection
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));
  
  // Current view state
  const [currentView, setCurrentView] = useState<'overview' | 'business-units' | 'services' | 'it-towers' | 'cost-pools' | 'insights'>('overview');
  
  // Data state
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitModel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [itTowers, setItTowers] = useState<ItTowerModel[]>([]);
  const [costPools, setCostPools] = useState<CostPoolModel[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!user) return <div className="text-sm">Please login.</div>;

  if (user.role !== 'ADMIN' && !user.companyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Company Assigned</h1>
          <p className="text-gray-600">You are not assigned to any company. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const companyId = user.companyId || '';

  // Load data based on current view
  useEffect(() => {
    if (!companyId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        const fullPeriod = `${period}-01`;
        
        switch (currentView) {
          case 'business-units':
            const businessUnitsData = await api.getBusinessUnits(companyId, fullPeriod);
            setBusinessUnits(businessUnitsData);
            break;
          case 'services':
            const servicesData = await api.getServices(companyId, fullPeriod);
            setServices(servicesData);
            break;
          case 'it-towers':
            const itTowersData = await api.getItTowers(companyId, fullPeriod);
            setItTowers(itTowersData);
            break;
          case 'cost-pools':
            const costPoolsData = await api.getCostPools(companyId, fullPeriod);
            setCostPools(costPoolsData);
            break;
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [companyId, period, currentView]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Framework</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive view of your business units, services, IT infrastructure, and cost structure
          </p>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reporting Period</h3>
              <p className="text-sm text-gray-600">Select the period for analysis</p>
            </div>
            <div className="max-w-xs">
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'business-units', label: 'Business Units', icon: '🏢' },
                { id: 'services', label: 'Services', icon: '⚙️' },
                { id: 'it-towers', label: 'IT Towers', icon: '🏗️' },
                { id: 'cost-pools', label: 'Cost Pools', icon: '💰' },
                { id: 'insights', label: 'Insights', icon: '💡' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    currentView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow">
          {isLoading && (
            <div className="p-6 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                Loading...
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-6 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">✗</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}


          {!isLoading && !errorMessage && (
            <div className="p-6">
              {/* Overview View */}
              {currentView === 'overview' && (
                <FrameworkOverviewComponent companyId={companyId} period={period} />
              )}

              {/* Insights View */}
              {currentView === 'insights' && (
                <BusinessInsights companyId={companyId} period={period} />
              )}

              {/* Business Units View */}
              {currentView === 'business-units' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Business Units</h2>
                    <button
                      onClick={() => {
                        // TODO: Implement business unit creation
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Business Unit
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {businessUnits.map((unit) => (
                      <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{unit.name}</h3>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {unit.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{unit.description}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Budget:</span>
                            <span className="font-medium">{formatCurrency(unit.budget)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Employees:</span>
                            <span className="font-medium">{unit.employees}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Services:</span>
                            <span className="font-medium">{unit.services?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services View */}
              {currentView === 'services' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Services</h2>
                    <button
                      onClick={() => {
                        // TODO: Implement service creation
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Service
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {service.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cost:</span>
                            <span className="font-medium">{formatCurrency(service.cost)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Utilization:</span>
                            <span className="font-medium">
                              {service.utilization ? formatPercentage(service.utilization) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Business Unit:</span>
                            <span className="font-medium">{service.businessUnit?.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IT Towers View */}
              {currentView === 'it-towers' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">IT Towers</h2>
                    <button
                      onClick={() => {
                        // TODO: Implement IT tower creation
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add IT Tower
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itTowers.map((tower) => (
                      <div key={tower.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{tower.name}</h3>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {tower.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{tower.description}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cost:</span>
                            <span className="font-medium">{formatCurrency(tower.cost)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Utilization:</span>
                            <span className="font-medium">
                              {tower.utilization ? formatPercentage(tower.utilization) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capacity:</span>
                            <span className="font-medium">
                              {tower.capacity ? formatCurrency(tower.capacity) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Pools View */}
              {currentView === 'cost-pools' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Cost Pools</h2>
                    <button
                      onClick={() => {
                        // TODO: Implement cost pool creation
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Cost Pool
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {costPools.map((pool) => (
                      <div key={pool.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{pool.name}</h3>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {pool.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{pool.description}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-medium">{formatCurrency(pool.amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">IT Towers:</span>
                            <span className="font-medium">{pool.itTowers?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

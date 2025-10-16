import { useState, useEffect } from 'react';
import { 
  api, 
  type FrameworkOverview
} from '../lib/api';

interface FrameworkOverviewProps {
  companyId: string;
  period: string;
}

export default function FrameworkOverview({ companyId, period }: FrameworkOverviewProps) {
  const [overview, setOverview] = useState<FrameworkOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedView, setSelectedView] = useState<'summary' | 'business-units' | 'services' | 'it-towers' | 'cost-pools' | 'insights'>('summary');

  useEffect(() => {
    loadOverview();
  }, [companyId, period]);

  const loadOverview = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const fullPeriod = `${period}-01`;
      const overviewData = await api.getFrameworkOverview(companyId, fullPeriod);
      setOverview(overviewData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load framework overview');
    } finally {
      setIsLoading(false);
    }
  };

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

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-red-600 bg-red-50';
    if (utilization >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getImpactColor = (impact?: string) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COST_OPTIMIZATION': return '💰';
      case 'PERFORMANCE_ANALYSIS': return '📊';
      case 'CAPACITY_PLANNING': return '📈';
      case 'RISK_ASSESSMENT': return '⚠️';
      case 'STRATEGIC_ALIGNMENT': return '🎯';
      case 'ROI_ANALYSIS': return '💹';
      case 'BENCHMARKING': return '📋';
      case 'TREND_ANALYSIS': return '📉';
      default: return '💡';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Loading framework overview...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400">✗</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No framework data available</h3>
        <p className="text-gray-600">Start by adding business units, services, IT towers, and cost pools.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Framework Overview</h2>
          <p className="text-gray-600">Complete view of your business framework structure</p>
        </div>
        <div className="text-sm text-gray-500">
          Period: {new Date(period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'summary', label: 'Summary', icon: '📊' },
              { id: 'business-units', label: 'Business Units', icon: '🏢' },
              { id: 'services', label: 'Services', icon: '⚙️' },
              { id: 'it-towers', label: 'IT Towers', icon: '🏗️' },
              { id: 'cost-pools', label: 'Cost Pools', icon: '💰' },
              { id: 'insights', label: 'Insights', icon: '💡' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedView === tab.id
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

        <div className="p-6">
          {/* Summary View */}
          {selectedView === 'summary' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(overview.summary.totalBudget)}</div>
                  <div className="text-sm text-blue-800">Total Budget</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(overview.summary.totalCost)}</div>
                  <div className="text-sm text-green-800">Total Cost</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{overview.summary.totalEmployees}</div>
                  <div className="text-sm text-purple-800">Total Employees</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatPercentage(overview.summary.avgUtilization)}</div>
                  <div className="text-sm text-orange-800">Avg Utilization</div>
                </div>
              </div>

              {/* Framework Structure */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Framework Components</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">🏢</span>
                        <span className="font-medium">Business Units</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{overview.summary.businessUnitCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">⚙️</span>
                        <span className="font-medium">Services</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{overview.summary.serviceCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">🏗️</span>
                        <span className="font-medium">IT Towers</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">{overview.summary.itTowerCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">💰</span>
                        <span className="font-medium">Cost Pools</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-600">{overview.summary.costPoolCount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Insights</h3>
                  <div className="space-y-3">
                    {overview.recentInsights.slice(0, 5).map((insight) => (
                      <div key={insight.id} className="p-3 bg-gray-50 rounded">
                        <div className="flex items-start">
                          <span className="text-lg mr-2">{getCategoryIcon(insight.category)}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{insight.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{insight.insight}</div>
                            <div className="flex items-center mt-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(insight.impact)}`}>
                                {insight.impact || 'Medium'} Impact
                              </span>
                              {insight.confidence && (
                                <span className="ml-2 text-xs text-gray-500">
                                  {formatPercentage(insight.confidence * 100)} confidence
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Units View */}
          {selectedView === 'business-units' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Units ({overview.businessUnits.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.businessUnits.map((unit) => (
                  <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{unit.name}</h4>
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
          {selectedView === 'services' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Services ({overview.services.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
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
          {selectedView === 'it-towers' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">IT Towers ({overview.itTowers.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.itTowers.map((tower) => (
                  <div key={tower.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{tower.name}</h4>
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
                        <span className={`font-medium ${tower.utilization ? getUtilizationColor(tower.utilization) : ''}`}>
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
          {selectedView === 'cost-pools' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Pools ({overview.costPools.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.costPools.map((pool) => (
                  <div key={pool.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{pool.name}</h4>
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

          {/* Insights View */}
          {selectedView === 'insights' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Insights ({overview.recentInsights.length})</h3>
              <div className="space-y-4">
                {overview.recentInsights.map((insight) => (
                  <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-4">{getCategoryIcon(insight.category)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{insight.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(insight.impact)}`}>
                              {insight.impact || 'Medium'} Impact
                            </span>
                            {insight.confidence && (
                              <span className="text-xs text-gray-500">
                                {formatPercentage(insight.confidence * 100)} confidence
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        <p className="text-gray-900">{insight.insight}</p>
                        <div className="mt-3 text-xs text-gray-500">
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

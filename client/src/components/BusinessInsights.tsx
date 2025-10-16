import { useState, useEffect } from 'react';
import { 
  api, 
  type BusinessInsight, 
  type FrameworkOverview,
  type InsightCategory
} from '../lib/api';

interface BusinessInsightsProps {
  companyId: string;
  period: string;
}

export default function BusinessInsights({ companyId, period }: BusinessInsightsProps) {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [overview, setOverview] = useState<FrameworkOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | 'ALL'>('ALL');

  useEffect(() => {
    loadInsights();
    loadOverview();
  }, [companyId, period, selectedCategory]);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      const fullPeriod = `${period}-01`;
      const insightsData = await api.getBusinessInsights(
        companyId, 
        fullPeriod, 
        selectedCategory === 'ALL' ? undefined : selectedCategory
      );
      setInsights(insightsData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverview = async () => {
    try {
      const fullPeriod = `${period}-01`;
      const overviewData = await api.getFrameworkOverview(companyId, fullPeriod);
      setOverview(overviewData);
    } catch (error) {
      console.error('Failed to load overview:', error);
    }
  };

  const generateNewInsights = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const fullPeriod = `${period}-01`;
      const newInsights = await api.generateBusinessInsights(companyId, fullPeriod);
      setInsights(newInsights);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: InsightCategory) => {
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

  const getImpactColor = (impact?: string) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
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

  const categories: Array<{ value: InsightCategory | 'ALL'; label: string; icon: string }> = [
    { value: 'ALL', label: 'All Insights', icon: '💡' },
    { value: 'COST_OPTIMIZATION', label: 'Cost Optimization', icon: '💰' },
    { value: 'PERFORMANCE_ANALYSIS', label: 'Performance Analysis', icon: '📊' },
    { value: 'CAPACITY_PLANNING', label: 'Capacity Planning', icon: '📈' },
    { value: 'RISK_ASSESSMENT', label: 'Risk Assessment', icon: '⚠️' },
    { value: 'STRATEGIC_ALIGNMENT', label: 'Strategic Alignment', icon: '🎯' },
    { value: 'ROI_ANALYSIS', label: 'ROI Analysis', icon: '💹' },
    { value: 'BENCHMARKING', label: 'Benchmarking', icon: '📋' },
    { value: 'TREND_ANALYSIS', label: 'Trend Analysis', icon: '📉' },
  ];

  // Calculate key metrics for insights
  const highImpactInsights = insights.filter(i => i.impact?.toLowerCase() === 'high').length;
  const avgConfidence = insights.length > 0 
    ? insights.reduce((sum, i) => sum + (i.confidence || 0), 0) / insights.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Insights</h2>
          <p className="text-gray-600">AI-powered analysis of your business framework</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={generateNewInsights}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'Generate New Insights'}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{insights.length}</div>
            <div className="text-sm text-gray-600">Total Insights</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{highImpactInsights}</div>
            <div className="text-sm text-gray-600">High Impact</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{formatPercentage(avgConfidence * 100)}</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(overview.summary.totalCost)}</div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
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
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            {selectedCategory === 'ALL' ? 'Loading insights...' : 'Generating new insights...'}
          </div>
        </div>
      )}

      {/* Insights List */}
      {!isLoading && insights.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory === 'ALL' 
              ? 'Generate your first business insights to get started.'
              : `No insights found for ${categories.find(c => c.value === selectedCategory)?.label}.`
            }
          </p>
          <button
            onClick={generateNewInsights}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Generate Insights
          </button>
        </div>
      )}

      {!isLoading && insights.length > 0 && (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{getCategoryIcon(insight.category)}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{insight.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getImpactColor(insight.impact)}`}>
                          {insight.impact || 'Medium'} Impact
                        </span>
                        {insight.confidence && (
                          <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                            {formatPercentage(insight.confidence * 100)} confidence
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    
                    <div className="bg-gray-50 rounded-md p-4 mb-4">
                      <p className="text-gray-900 font-medium">{insight.insight}</p>
                    </div>

                    {/* Additional Data Display */}
                    {insight.data && Object.keys(insight.data).length > 0 && (
                      <div className="bg-blue-50 rounded-md p-4 mb-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Supporting Data</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          {Object.entries(insight.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-blue-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="text-blue-900 font-medium">
                                {typeof value === 'number' 
                                  ? (key.toLowerCase().includes('percent') || key.toLowerCase().includes('utilization')
                                      ? formatPercentage(value)
                                      : formatCurrency(value))
                                  : String(value)
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {insight.category.replace('_', ' ')}
                      </span>
                      <span>
                        {new Date(insight.createdAt).toLocaleDateString()} at{' '}
                        {new Date(insight.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

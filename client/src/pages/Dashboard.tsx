import React, { useState } from 'react';
import { useDemo } from '../contexts/DemoContext';

export default function Dashboard() {
  const { isDemoMode, company } = useDemo();
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');

  // Mock data for demo mode
  const mockData = {
    l1Data: [
      { department: 'Engineering', employees: 45, budget: 2800000, baselineKpi: 0.85 },
      { department: 'Sales', employees: 32, budget: 1800000, baselineKpi: 0.78 },
      { department: 'Marketing', employees: 18, budget: 1200000, baselineKpi: 0.82 },
      { department: 'Finance', employees: 12, budget: 800000, baselineKpi: 0.91 },
      { department: 'HR', employees: 8, budget: 500000, baselineKpi: 0.88 }
    ],
    l2Data: [
      { tower: 'App Dev', weight: 0.45, color: 'bg-blue-500' },
      { tower: 'Cloud', weight: 0.25, color: 'bg-green-500' },
      { tower: 'End User', weight: 0.15, color: 'bg-purple-500' },
      { tower: 'Security', weight: 0.10, color: 'bg-red-500' },
      { tower: 'Other', weight: 0.05, color: 'bg-gray-500' }
    ],
    l3Data: [
      { category: 'Productivity', weight: 0.60, color: 'bg-indigo-500' },
      { category: 'Revenue Uplift', weight: 0.40, color: 'bg-emerald-500' }
    ],
    l4Data: {
      totalCost: 7100000,
      totalBenefit: 8900000,
      netBenefit: 1800000,
      roiPercentage: 25.4,
      assumptions: {
        revenueUplift: 1200000,
        productivityGainHours: 8000,
        avgLoadedRate: 75
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
          <h1 className="text-3xl font-bold text-gray-900">TBM Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Technology Business Management insights for {company.name}
          </p>
          
          {/* Period Selector */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024-01">January 2024</option>
              <option value="2024-02">February 2024</option>
              <option value="2024-03">March 2024</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Budget</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(mockData.l1Data.reduce((sum, dept) => sum + dept.budget, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Headcount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {mockData.l1Data.reduce((sum, dept) => sum + dept.employees, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ROI</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercentage(mockData.l4Data.roiPercentage)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Net Benefit</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(mockData.l4Data.netBenefit)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* L1 - Department Budget Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">L1 - Department Budget Distribution</h3>
            <div className="space-y-4">
              {mockData.l1Data.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{dept.department}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-900">{formatCurrency(dept.budget)}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(dept.budget / Math.max(...mockData.l1Data.map(d => d.budget))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* L2 - Tower Allocation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">L2 - Tower Allocation</h3>
            <div className="space-y-4">
              {mockData.l2Data.map((tower, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{tower.tower}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-900">{formatPercentage(tower.weight * 100)}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${tower.color} h-2 rounded-full`}
                        style={{ width: `${tower.weight * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* L4 - ROI Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">L4 - ROI Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Financial Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Cost:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(mockData.l4Data.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Benefit:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(mockData.l4Data.totalBenefit)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Net Benefit:</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(mockData.l4Data.netBenefit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ROI:</span>
                  <span className="text-sm font-bold text-blue-600">{formatPercentage(mockData.l4Data.roiPercentage)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Assumptions</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue Uplift:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(mockData.l4Data.assumptions.revenueUplift)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Productivity Hours:</span>
                  <span className="text-sm font-medium text-gray-900">{mockData.l4Data.assumptions.productivityGainHours.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Loaded Rate:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(mockData.l4Data.assumptions.avgLoadedRate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">💡</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Demo Data:</strong> SAMPLE DATA. 
                  Once database connected actual TBM framework data will be here
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

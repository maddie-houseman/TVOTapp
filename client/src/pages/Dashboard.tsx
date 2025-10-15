import { useState, useEffect } from 'react';
import { exportElementToPdf } from '../utils/exportPdf';
import { useAuth } from '../contexts/useAuth';
import api, { type L1Input, type L2Input, type L4Snapshot } from '../lib/api';

// Local, stable merge sort (no external file)
function mergeSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return arr.slice();
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), compare);
  const right = mergeSort(arr.slice(mid), compare);
  return merge(left, right, compare);
}

function merge<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
  const out: T[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (compare(left[i], right[j]) <= 0) out.push(left[i++]); else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}

export default function Dashboard() {
  const { isAuthenticated, company, user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('01');
  const selectedPeriod = `${selectedYear}-${selectedMonth}`;

  // Admin company filtering
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<{ id: string; name: string; domain: string }[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Real data state
  const [l1Data, setL1Data] = useState<L1Input[]>([]);
  const [l2Data, setL2Data] = useState<L2Input[]>([]);
  const [l4Data, setL4Data] = useState<L4Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Historical data for graphs
  const [historicalData, setHistoricalData] = useState<L4Snapshot[]>([]);
  const [showGraphs, setShowGraphs] = useState(false);

  // Load companies for admin users
  useEffect(() => {
    console.log('Admin check - User role:', user?.role, 'Is authenticated:', isAuthenticated);
    
    if (user?.role === 'ADMIN' && isAuthenticated) {
      console.log('Loading companies for admin user...');
      setLoadingCompanies(true);
      api.getCompanies()
        .then(companies => {
          console.log('Successfully loaded companies for admin:', companies);
          setAvailableCompanies(companies);
        })
        .catch(error => {
          console.error('Failed to load companies for admin:', error);
          setAvailableCompanies([]);
        })
        .finally(() => {
          setLoadingCompanies(false);
        });
    } else {
      console.log('Not loading companies - User role:', user?.role, 'Is authenticated:', isAuthenticated);
      setAvailableCompanies([]);
      setLoadingCompanies(false);
    }
  }, [user?.role, isAuthenticated]);

  // Load data when period or company changes
  useEffect(() => {
    // Don't load data during PDF export to prevent API calls
    if (isExporting) {
      return;
    }

    const loadData = async () => {
      // For admin users, use selected company; for regular users, use their own company
      const targetCompanyId = user?.role === 'ADMIN' && selectedCompanyId ? selectedCompanyId : company?.id;
      
      if (!targetCompanyId || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Load L1 and L2 data from user's company
        const [l1, l2] = await Promise.all([
          api.l1Get(targetCompanyId, selectedPeriod),
          api.l2Get(targetCompanyId, selectedPeriod)
        ]);

        // Load L4 snapshots from user's company
        const l4Response = await api.snapshots(targetCompanyId);
        const l4 = l4Response.snapshots || [];

        setL1Data(l1);
        setL2Data(l2);
        setL4Data(l4);
        setHasData(l1.length > 0 || l2.length > 0 || l4.length > 0);
        
        // Check if we have enough historical data for graphs (6+ consecutive months)
        const sortedSnapshots = l4.sort((a, b) => a.period.localeCompare(b.period));
        setHistoricalData(sortedSnapshots);
        setShowGraphs(sortedSnapshots.length >= 6);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [company?.id, selectedCompanyId, selectedPeriod, isAuthenticated, user?.role, isExporting]);

  // Get the latest snapshot for the selected period
  const currentSnapshot = l4Data.find(snapshot => 
    snapshot.period.startsWith(selectedPeriod)
  ) || l4Data[l4Data.length - 1];

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show message for admin users when no company is selected
  if (user?.role === 'ADMIN' && !selectedCompanyId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-bold text-gray-900">Select a Company</h1>
            <p className="mt-2 text-lg text-gray-600">
              As an admin, please select a company to view its dashboard data.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              You can view data for any company in the system.
            </p>
            
            {/* Company Selector */}
            <div className="mt-8 max-w-md mx-auto">
              {loadingCompanies ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading companies...</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Company:</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a company...</option>
                    {availableCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-400">
              Debug: User role: {user?.role}, Loading: {loadingCompanies ? 'Yes' : 'No'}, Companies: {availableCompanies.length}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show no data message if no framework data exists
  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-bold text-gray-900">No Framework Data</h1>
            <p className="mt-2 text-lg text-gray-600">
              {user?.role === 'ADMIN' 
                ? `No framework data found for the selected company.`
                : `You haven't set up your TBM framework yet.`
              }
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'ADMIN' 
                ? `The selected company may not have completed the framework entry process.`
                : `Complete the framework entry process to see your dashboard data.`
              }
            </p>
            {user?.role !== 'ADMIN' && (
              <div className="mt-8">
                <a
                  href="/framework"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Set Up Framework
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div id="dashboard-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TBM Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Technology Business Management insights for {
              user?.role === 'ADMIN' && selectedCompanyId 
                ? availableCompanies.find(c => c.id === selectedCompanyId)?.name || 'selected company'
                : company?.name || 'your company'
            }
          </p>
          
          {/* Period Selector */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                );
              })}
            </select>
            
            <label className="text-sm font-medium text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            {/* Company Selector for Admin Users */}
            {user?.role === 'ADMIN' && (
              <>
                <label className="text-sm font-medium text-gray-700">Company:</label>
                {loadingCompanies ? (
                  <div className="text-sm text-gray-500">Loading companies...</div>
                ) : (
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a Company</option>
                    {availableCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                )}
                {/* Debug info */}
                <div className="text-xs text-gray-400">
                  Debug: User role: {user?.role}, Loading: {loadingCompanies ? 'Yes' : 'No'}, Companies: {availableCompanies.length}
                </div>
              </>
            )}

            {/* Toggle Graphs Button (only show if we have enough data) */}
            {historicalData.length >= 6 && (
              <button
                type="button"
                onClick={() => setShowGraphs(!showGraphs)}
                className="inline-flex items-center px-3 py-2 rounded-md bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {showGraphs ? 'Hide Graphs' : 'Show Graphs'}
              </button>
            )}

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const el = document.getElementById('dashboard-root');
                  if (!el) {
                    alert('Dashboard element not found. Please refresh the page and try again.');
                    return;
                  }
                  
                  // Set exporting flag to prevent API calls during export
                  setIsExporting(true);
                  
                  await exportElementToPdf(el, `dashboard-${selectedPeriod}.pdf`);
                } catch (error) {
                  console.error('PDF export failed:', error);
                  alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
                } finally {
                  // Clear exporting flag
                  setIsExporting(false);
                }
              }}
              className="ml-auto inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Export PDF
            </button>
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
                  {formatCurrency(l1Data.reduce((sum, dept) => sum + Number(dept.budget), 0))}
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
                  {l1Data.reduce((sum, dept) => sum + dept.employees, 0)}
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
                  {currentSnapshot ? formatPercentage(currentSnapshot.roiPct) : 'N/A'}
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
                  {currentSnapshot ? formatCurrency(currentSnapshot.totalBenefit - currentSnapshot.totalCost) : 'N/A'}
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
            {l1Data.length > 0 ? (
              <div className="space-y-4">
                {mergeSort([...l1Data], (a, b) => Number(b.budget) - Number(a.budget)).map((dept, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{dept.department}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-900">{formatCurrency(Number(dept.budget))}</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(Number(dept.budget) / Math.max(...l1Data.map(d => Number(d.budget)))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No L1 data available for this period</p>
            )}
          </div>

          {/* L2 - Tower Allocation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">L2 - Tower Allocation</h3>
            {l2Data.length > 0 ? (
              <div className="space-y-4">
                {l2Data.map((tower, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{tower.tower}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-900">{formatPercentage(tower.weightPct * 100)}</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${tower.weightPct * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No L2 data available for this period</p>
            )}
          </div>
        </div>

        {/* L4 - ROI Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">L4 - ROI Analysis</h3>
          {currentSnapshot ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Financial Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Cost:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(currentSnapshot.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Benefit:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(currentSnapshot.totalBenefit)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Net Benefit:</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(currentSnapshot.totalBenefit - currentSnapshot.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ROI:</span>
                    <span className="text-sm font-bold text-blue-600">{formatPercentage(currentSnapshot.roiPct)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Assumptions</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue Uplift:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(currentSnapshot.assumptions.revenueUplift)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Productivity Hours:</span>
                    <span className="text-sm font-medium text-gray-900">{currentSnapshot.assumptions.productivityGainHours.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Loaded Rate:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(currentSnapshot.assumptions.avgLoadedRate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No ROI snapshot available for this period</p>
          )}
        </div>

        {/* Revenue/Return Projection Graphs */}
        {showGraphs && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue & Return Projections</h3>
            <p className="text-sm text-gray-600 mb-6">
              Based on {historicalData.length} months of historical data
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Projection Chart */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">Revenue Trend</h4>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {historicalData.map((snapshot, index) => {
                    const maxRevenue = Math.max(...historicalData.map(s => s.totalBenefit));
                    const height = (snapshot.totalBenefit / maxRevenue) * 200;
                    const month = new Date(snapshot.period).toLocaleDateString('en-US', { month: 'short' });
                    
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}px` }}></div>
                        <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left">
                          {month}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatCurrency(snapshot.totalBenefit)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ROI Trend Chart */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-4">ROI Trend</h4>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {historicalData.map((snapshot, index) => {
                    const maxROI = Math.max(...historicalData.map(s => s.roiPct));
                    const minROI = Math.min(...historicalData.map(s => s.roiPct));
                    const range = maxROI - minROI;
                    const normalizedROI = range > 0 ? (snapshot.roiPct - minROI) / range : 0.5;
                    const height = normalizedROI * 200;
                    const month = new Date(snapshot.period).toLocaleDateString('en-US', { month: 'short' });
                    
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className={`w-full rounded-t ${snapshot.roiPct >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ height: `${height}px` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left">
                          {month}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatPercentage(snapshot.roiPct)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Projection Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Projection Summary</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Average Monthly Revenue:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatCurrency(historicalData.reduce((sum, s) => sum + s.totalBenefit, 0) / historicalData.length)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Average ROI:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatPercentage(historicalData.reduce((sum, s) => sum + s.roiPct, 0) / historicalData.length)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Trend:</span>
                  <span className={`ml-2 font-medium ${
                    historicalData[historicalData.length - 1]?.roiPct > historicalData[0]?.roiPct 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {historicalData[historicalData.length - 1]?.roiPct > historicalData[0]?.roiPct ? '↗ Improving' : '↘ Declining'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400">ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Authentication Required:</strong> Please log in to view your TBM framework data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

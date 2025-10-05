// client/src/pages/FrameworkEntry.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { api, type Department, } from '../lib/api';

export default function FrameworkEntry() {
  // auth / context
  const { user, company } = useAuth();

  // period YYYY-MM (we send YYYY-MM-01 to the server)
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));

  // Current step in the framework entry process
  const [currentStep, setCurrentStep] = useState<number>(1);
  // const totalSteps = 4;

  // Admin company selection
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<{ id: string; name: string; domain: string }[]>([]);

  // --- L1 - inputs
  const [dept, setDept] = useState<Department>('ENGINEERING');
  const [employees, setEmployees] = useState<number>(10);
  const [budget, setBudget] = useState<number>(200000);

  // --- L2 - tower weights; must sum to 1
  const [appDev, setAppDev] = useState<number>(0.7);
  const [cloud, setCloud] = useState<number>(0.3);
  const [endUser, setEndUser] = useState<number>(0);

  // --- L3 - benefit weights; must sum to 1
  const [prod, setProd] = useState<number>(0.6);
  const [rev, setRev] = useState<number>(0.4);

  // --- L4 - assumptions for snapshot / ROI
  const [uplift, setUplift] = useState<number>(100000);
  const [hours, setHours] = useState<number>(400);
  const [rate, setRate] = useState<number>(50);

  // Loading and success states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // loading companies for admin users
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      // Load all companies for admin users
      api.getCompanies().then(setAvailableCompanies).catch(() => setAvailableCompanies([]));
    }
  }, [user?.role]);

  if (!user) return <div className="text-sm">Please login.</div>;
  
  // For admin users, use selected company; for regular users, use their own company
  const companyId = user.role === 'ADMIN' ? selectedCompanyId : user.companyId;
  const full = `${period}-01`; // server expects YYYY-MM-DD

  // Validation: Admin users must select a company, regular users must have a company
  if (user.role === 'ADMIN' && !selectedCompanyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Select a Company</h1>
          <p className="text-gray-600">Please select a company to enter framework data for.</p>
        </div>
      </div>
    );
  }

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

  // ----- Actions -----
  async function saveL1() {
    if (!companyId) {
      setErrorMessage('No company in context');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await api.l1Upsert({
        companyId,
        period: full,
        department: dept,
        employees,
        budget,
      });
      setSuccessMessage('L1 Operational inputs saved successfully!');
      setCurrentStep(2);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save L1 data');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveL2() {
    if (!companyId) {
      setErrorMessage('No company in context');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await Promise.all([
        api.l2Upsert({ companyId, period: full, department: dept, tower: 'APP_DEV', weightPct: appDev }),
        api.l2Upsert({ companyId, period: full, department: dept, tower: 'CLOUD', weightPct: cloud }),
        api.l2Upsert({ companyId, period: full, department: dept, tower: 'END_USER', weightPct: endUser }),
      ]);
      setSuccessMessage('L2 Allocation weights saved successfully!');
      setCurrentStep(3);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save L2 data');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveL3() {
    if (!companyId) {
      setErrorMessage('No company in context');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await Promise.all([
        api.l3Upsert({ companyId, period: full, category: 'PRODUCTIVITY', weightPct: prod }),
        api.l3Upsert({ companyId, period: full, category: 'REVENUE_UPLIFT', weightPct: rev }),
      ]);
      setSuccessMessage('L3 Benefit weights saved successfully!');
      setCurrentStep(4);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save L3 data');
    } finally {
      setIsLoading(false);
    }
  }

  async function computeAndSave() {
    if (!companyId) {
      setErrorMessage('No company in context');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.snapshot({
        companyId,
        period: full,
        assumptions: {
          revenueUplift: uplift,
          productivityGainHours: hours,
          avgLoadedRate: rate,
        },
      });
      setSuccessMessage('ROI snapshot computed and saved successfully! Framework setup complete.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to compute snapshot');
    } finally {
      setIsLoading(false);
    }
  }

  // helpers for numeric inputs
  const num = (v: string) => Number(v);

  // Step navigation
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TBM Framework Entry</h1>
          <p className="mt-2 text-gray-600">
            Set up your Technology Business Management framework step by step
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step}
                </div>
                <div className="ml-2 text-sm font-medium text-gray-700">
                  {step === 1 && 'L1: Operational Inputs'}
                  {step === 2 && 'L2: Allocation Weights'}
                  {step === 3 && 'L3: Benefit Weights'}
                  {step === 4 && 'L4: ROI Assumptions'}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reporting Period</h3>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Period (YYYY-MM)
            </label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Company Selection for Admin Users Only */}
        {user.role === 'ADMIN' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Selection</h3>
            <p className="text-sm text-gray-600 mb-4">As an admin, you can enter data for any company.</p>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Company
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a company...</option>
                {availableCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} {company.domain && `(${company.domain})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Company Info for Regular Users */}
        {user.role !== 'ADMIN' && company && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
            <p className="text-sm text-gray-600 mb-2">You are entering data for:</p>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="font-medium text-gray-900">{company.name}</p>
              {company.domain && <p className="text-sm text-gray-600">{company.domain}</p>}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow">
          {/* L1 Step */}
          {currentStep === 1 && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">L1 - Operational Inputs</h3>
              <p className="text-gray-600 mb-6">Enter your department's operational data for the selected period.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value as Department)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(['ENGINEERING', 'SALES', 'FINANCE', 'HR', 'MARKETING', 'OPERATIONS'] as Department[]).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
                  <input
                    type="number"
                    min={0}
                    value={employees}
                    onChange={(e) => setEmployees(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(e) => setBudget(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveL1}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save L1 Data'}
                </button>
              </div>
            </div>
          )}

          {/* L2 Step */}
          {currentStep === 2 && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">L2 - Allocation Weights</h3>
              <p className="text-gray-600 mb-6">Define how your budget is allocated across technology towers. Weights must sum to 1.0.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Development</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={appDev}
                    onChange={(e) => setAppDev(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cloud Services</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={cloud}
                    onChange={(e) => setCloud(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End User Computing</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={endUser}
                    onChange={(e) => setEndUser(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Weight:</span>
                  <span className={`text-sm font-bold ${
                    Math.abs((appDev + cloud + endUser) - 1) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(appDev + cloud + endUser).toFixed(3)}
                  </span>
                </div>
                {Math.abs((appDev + cloud + endUser) - 1) >= 0.01 && (
                  <p className="text-xs text-red-600 mt-1">Weights must sum to 1.0</p>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={saveL2}
                  disabled={isLoading || Math.abs((appDev + cloud + endUser) - 1) >= 0.01}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save L2 Data'}
                </button>
              </div>
            </div>
          )}

          {/* L3 Step */}
          {currentStep === 3 && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">L3 - Benefit Weights</h3>
              <p className="text-gray-600 mb-6">Define the expected benefit categories. Weights must sum to 1.0.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Gains</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={prod}
                    onChange={(e) => setProd(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Uplift</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={rev}
                    onChange={(e) => setRev(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Weight:</span>
                  <span className={`text-sm font-bold ${
                    Math.abs((prod + rev) - 1) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(prod + rev).toFixed(3)}
                  </span>
                </div>
                {Math.abs((prod + rev) - 1) >= 0.01 && (
                  <p className="text-xs text-red-600 mt-1">Weights must sum to 1.0</p>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={saveL3}
                  disabled={isLoading || Math.abs((prod + rev) - 1) >= 0.01}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save L3 Data'}
                </button>
              </div>
            </div>
          )}

          {/* L4 Step */}
          {currentStep === 4 && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">L4 - ROI Assumptions</h3>
              <p className="text-gray-600 mb-6">Enter your assumptions for calculating ROI and benefits.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Uplift ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={uplift}
                    onChange={(e) => setUplift(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Gain (Hours)</label>
                  <input
                    type="number"
                    min={0}
                    value={hours}
                    onChange={(e) => setHours(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Average Loaded Rate ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={rate}
                    onChange={(e) => setRate(num(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={computeAndSave}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Computing...' : 'Compute & Save ROI Snapshot'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">✗</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

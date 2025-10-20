import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { api, type Department, } from '../lib/api';
import { getDatabaseValue, getAllDisplayLabels, type DisplayDepartment } from '../utils/departmentLabels';

export default function FrameworkEntry() {
  const { user, company } = useAuth();
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7));
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Admin switch between companies
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<{ id: string; name: string; domain: string }[]>([]);

  // L1 data with display departments overlayed
  const [dept, setDept] = useState<Department>('ENGINEERING'); //from prisma schema
  const [displayDept, setDisplayDept] = useState<DisplayDepartment>('Labour'); //shows on UI
  const [employees, setEmployees] = useState<number>(0);
  const [budget, setBudget] = useState<number>(0);

  // L2 technology towers
  const [appDev, setAppDev] = useState<number>(0);
  const [cloud, setCloud] = useState<number>(0);
  const [endUser, setEndUser] = useState<number>(0);

  // L3 benefit weights
  const [prod, setProd] = useState<number>(0);
  const [rev, setRev] = useState<number>(0);

  // L4 assumptions data
  const [uplift, setUplift] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Tracking validation errors for all form inputs
  const [validationErrors, setValidationErrors] = useState<{
    employees?: string;
    budget?: string;
    appDev?: string;
    cloud?: string;
    endUser?: string;
    prod?: string;
    rev?: string;
    uplift?: string;
    hours?: string;
    rate?: string;
  }>({});

  // load companies for admin users
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      // Load all companies for admin users
      api.getCompanies().then(setAvailableCompanies).catch(() => setAvailableCompanies([]));
    }
  }, [user?.role]);

  if (!user) return <div className="text-sm">Please login.</div>;
  
  
  const full = `${period}-01`; // server normalising date to be in the 1st of month

  // Check if EMPLOYEE has a company
  if (user.role !== 'ADMIN' && !user.companyId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Company Assigned</h1>
          <p className="text-gray-600">You are not assigned to any company. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

//l1save 
  async function saveL1() {
    // Check for validation errors
    if (validationErrors.employees || validationErrors.budget) {
      setErrorMessage('Please fix validation errors before saving');
      return;
    }
    
    // Use the user's actual company ID for L1 operations
    const targetCompanyId = user?.role === 'ADMIN' && selectedCompanyId ? selectedCompanyId : user?.companyId;
    
    if (!targetCompanyId) {
      setErrorMessage('No company in context');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await api.l1Upsert({
        companyId: targetCompanyId,
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

//l2 save
  async function saveL2() {
    // Check for individual field validation errors
    if (validationErrors.appDev || validationErrors.cloud || validationErrors.endUser) {
      setErrorMessage('Please fix validation errors before saving');
      return;
    }
    
    // Check if weights sum to 1.0
    const sumError = validateL2Sum();
    if (sumError) {
      setErrorMessage(sumError);
      return;
    }
    
    // Use the user's actual company ID for L2 operations
    const targetCompanyId = user?.role === 'ADMIN' && selectedCompanyId ? selectedCompanyId : user?.companyId;
    
    if (!targetCompanyId) {
      setErrorMessage('No company in context');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await api.l2Upsert({ companyId: targetCompanyId, period: full, department: dept, tower: 'APP_DEV', weightPct: appDev });
      await api.l2Upsert({ companyId: targetCompanyId, period: full, department: dept, tower: 'CLOUD', weightPct: cloud });
      await api.l2Upsert({ companyId: targetCompanyId, period: full, department: dept, tower: 'END_USER', weightPct: endUser });
      setSuccessMessage('L2 Allocation weights saved successfully!');
      setCurrentStep(3);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save L2 data');
    } finally {
      setIsLoading(false);
    }
  }
//l3save
  async function saveL3() {
    // Check for individual errors
    if (validationErrors.prod || validationErrors.rev) {
      setErrorMessage('Please fix validation errors before saving');
      return;
    }
    
    // Check if weights sum to 1.0
    const sumError = validateL3Sum();
    if (sumError) {
      setErrorMessage(sumError);
      return;
    }
    
    // Use the user's actual company ID for L3 operations
    const targetCompanyId = user?.role === 'ADMIN' && selectedCompanyId ? selectedCompanyId : user?.companyId;
    
    if (!targetCompanyId) {
      setErrorMessage('No company in context');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.l3Upsert({ companyId: targetCompanyId, period: full, category: 'PRODUCTIVITY', weightPct: prod });
      await api.l3Upsert({ companyId: targetCompanyId, period: full, category: 'REVENUE_UPLIFT', weightPct: rev });
      setSuccessMessage('L3 Benefit weights saved successfully!');
      setCurrentStep(4);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save L3 data');
    } finally {
      setIsLoading(false);
    }
  }

//l4 compute and save

  async function computeAndSave() {
    // Check for validation errors
    if (validationErrors.uplift || validationErrors.hours || validationErrors.rate) {
      setErrorMessage('Please fix validation errors before saving');
      return;
    }
    
    // Use the user's actual company ID for L4 computation (same as L1, L2, L3)
    const targetCompanyId = user?.role === 'ADMIN' && selectedCompanyId ? selectedCompanyId : user?.companyId;
    
    if (!targetCompanyId) {
      setErrorMessage('No company in context');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Use the snapshot calculation that actually works
      const result = await api.snapshot({
        companyId: targetCompanyId,
        period: full,
        assumptions: {
          revenueUplift: uplift,
          productivityGainHours: hours,
          avgLoadedRate: rate,
        },
      });
      
      setSuccessMessage(`ROI calculated successfully! Total Cost: $${result.totalCost.toLocaleString()}, Total Benefit: $${result.totalBenefit.toLocaleString()}, ROI: ${result.roiPct.toFixed(1)}%`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to compute ROI');
    } finally {
      setIsLoading(false);
    }
  }


  const num = (v: string) => Number(v);

  // Boundary validation functions
  const validateEmployees = (value: number): string | null => {
    if (value < 0) return 'Number of employees cannot be negative';
    if (value > 100000) return 'Number of employees cannot exceed 100,000';
    if (!Number.isInteger(value)) return 'Number of employees must be a whole number';
    return null;
  };

  const validateBudget = (value: number): string | null => {
    if (value < 0) return 'Budget cannot be negative';
    if (value > 10000000) return 'Budget cannot exceed $10,000,000';
    return null;
  };

  const validateWeight = (value: number, fieldName: string): string | null => {
    if (value < 0) return `${fieldName} cannot be negative`;
    if (value > 1) return `${fieldName} cannot exceed 1.0`;
    return null;
  };

  // Check if L2 weights sum to 1.0
  const validateL2Sum = (): string | null => {
    const sum = appDev + cloud + endUser;
    if (Math.abs(sum - 1) >= 0.0001) {
      return `Weights must sum to 1.0 (current sum: ${sum.toFixed(3)})`;
    }
    return null;
  };

  // Check if L3 weights sum to 1.0
  const validateL3Sum = (): string | null => {
    const sum = prod + rev;
    if (Math.abs(sum - 1) >= 0.0001) {
      return `Weights must sum to 1.0 (current sum: ${sum.toFixed(3)})`;
    }
    return null;
  };

  const validateUplift = (value: number): string | null => {
    if (value < 0) return 'Revenue uplift cannot be negative';
    if (value > 10000000) return 'Revenue uplift cannot exceed $10,000,000';
    return null;
  };

  const validateHours = (value: number): string | null => {
    if (value < 0) return 'Productivity hours cannot be negative';
    if (value > 100000) return 'Productivity hours cannot exceed 100,000';
    return null;
  };

  const validateRate = (value: number): string | null => {
    if (value < 0) return 'Average loaded rate cannot be negative';
    if (value > 10000) return 'Average loaded rate cannot exceed $10,000';
    return null;
  };

  // Update validation errors when values change
  const updateValidationError = (field: string, value: number) => {
    let error: string | null = null;
    
    switch (field) {
      case 'employees':
        error = validateEmployees(value);
        break;
      case 'budget':
        error = validateBudget(value);
        break;
      case 'appDev':
        error = validateWeight(value, 'Applications weight');
        break;
      case 'cloud':
        error = validateWeight(value, 'Infrastructure weight');
        break;
      case 'endUser':
        error = validateWeight(value, 'Operations weight');
        break;
      case 'prod':
        error = validateWeight(value, 'Productivity weight');
        break;
      case 'rev':
        error = validateWeight(value, 'Revenue weight');
        break;
      case 'uplift':
        error = validateUplift(value);
        break;
      case 'hours':
        error = validateHours(value);
        break;
      case 'rate':
        error = validateRate(value);
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || undefined
    }));
  };

  // Handle department selection change
  const handleDepartmentChange = (displayValue: DisplayDepartment) => {
    setDisplayDept(displayValue);
    setDept(getDatabaseValue(displayValue));
  };

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
                    ? 'bg-blue-600 border-blue-600 text-gray-900' 
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}>
                  {step}
                </div>
                <div className="ml-2 text-sm font-medium text-gray-600">
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    value={displayDept}
                    onChange={(e) => handleDepartmentChange(e.target.value as DisplayDepartment)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
    {getAllDisplayLabels().map(
      (label) => (
        <option key={label} value={label}>
          {label}
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
                    max={100000}
                    value={employees}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setEmployees(value);
                      updateValidationError('employees', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.employees ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.employees && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.employees}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                  <input
                    type="number"
                    min={0}
                    max={10000000}
                    value={budget}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setBudget(value);
                      updateValidationError('budget', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.budget ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.budget && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.budget}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveL1}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-gray-900 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Applications</label>
                  <p className="text-xs text-gray-500 mb-2">Software applications and data platforms</p>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={appDev}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setAppDev(value);
                      updateValidationError('appDev', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.appDev ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.appDev && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.appDev}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Infrastructure</label>
                  <p className="text-xs text-gray-500 mb-2">Core technology infrastructure and foundational systems</p>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={cloud}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setCloud(value);
                      updateValidationError('cloud', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.cloud ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.cloud && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.cloud}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Operations</label>
                  <p className="text-xs text-gray-500 mb-2">IT operations, security, and governance</p>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={endUser}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setEndUser(value);
                      updateValidationError('endUser', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.endUser ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.endUser && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.endUser}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Weight:</span>
                  <span className={`text-sm font-bold ${
                    Math.abs((appDev + cloud + endUser) - 1) < 0.0001 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {(appDev + cloud + endUser).toFixed(3)}
                  </span>
                </div>
                {Math.abs((appDev + cloud + endUser) - 1) >= 0.0001 && (
                  <p className="text-xs text-red-800 mt-1">Weights must sum to 1.0 (current sum: {(appDev + cloud + endUser).toFixed(3)})</p>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={saveL2}
                  disabled={isLoading || Math.abs((appDev + cloud + endUser) - 1) >= 0.0001 || !!validationErrors.appDev || !!validationErrors.cloud || !!validationErrors.endUser}
                  className="px-6 py-2 bg-blue-600 text-gray-900 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setProd(value);
                      updateValidationError('prod', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.prod ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.prod && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.prod}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Uplift</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={rev}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setRev(value);
                      updateValidationError('rev', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.rev ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.rev && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.rev}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Weight:</span>
                  <span className={`text-sm font-bold ${
                    Math.abs((prod + rev) - 1) < 0.0001 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {(prod + rev).toFixed(3)}
                  </span>
                </div>
                {Math.abs((prod + rev) - 1) >= 0.0001 && (
                  <p className="text-xs text-red-800 mt-1">Weights must sum to 1.0 (current sum: {(prod + rev).toFixed(3)})</p>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={saveL3}
                  disabled={isLoading || Math.abs((prod + rev) - 1) >= 0.0001 || !!validationErrors.prod || !!validationErrors.rev}
                  className="px-6 py-2 bg-blue-600 text-gray-900 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    max={10000000}
                    value={uplift}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setUplift(value);
                      updateValidationError('uplift', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.uplift ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.uplift && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.uplift}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Gain (Hours)</label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={hours}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setHours(value);
                      updateValidationError('hours', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.hours ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.hours && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.hours}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Average Loaded Rate ($)</label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={rate}
                    onChange={(e) => {
                      const value = num(e.target.value);
                      setRate(value);
                      updateValidationError('rate', value);
                    }}
                    className={`w-full border rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.rate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.rate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.rate}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={computeAndSave}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-gray-900 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span className="text-green-800">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-800">✗</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

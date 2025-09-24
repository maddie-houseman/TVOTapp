// import { useState } from 'react';
import { useDemo } from '../contexts/DemoContext';

export default function Account() {
  const { user, company, isDemoMode } = useDemo();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account and company information
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* User Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={user.name}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={user.role}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                  <input
                    type="text"
                    value={user.id}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={company.name}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <input
                    type="text"
                    value={company.domain}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company ID</label>
                  <input
                    type="text"
                    value={company.id}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Demo Mode Notice */}
            {isDemoMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Demo Mode Active:</strong> This account information is simulated. 
                      Once database connectivity is restored, you'll see your actual account details here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                disabled
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 cursor-not-allowed"
              >
                Edit Profile
              </button>
              <button
                type="button"
                disabled
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 cursor-not-allowed"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

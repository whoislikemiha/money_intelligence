"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { accountApi, Account } from '@/lib/api';
import TransactionManager from '@/components/TransactionManager';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !loading) {
      loadAccount();
    }
  }, [user, loading]);

  const loadAccount = async () => {
    try {
      setAccountLoading(true);
      const accountData = await accountApi.getMyAccount();
      setAccount(accountData);
    } catch (error) {
      console.error('Failed to load account:', error);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditValue(account?.initial_balance.toString() || '0');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const newValue = parseFloat(editValue);
      if (isNaN(newValue)) {
        alert('Please enter a valid number');
        return;
      }

      const updatedAccount = await accountApi.updateInitialBalance(newValue);
      setAccount(updatedAccount);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update initial balance:', error);
      alert('Failed to update initial balance');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-green-950">
      <nav className="bg-gray-200 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-green-700">Money Intelligence</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={() => router.push('/dashboard/categories')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Categories
              </button>
              <button
                onClick={() => router.push('/dashboard/budgets')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Budgets
              </button>
              <button
                onClick={() => router.push('/dashboard/tags')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Tags
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-6">
                <div className="flex-1 min-w-[200px]">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <dt className="text-sm font-medium text-gray-500">Currency</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.currency}</dd>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </dd>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              {accountLoading ? (
                <div className="text-center">Loading account information...</div>
              ) : account ? (
                <div className="flex flex-wrap gap-x-4 gap-y-6">
                  <div className="flex-1 min-w-[200px]">
                    <dt className="text-sm font-medium text-gray-500">Account Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{account.name}</dd>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <dt className="text-xl font-medium text-gray-500">Current Balance</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {account.current_balance.toFixed(2)} {user.currency}
                    </dd>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <dt className="text-sm font-medium text-gray-500">Initial Balance</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                            autoFocus
                          />
                          <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{account.initial_balance.toFixed(2)} {user.currency}</span>
                          <button
                            onClick={handleEditClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </dd>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(account.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  No account information available
                </div>
              )}
            </div>

            {/* Transactions Section */}
            {account && (
              <div className="mt-6">
                <TransactionManager
                  accountId={account.id}
                  onTransactionChange={loadAccount}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
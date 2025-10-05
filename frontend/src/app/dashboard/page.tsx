"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { accountApi, Account, MonthlyStats } from '@/lib/api';
import TransactionManager from '@/components/TransactionManager';
import BudgetManager from '@/components/BudgetManager';
import { Navbar } from '@/components/navbar';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('0');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !loading) {
      loadAccounts();
    }
  }, [user, loading]);

  const loadAccounts = async () => {
    try {
      setAccountLoading(true);
      const accountsData = await accountApi.getAll();
      setAccounts(accountsData);

      // If no accounts exist, show create form
      if (accountsData.length === 0) {
        setShowCreateAccount(true);
      } else {
        // Select first account by default if none selected
        if (!selectedAccount && accountsData.length > 0) {
          setSelectedAccount(accountsData[0]);
        } else if (selectedAccount) {
          // Update selected account with fresh data
          const updated = accountsData.find(acc => acc.id === selectedAccount.id);
          if (updated) {
            setSelectedAccount(updated);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      loadMonthlyStats();
    }
  }, [selectedAccount]);

  const loadMonthlyStats = async () => {
    if (!selectedAccount) return;

    try {
      const statsData = await accountApi.getMonthlyStats(selectedAccount.id);
      setMonthlyStats(statsData);
    } catch (error) {
      console.error('Failed to load monthly stats:', error);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const balance = parseFloat(newAccountBalance);
      if (isNaN(balance)) {
        alert('Please enter a valid balance');
        return;
      }

      await accountApi.create({
        name: newAccountName || 'New Account',
        initial_balance: balance,
        currency: 'EUR', // Default currency, can be changed in settings
      });

      setNewAccountName('');
      setNewAccountBalance('0');
      setShowCreateAccount(false);
      await loadAccounts();
    } catch (error) {
      console.error('Failed to create account:', error);
      alert('Failed to create account');
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      await accountApi.delete(accountId);
      await loadAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    }
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
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={(accountId) => {
          const account = accounts.find(acc => acc.id === accountId);
          setSelectedAccount(account || null);
        }}
      />
      <main className="container mx-auto py-6 px-4 flex-1 min-h-0">
        {accountLoading ? (
          <div className="flex items-center justify-center py-8">
            <div>Loading accounts...</div>
          </div>
        ) : accounts.length === 0 && !showCreateAccount ? (
          <div className="text-center py-8">
            <p className="mb-4">No accounts found</p>
            <button
              onClick={() => setShowCreateAccount(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Create Account
            </button>
          </div>
        ) : showCreateAccount ? (
          <div className="max-w-md mx-auto bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Create Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Main Account"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAccount}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Create
                </button>
                {accounts.length > 0 && (
                  <button
                    onClick={() => setShowCreateAccount(false)}
                    className="flex-1 px-4 py-2 border rounded-md hover:bg-accent"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : selectedAccount && monthlyStats ? (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Transactions Section */}
            <div className="flex-1 min-w-0">
              <TransactionManager
                accountId={selectedAccount.id}
                onTransactionChange={loadAccounts}
              />
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-96 flex-shrink-0 flex flex-col gap-6 overflow-y-auto">
              {/* Balance Card */}
              <div className="bg-card border rounded-lg p-6 flex-shrink-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold mt-1">
                      {Number(selectedAccount.current_balance).toFixed(2)} {selectedAccount.currency}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">This Month Income</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">
                        {Number(monthlyStats.monthly_income).toFixed(2)} {selectedAccount.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">This Month Expenses</p>
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400 mt-1">
                        {Number(monthlyStats.monthly_expenses).toFixed(2)} {selectedAccount.currency}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budgets */}
              <BudgetManager />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { accountApi, categoryApi } from '@/lib/api';
import { TransactionType, Category, Account, MonthlyStats } from '@/lib/types';
import TransactionManager from '@/components/TransactionManager';
import BudgetManager from '@/components/BudgetManager';
import TransactionActions from '@/components/TransactionActions';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, List } from 'lucide-react';

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [balanceViewType, setBalanceViewType] = useState<'all' | 'income' | 'expense' | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balancesVisible, setBalancesVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('balancesVisible');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const toggleBalancesVisibility = () => {
    const newValue = !balancesVisible;
    setBalancesVisible(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('balancesVisible', JSON.stringify(newValue));
    }
  };

  const formatBalance = (amount: number, currency: string) => {
    if (balancesVisible) {
      return `${amount.toFixed(2)} ${currency}`;
    }
    return '••••••';
  };

  const getTransactionsTitle = () => {
    if (selectedCategoryId) {
      const category = categories.find(c => c.id === selectedCategoryId);
      return category ? `${category.icon} ${category.name} - This Month` : 'Transactions';
    }
    if (balanceViewType === 'all') {
      return 'All Transactions';
    }
    if (balanceViewType === 'income') {
      return 'Income - This Month';
    }
    if (balanceViewType === 'expense') {
      return 'Expenses - This Month';
    }
    return 'Transactions';
  };

  const handleCloseTransactions = () => {
    setSelectedCategoryId(null);
    setBalanceViewType(null);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !loading) {
      loadAccounts();
      loadCategories();
    }
  }, [user, loading]);

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

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
        balancesVisible={balancesVisible}
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
          <div className="flex flex-col gap-6 h-full overflow-hidden">
            {/* Transaction Actions */}
            <div className="flex justify-between items-center ">

              {/* Balance Card */}
              <div className="flex items-center gap-2">
                <div className="bg-card border rounded-lg flex-shrink-0 overflow-hidden">
                  <div className="flex">
                    <div
                      className={`p-6 cursor-pointer transition-all hover:bg-accent ${balanceViewType === 'all' ? 'bg-accent ring-2 ring-primary' : ''
                        }`}
                      onClick={() => {
                        setBalanceViewType(balanceViewType === 'all' ? null : 'all');
                        setSelectedCategoryId(null);
                      }}
                    >
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-xl font-bold mt-1">
                        {formatBalance(Number(selectedAccount.current_balance), selectedAccount.currency)}
                      </p>
                    </div>
                    <div className="border-l" />
                    <div
                      className={`p-6 cursor-pointer transition-all hover:bg-accent ${balanceViewType === 'income' ? 'bg-accent ring-2 ring-primary' : ''
                        }`}
                      onClick={() => {
                        setBalanceViewType(balanceViewType === 'income' ? null : 'income');
                        setSelectedCategoryId(null);
                      }}
                    >
                      <p className="text-sm text-muted-foreground">This Month Income</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatBalance(Number(monthlyStats.monthly_income), selectedAccount.currency)}
                      </p>
                    </div>
                    <div className="border-l" />
                    <div
                      className={`p-6 cursor-pointer transition-all hover:bg-accent ${balanceViewType === 'expense' ? 'bg-accent ring-2 ring-primary' : ''
                        }`}
                      onClick={() => {
                        setBalanceViewType(balanceViewType === 'expense' ? null : 'expense');
                        setSelectedCategoryId(null);
                      }}
                    >
                      <p className="text-sm text-muted-foreground">This Month Expenses</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {formatBalance(Number(monthlyStats.monthly_expenses), selectedAccount.currency)}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleBalancesVisibility}
                  title={balancesVisible ? 'Hide balances' : 'Show balances'}
                >
                  {balancesVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2 justify-end flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBalanceViewType('all');
                    setSelectedCategoryId(null);
                  }}
                >
                  <List className="mr-2 h-4 w-4" />
                  View All Transactions
                </Button>
                <TransactionActions
                  accountId={selectedAccount.id}
                  onTransactionCreated={loadAccounts}
                />
              </div>

            </div>
            {/* Balance Card and Budgets Row */}
            <div className="flex gap-6 flex-shrink-0">

              {/* Budgets - Main Content */}
              <div className="flex-1 min-w-0">
                <BudgetManager
                  selectedCategoryId={selectedCategoryId}
                  onBudgetClick={(categoryId) => {
                    setSelectedCategoryId(selectedCategoryId === categoryId ? null : categoryId);
                    setBalanceViewType(null);
                  }}
                />
              </div>
            </div>

            {/* Transactions - Show when budget or balance section selected */}
            {(selectedCategoryId || balanceViewType) && (
              <div className="flex-1 min-h-0">
                <TransactionManager
                  key={selectedCategoryId ? `category-${selectedCategoryId}` : `balance-${balanceViewType}`}
                  accountId={selectedAccount.id}
                  onTransactionChange={loadAccounts}
                  initialFilters={
                    selectedCategoryId
                      ? {
                        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
                        categoryIds: [selectedCategoryId],
                        tagIds: [],
                      }
                      : balanceViewType === 'all'
                        ? {
                          startDate: '',
                          endDate: '',
                          categoryIds: [],
                          tagIds: [],
                        }
                        : balanceViewType === 'income'
                          ? {
                            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
                            categoryIds: [],
                            tagIds: [],
                            type: TransactionType.INCOME,
                          }
                          : {
                            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                            endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
                            categoryIds: [],
                            tagIds: [],
                            type: TransactionType.EXPENSE,
                          }
                  }
                  showHeader={false}
                  customTitle={getTransactionsTitle()}
                  onClose={handleCloseTransactions}
                />
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { accountApi, Account } from '@/lib/api';
import TransactionManager from '@/components/TransactionManager';
import BudgetManager from '@/components/BudgetManager';
import { Navbar } from '@/components/navbar';

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
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <main className="container mx-auto py-6 px-4 flex-1 min-h-0">
        {accountLoading ? (
          <div className="flex items-center justify-center py-8">
            <div>Loading account...</div>
          </div>
        ) : account ? (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            <div className="flex-1 min-w-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600">
              <TransactionManager
                accountId={account.id}
                onTransactionChange={loadAccount}
              />
            </div>
            <div className="lg:w-96 flex-shrink-0">
              <BudgetManager />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No account found</p>
          </div>
        )}
      </main>
    </div>
  );
}
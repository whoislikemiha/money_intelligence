"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { accountApi, Account } from '@/lib/api';
import ReminderManager from '@/components/ReminderManager';
import { Navbar } from '@/components/navbar';

export default function RemindersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

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

      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0]);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountChange = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedAccount(account);
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
    <div className="min-h-screen bg-background">
      <Navbar
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={handleAccountChange}
      />

      <main className="container mx-auto py-6 px-4">
        {accountLoading ? (
          <div className="flex items-center justify-center py-8">
            <div>Loading accounts...</div>
          </div>
        ) : !selectedAccount ? (
          <div className="text-center py-8">
            <p className="mb-4">No accounts found</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <ReminderManager
            accountId={selectedAccount.id}
            onReminderChange={loadAccounts}
          />
        )}
      </main>
    </div>
  );
}

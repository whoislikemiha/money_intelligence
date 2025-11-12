"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { accountApi } from '@/lib/api';
import { Account } from '@/lib/types';
import AssistantChat from '@/components/assistant/AssistantChat';
import ConversationSidebar from '@/components/assistant/ConversationSidebar';
import { Navbar } from '@/components/navbar';
import { Loader2 } from 'lucide-react';

export default function AssistantPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      loadAccounts();
    }
  }, [user, authLoading]);

  const loadAccounts = async () => {
    try {
      const accountsData = await accountApi.getAll();
      setAccounts(accountsData);

      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0]); // Select first account by default
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accountId: number) => {
    const account = accounts.find(acc => acc.id === accountId);
    setSelectedAccount(account || null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!selectedAccount) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={handleAccountChange}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">No Account Found</h2>
            <p className="text-muted-foreground">
              Please create an account to use the assistant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleNewConversation = () => {
    setCurrentConversationId(undefined);
  };

  const handleConversationSelect = (conversationId: number | undefined) => {
    setCurrentConversationId(conversationId);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={handleAccountChange}
      />
      <main className="flex-1 min-h-0 flex">
        {/* Conversation Sidebar */}
        <div className="w-64 flex-shrink-0">
          <ConversationSidebar
            currentConversationId={currentConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-w-0">
          <AssistantChat
            accountId={selectedAccount.id}
            conversationId={currentConversationId}
            onConversationChange={setCurrentConversationId}
          />
        </div>
      </main>
    </div>
  );
}

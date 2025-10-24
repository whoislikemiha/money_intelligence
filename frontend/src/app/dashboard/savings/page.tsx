"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SavingsManager from '@/components/SavingsManager';
import { Navbar } from '@/components/navbar';

export default function SavingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
      <main className="container mx-auto py-6 px-4 flex-1 overflow-auto">
        <SavingsManager />
      </main>
    </div>
  );
}

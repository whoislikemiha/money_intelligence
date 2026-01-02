"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit, MessageCircle, TrendingUp, PiggyBank, Target, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface MeetMaiProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function MeetMai({ onComplete, onBack }: MeetMaiProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      // Get onboarding data from sessionStorage
      const initialBalance = sessionStorage.getItem('onboarding_initial_balance') || '0';
      const currency = sessionStorage.getItem('onboarding_currency') || 'EUR';

      // Complete onboarding (creates default account and marks onboarding as complete)
      await apiClient.post('/onboarding/complete', {
        initial_balance: parseFloat(initialBalance),
        currency: currency,
      });

      // Clear onboarding data from sessionStorage
      sessionStorage.removeItem('onboarding_initial_balance');
      sessionStorage.removeItem('onboarding_currency');

      // Navigate to dashboard
      onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      // Still try to complete even if there's an error
      onComplete();
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <BrainCircuit className="w-24 h-24 text-primary relative" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">Meet Mai</h2>
          <p className="text-xl text-primary font-semibold">Your Personal Financial Assistant</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-lg p-6 space-y-4">
        <p className="text-lg">
          Hi! I'm Mai, your AI-powered financial companion. I'm here to help you manage your finances, track your spending, and achieve your financial goals.
        </p>
        <p className="text-muted-foreground">
          Think of me as your personal finance expert who's available 24/7. I can analyze your spending patterns, suggest budgets, help you save money, and answer any questions you have about your finances.
        </p>
      </div>

      {/* What Mai Can Do */}
      <div>
        <h3 className="font-semibold text-lg mb-4">What I Can Help You With:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium mb-1">Track Your Expenses</p>
              <p className="text-sm text-muted-foreground">
                Analyze your spending patterns and identify areas where you can save money
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium mb-1">Budget Planning</p>
              <p className="text-sm text-muted-foreground">
                Get personalized budget recommendations based on your income and spending habits
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <PiggyBank className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium mb-1">Savings Goals</p>
              <p className="text-sm text-muted-foreground">
                Track progress towards your savings goals and get tips on how to save more
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium mb-1">Smart Insights</p>
              <p className="text-sm text-muted-foreground">
                Receive AI-powered insights and personalized financial advice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Example Questions */}
      <div className="bg-muted/50 border rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Try Asking Me:
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>"How am I doing with my budget this month?"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>"Where am I spending the most money?"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>"Help me create a plan to save $5000 in 6 months"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>"What's my total spending on food this month?"</span>
          </li>
        </ul>
      </div>

      {/* Call to Action */}
      <div className="space-y-4 pt-4">
        <p className="text-lg font-medium text-center">
          Ready to take control of your finances?
        </p>
        <div className="flex justify-between">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
            >
              Back
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              variant="outline"
              onClick={handleComplete}
              disabled={isCompleting}
              size="lg"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => {
                // Open assistant in new tab or modal after completing onboarding
                handleComplete();
              }}
              disabled={isCompleting}
              size="lg"
            >
              {isCompleting ? 'Setting up...' : 'Talk to Mai Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

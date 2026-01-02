"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Stepper } from '@/components/Stepper';
import { CategorySetup } from './steps/CategorySetup';
import { BudgetSetup } from './steps/BudgetSetup';
import { SavingsSetup } from './steps/SavingsSetup';
import { TransactionSetup } from './steps/TransactionSetup';
import { MeetMai } from './steps/MeetMai';
import { BrainCircuit } from 'lucide-react';

const STEPS = [
  { title: 'Categories', description: 'Choose your categories' },
  { title: 'Budgets', description: 'Set your budgets' },
  { title: 'Savings', description: 'Create savings goals' },
  { title: 'Transactions', description: 'Add existing transactions' },
  { title: 'Meet Mai', description: 'Your financial assistant' },
];

export interface OnboardingCategory {
  name: string;
  icon: string;
  color: string;
  is_selected: boolean;
}

export interface OnboardingBudget {
  category_id: number;
  amount: number;
  notes?: string;
  tags: string[];
}

export interface OnboardingSavingsGoal {
  name: string;
  target_amount: number | null;
  color: string;
  notes?: string;
}

const ONBOARDING_STORAGE_KEY = 'onboarding_progress';

interface OnboardingProgress {
  currentStep: number;
  categoryIds: number[];
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<OnboardingCategory[]>([]);
  const [createdCategoryIds, setCreatedCategoryIds] = useState<number[]>([]);
  const [budgets, setBudgets] = useState<OnboardingBudget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<OnboardingSavingsGoal[]>([]);

  const router = useRouter();
  const { refreshUser, user, loading } = useAuth();

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (savedProgress) {
      try {
        const progress: OnboardingProgress = JSON.parse(savedProgress);
        setCurrentStep(progress.currentStep);
        setCreatedCategoryIds(progress.categoryIds);
      } catch (err) {
        console.error('Failed to load onboarding progress:', err);
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      }
    }
  }, []);

  // Save progress to localStorage whenever step changes
  useEffect(() => {
    if (currentStep > 0) {
      const progress: OnboardingProgress = {
        currentStep,
        categoryIds: createdCategoryIds,
      };
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
    }
  }, [currentStep, createdCategoryIds]);

  // Redirect to dashboard if user has already completed onboarding
  useEffect(() => {
    if (!loading && user && user.onboarding_completed) {
      router.push('/dashboard');
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCategoriesComplete = (selectedCategories: OnboardingCategory[], categoryIds: number[]) => {
    setCategories(selectedCategories);
    setCreatedCategoryIds(categoryIds);
    handleNext();
  };

  const handleBudgetsComplete = (budgetData: OnboardingBudget[]) => {
    setBudgets(budgetData);
    handleNext();
  };

  const handleSavingsComplete = (goalsData: OnboardingSavingsGoal[]) => {
    setSavingsGoals(goalsData);
    handleNext();
  };

  const handleTransactionsComplete = () => {
    handleNext();
  };

  const handleOnboardingComplete = async () => {
    // Clear onboarding progress from localStorage
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    await refreshUser();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <BrainCircuit className="h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Money Intelligence
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl">
            Let's set up your account in just a few simple steps
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="bg-card border rounded-lg p-6 md:p-8 min-h-[500px]">
          {currentStep === 0 && (
            <CategorySetup onComplete={handleCategoriesComplete} />
          )}
          {currentStep === 1 && (
            <BudgetSetup
              categoryIds={createdCategoryIds}
              onComplete={handleBudgetsComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 2 && (
            <SavingsSetup 
              onComplete={handleSavingsComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <TransactionSetup 
              onComplete={handleTransactionsComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <MeetMai 
              onComplete={handleOnboardingComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

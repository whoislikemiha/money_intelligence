"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { OnboardingBudget } from '../page';

interface BudgetSetupProps {
  categoryIds: number[];
  onComplete: (budgets: OnboardingBudget[]) => void;
  onBack?: () => void;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export function BudgetSetup({ categoryIds, onComplete, onBack }: BudgetSetupProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetAmounts, setBudgetAmounts] = useState<Record<number, string>>({});
  const [budgetTags, setBudgetTags] = useState<Record<number, string[]>>({});
  const [currentTag, setCurrentTag] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const allCategories = await apiClient.get<Category[]>('/category');
      const userCategories = allCategories.filter(cat => categoryIds.includes(cat.id));
      setCategories(userCategories);
    } catch (err) {
      setError('Failed to load categories');
    }
  };


  const handleAmountChange = (catId: number, value: string) => {
    setBudgetAmounts({ ...budgetAmounts, [catId]: value });
  };

  const addTag = (catId: number) => {
    const tag = currentTag[catId]?.trim();
    if (!tag) return;

    const existingTags = budgetTags[catId] || [];
    if (!existingTags.includes(tag)) {
      setBudgetTags({ ...budgetTags, [catId]: [...existingTags, tag] });
    }
    setCurrentTag({ ...currentTag, [catId]: '' });
  };

  const removeTag = (catId: number, tagToRemove: string) => {
    const existingTags = budgetTags[catId] || [];
    setBudgetTags({
      ...budgetTags,
      [catId]: existingTags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Prepare budgets data (only categories with amounts set)
      const budgetsToCreate: OnboardingBudget[] = [];

      // Add all budgets with amounts set
      Object.entries(budgetAmounts).forEach(([catIdStr, amount]) => {
        const catId = parseInt(catIdStr);
        if (amount && parseFloat(amount) > 0) {
          budgetsToCreate.push({
            category_id: catId,
            amount: parseFloat(amount),
            tags: budgetTags[catId] || [],
          });
        }
      });

      // Send to backend (can be empty - all budgets are optional)
      if (budgetsToCreate.length > 0) {
        await apiClient.post('/onboarding/budgets', budgetsToCreate);
      }

      onComplete(budgetsToCreate);
    } catch (err) {
      console.error('Budget creation error:', err);
      setError('Failed to create budgets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBudgetRow = (category: Category) => (
    <div
      key={category.id}
      className="border rounded-lg p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{category.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{category.name}</p>
          </div>
          <div
            className="w-4 h-4 rounded-full border mt-1"
            style={{ backgroundColor: category.color }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm">Monthly Budget Amount</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={budgetAmounts[category.id] || ''}
            onChange={(e) => handleAmountChange(category.id, e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label className="text-sm">Tags (optional)</Label>
          <div className="flex gap-2">
            <Input
              value={currentTag[category.id] || ''}
              onChange={(e) => setCurrentTag({ ...currentTag, [category.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(category.id);
                }
              }}
              placeholder="Add a tag and press Enter"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => addTag(category.id)}
              disabled={!currentTag[category.id]?.trim()}
            >
              Add
            </Button>
          </div>
          {budgetTags[category.id] && budgetTags[category.id].length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {budgetTags[category.id].map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(category.id, tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Set Your Budgets</h2>
        <p className="text-muted-foreground">
          Set monthly budget amounts for your categories. All budgets are optional - you can set them up later if you prefer.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* All Categories - Optional */}
      {categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((cat) => renderBudgetRow(cat))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No categories found. Please go back and create categories first.
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          size="lg"
          className="ml-auto"
        >
          {isLoading ? 'Saving budgets...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

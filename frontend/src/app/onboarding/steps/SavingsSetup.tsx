"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { OnboardingSavingsGoal } from '../page';

interface SavingsSetupProps {
  onComplete: (goals: OnboardingSavingsGoal[]) => void;
  onBack?: () => void;
}

interface SavingsGoalForm {
  name: string;
  target_amount: string;
  color: string;
  notes: string;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#FF9F9B', '#90EE90', '#D3D3D3', '#9B59B6', '#E74C3C',
];

export function SavingsSetup({ onComplete, onBack }: SavingsSetupProps) {
  const [goals, setGoals] = useState<SavingsGoalForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addGoal = () => {
    const randomColor = DEFAULT_COLORS[goals.length % DEFAULT_COLORS.length];
    setGoals([
      ...goals,
      { name: '', target_amount: '', color: randomColor, notes: '' },
    ]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof SavingsGoalForm, value: string) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], [field]: value };
    setGoals(updated);
  };

  const handleContinue = async () => {
    // Filter out empty goals
    const validGoals = goals.filter(goal => goal.name.trim());

    if (validGoals.length === 0) {
      // Skip - no goals to create
      onComplete([]);
      return;
    }

    // Validate goals
    for (const goal of validGoals) {
      if (!goal.name.trim()) {
        setError('Please provide a name for all goals or remove them');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const goalsToCreate: OnboardingSavingsGoal[] = validGoals.map(goal => ({
        name: goal.name,
        target_amount: goal.target_amount ? parseFloat(goal.target_amount) : null,
        color: goal.color,
        notes: goal.notes || undefined,
      }));

      // Send to backend
      await apiClient.post('/onboarding/savings-goals', goalsToCreate);

      onComplete(goalsToCreate);
    } catch (err) {
      setError('Failed to create savings goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Savings Goals</h2>
        <p className="text-muted-foreground">
          Set up savings goals to track your progress. Target amounts are optional - you can add them later.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No savings goals yet. Add your first goal to get started!</p>
          <Button onClick={addGoal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Savings Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Goal {index + 1}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeGoal(index)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Goal Name *</Label>
                  <Input
                    value={goal.name}
                    onChange={(e) => updateGoal(index, 'name', e.target.value)}
                    placeholder="e.g. Emergency Fund, Vacation, New Car"
                  />
                </div>

                <div>
                  <Label className="text-sm">Target Amount (optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={goal.target_amount}
                    onChange={(e) => updateGoal(index, 'target_amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={goal.color}
                    onChange={(e) => updateGoal(index, 'color', e.target.value)}
                    className="w-20"
                  />
                  <div className="flex gap-1">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateGoal(index, 'color', color)}
                        className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">Notes (optional)</Label>
                <Textarea
                  value={goal.notes}
                  onChange={(e) => updateGoal(index, 'notes', e.target.value)}
                  placeholder="Add any notes about this savings goal..."
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Button onClick={addGoal} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Goal
          </Button>
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
        <div className="flex gap-3 ml-auto">
          {goals.length === 0 ? (
            <Button variant="outline" onClick={() => onComplete([])} size="lg">
              Skip for Now
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Creating goals...' : 'Continue'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

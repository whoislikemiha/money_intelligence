"use client";

import { useState, useEffect } from 'react';
import { budgetApi, categoryApi } from '@/lib/api';
import { Budget, BudgetCreate, Category } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pencil, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

interface BudgetManagerProps {
  selectedCategoryId?: number | null;
  onBudgetClick?: (categoryId: number) => void;
}

export default function BudgetManager({ selectedCategoryId, onBudgetClick }: BudgetManagerProps = {}) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isFolded, setIsFolded] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetApi.getAllWithSpending();
      setBudgets(data as BudgetWithSpending[]);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
      if (data.length > 0 && !formData.category_id) {
        // Set first available category without a budget
        const availableCategory = data.find(
          category => !budgets.some(budget => budget.category_id === category.id)
        );
        setFormData(prev => ({ ...prev, category_id: availableCategory?.id.toString() || data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id.toString(),
      amount: budget.amount.toString(),
      notes: budget.notes || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      if (editingBudget) {
        await budgetApi.update(editingBudget.id, {
          amount: parseFloat(formData.amount),
          notes: formData.notes || undefined
        });
      } else {
        const budgetData: BudgetCreate = {
          category_id: parseInt(formData.category_id),
          amount: parseFloat(formData.amount),
          notes: formData.notes || undefined,
          user_id: user.id
        };
        await budgetApi.create(budgetData);
      }

      // Reset to first available category without a budget
      const availableCategory = categories.find(
        category => !budgets.some(budget => budget.category_id === category.id)
      );
      setFormData({
        category_id: availableCategory?.id.toString() || '',
        amount: '',
        notes: ''
      });
      setEditingBudget(null);
      setDialogOpen(false);

      await loadBudgets();
    } catch (error) {
      console.error(`Failed to ${editingBudget ? 'update' : 'create'} budget:`, error);
      alert(`Failed to ${editingBudget ? 'update' : 'create'} budget`);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Delay reset until after dialog animation completes
      setTimeout(() => {
        setEditingBudget(null);
        // Reset to first available category without a budget
        const availableCategory = categories.find(
          category => !budgets.some(budget => budget.category_id === category.id)
        );
        setFormData({
          category_id: availableCategory?.id.toString() || '',
          amount: '',
          notes: ''
        });
      }, 200);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await budgetApi.delete(id);
      await loadBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert('Failed to delete budget');
    }
  };

  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-start gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">
            Tracking for {getCurrentMonthName()}
          </p>
        </div>
        <div className="flex gap-2 rounded-full">
          {budgets.length > 0 && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsFolded(!isFolded)}
              title={isFolded ? 'Expand budgets' : 'Collapse budgets'}
            >
              {isFolded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
                  <DialogDescription>
                    {editingBudget ? 'Update your budget details' : 'Create a new monthly budget for a category'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      disabled={!!editingBudget}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(category => {
                            // When editing, allow the current category
                            if (editingBudget && category.id === editingBudget.category_id) {
                              return true;
                            }
                            // Filter out categories that already have budgets
                            return !budgets.some(budget => budget.category_id === category.id);
                          })
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add a note..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingBudget ? 'Update Budget' : 'Create Budget'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading budgets...</div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No budgets yet</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first budget
            </Button>
          </div>
        ) : isFolded ? (
          <div className="flex gap-3 overflow-x-auto pb-2 p-2 flex-wrap">
            {budgets.map((budget) => {
              const category = categories.find(c => c.id === budget.category_id);
              const isOverBudget = budget.percentage >= 100;
              const isWarning = budget.percentage >= 80 && budget.percentage < 100;
              const isSelected = selectedCategoryId === budget.category_id;

              return (
                <div
                  key={budget.id}
                  className={`flex items-center gap-2 border rounded-full px-3 py-2 transition-all border-l-4 ${onBudgetClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
                    } ${isSelected ? 'ring-2 ring-green-800 shadow-lg' : ''}`}
                  style={{ borderLeftColor: category?.color }}
                  onClick={() => onBudgetClick?.(budget.category_id)}
                  title={`${category?.name}: ${budget.spent.toFixed(2)} / ${Number(budget.amount).toFixed(2)} (${budget.percentage.toFixed(0)}%)`}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full text-lg"
                    style={{
                      backgroundColor: category?.color ? `${category.color}20` : '#f3f4f6',
                      color: category?.color
                    }}
                  >
                    {category?.icon}
                  </div>
                  <span className="font-medium text-sm whitespace-nowrap">
                    {category?.name || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${isOverBudget ? 'bg-red-500' :
                        isWarning ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 p-2">
            {budgets.map((budget) => {
              const category = categories.find(c => c.id === budget.category_id);
              const budgetAmount = Number(budget.amount);
              const isOverBudget = budget.percentage >= 100;
              const isWarning = budget.percentage >= 80 && budget.percentage < 100;
              const isSelected = selectedCategoryId === budget.category_id;

              return (
                <div
                  key={budget.id}
                  className={`border rounded-lg p-4 space-y-3 border-l-4 min-w-[320px] transition-all ${onBudgetClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''
                    } ${isSelected ? 'ring-2 ring-green-800 shadow-lg' : ''}`}
                  style={{ borderLeftColor: category?.color }}
                  onClick={() => onBudgetClick?.(budget.category_id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {category?.icon} {category?.name || 'Unknown Category'}
                      </h3>
                      {budget.notes && (
                        <p className="text-sm text-muted-foreground">{budget.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(budget);
                        }}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(budget.id);
                        }}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {budget.spent.toFixed(2)} of {budgetAmount.toFixed(2)}
                        </span>
                      </div>
                      <span className={`font-semibold ${isOverBudget ? 'text-red-600 dark:text-red-400' :
                        isWarning ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>

                    <Progress
                      value={Math.min(budget.percentage, 100)}
                      className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' :
                        isWarning ? '[&>div]:bg-yellow-500' :
                          '[&>div]:bg-green-500'
                        }`}
                    />

                    <div className="flex items-center justify-end text-sm">
                      <span className={`${budget.remaining >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'
                        }`}>
                        {budget.remaining >= 0 ? 'Remaining' : 'Over budget'}: {Math.abs(budget.remaining).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

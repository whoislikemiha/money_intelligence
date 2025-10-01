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
import { Plus, Trash2, Pencil, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export default function BudgetManager() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
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
        setFormData(prev => ({ ...prev, category_id: data[0].id.toString() }));
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

      setFormData({
        category_id: categories[0]?.id.toString() || '',
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
      setEditingBudget(null);
      setFormData({
        category_id: categories[0]?.id.toString() || '',
        amount: '',
        notes: ''
      });
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">
            Tracking for {getCurrentMonthName()}
          </p>
        </div>
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
                      {categories.map((category) => (
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

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent dark:scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600">
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
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const category = categories.find(c => c.id === budget.category_id);
              const budgetAmount = Number(budget.amount);
              const isOverBudget = budget.percentage >= 100;
              const isWarning = budget.percentage >= 80 && budget.percentage < 100;

              return (
                <div key={budget.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {category && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {category?.icon} {category?.name || 'Unknown Category'}
                        </h3>
                        {budget.notes && (
                          <p className="text-sm text-muted-foreground">{budget.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(budget)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget.id)}
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
                          {budget.spent.toFixed(2)} of {budgetAmount.toFixed(2)} {user?.currency}
                        </span>
                      </div>
                      <span className={`font-semibold ${
                        isOverBudget ? 'text-red-600 dark:text-red-400' :
                        isWarning ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>

                    <Progress
                      value={Math.min(budget.percentage, 100)}
                      className={`h-2 ${
                        isOverBudget ? '[&>div]:bg-red-500' :
                        isWarning ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-green-500'
                      }`}
                    />

                    <div className="flex items-center justify-between text-sm">
                      <span className={`${
                        budget.remaining >= 0 ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {budget.remaining >= 0 ? 'Remaining' : 'Over budget'}: {Math.abs(budget.remaining).toFixed(2)} {user?.currency}
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

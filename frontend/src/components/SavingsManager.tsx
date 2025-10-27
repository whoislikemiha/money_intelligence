"use client";

import { useState, useEffect } from 'react';
import { savingsGoalApi, accountApi } from '@/lib/api';
import { SavingsGoal, SavingsGoalCreate, SavingsTransactionCreate, Account } from '@/lib/types';
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
import { Plus, Trash2, Pencil, PiggyBank, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SavingsManager() {
  const { user } = useAuth();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    color: '#10b981',
    notes: ''
  });
  const [transactionFormData, setTransactionFormData] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadSavingsGoals();
    loadAccounts();
  }, []);

  const loadSavingsGoals = async () => {
    try {
      setLoading(true);
      const data = await savingsGoalApi.getAllWithAmounts();
      setSavingsGoals(data);
    } catch (error) {
      console.error('Failed to load savings goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await accountApi.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + Number(account.current_balance), 0);
  };

  const getTotalSaved = () => {
    return savingsGoals.reduce((sum, goal) => sum + (goal.current_amount || 0), 0);
  };

  const getAvailableBalance = () => {
    return getTotalBalance() - getTotalSaved();
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount?.toString() || '',
      color: goal.color,
      notes: goal.notes || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      if (editingGoal) {
        await savingsGoalApi.update(editingGoal.id, {
          name: formData.name,
          target_amount: formData.target_amount ? parseFloat(formData.target_amount) : undefined,
          color: formData.color,
          notes: formData.notes || undefined
        });
      } else {
        const goalData: SavingsGoalCreate = {
          name: formData.name,
          target_amount: formData.target_amount ? parseFloat(formData.target_amount) : undefined,
          color: formData.color,
          notes: formData.notes || undefined,
          user_id: user.id
        };
        await savingsGoalApi.create(goalData);
      }

      setFormData({
        name: '',
        target_amount: '',
        color: '#10b981',
        notes: ''
      });
      setEditingGoal(null);
      setDialogOpen(false);

      await loadSavingsGoals();
    } catch (error) {
      console.error(`Failed to ${editingGoal ? 'update' : 'create'} savings goal:`, error);
      alert(`Failed to ${editingGoal ? 'update' : 'create'} savings goal`);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setEditingGoal(null);
        setFormData({
          name: '',
          target_amount: '',
          color: '#10b981',
          notes: ''
        });
      }, 200);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;

    try {
      await savingsGoalApi.delete(id);
      await loadSavingsGoals();
    } catch (error) {
      console.error('Failed to delete savings goal:', error);
      alert('Failed to delete savings goal');
    }
  };

  const handleOpenTransactionDialog = (goal: SavingsGoal, isAllocation: boolean) => {
    setSelectedGoal(goal);
    setTransactionFormData({
      amount: '',
      description: isAllocation ? 'Allocation' : 'Deallocation'
    });
    setTransactionDialogOpen(true);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGoal) return;

    try {
      const isAllocation = transactionFormData.description === 'Allocation';
      const amount = parseFloat(transactionFormData.amount);

      const transactionData: SavingsTransactionCreate = {
        savings_goal_id: selectedGoal.id,
        amount: isAllocation ? amount : -amount,
        description: transactionFormData.description || undefined
      };

      await savingsGoalApi.createTransaction(selectedGoal.id, transactionData);

      setTransactionFormData({
        amount: '',
        description: ''
      });
      setSelectedGoal(null);
      setTransactionDialogOpen(false);

      await loadSavingsGoals();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to create transaction');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Balance Summary */}
      <div className="bg-card border rounded-lg">
        <div className="flex divide-x">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <p className="text-sm">Total Balance</p>
            </div>
            <p className="text-3xl font-bold">
              {getTotalBalance().toFixed(2)} 
            </p>
          </div>
          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4" />
              <p className="text-sm">Allocated to Savings</p>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {getTotalSaved().toFixed(2)} 
            </p>
          </div>
          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <p className="text-sm">Available to Allocate</p>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {getAvailableBalance().toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Savings Goals Section */}
      <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Savings Goals</h2>
          <p className="text-muted-foreground">
            {savingsGoals.length} {savingsGoals.length === 1 ? 'goal' : 'goals'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Savings Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}</DialogTitle>
                <DialogDescription>
                  {editingGoal ? 'Update your savings goal details' : 'Create a new savings goal'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount (Optional)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
                <Button type="submit">{editingGoal ? 'Update Goal' : 'Create Goal'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleTransactionSubmit}>
            <DialogHeader>
              <DialogTitle>
                {transactionFormData.description === 'Allocation' ? 'Allocate Funds' : 'Deallocate Funds'}
              </DialogTitle>
              <DialogDescription>
                {transactionFormData.description === 'Allocation'
                  ? `Add funds to ${selectedGoal?.name}`
                  : `Remove funds from ${selectedGoal?.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={transactionFormData.amount}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_description">Description (Optional)</Label>
                <Input
                  id="transaction_description"
                  type="text"
                  value={transactionFormData.description}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                  placeholder="Add a note..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {transactionFormData.description === 'Allocation' ? 'Allocate' : 'Deallocate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading savings goals...</div>
          </div>
        ) : savingsGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No savings goals yet</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first savings goal
            </Button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 p-2">
            {savingsGoals.map((goal) => {
              const currentAmount = goal.current_amount || 0;
              const targetAmount = goal.target_amount || 0;
              const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
              const hasTarget = targetAmount > 0;

              return (
                <div
                  key={goal.id}
                  className="border rounded-lg p-4 space-y-3 border-l-4 min-w-[320px]"
                  style={{ borderLeftColor: goal.color }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <PiggyBank className="h-4 w-4" style={{ color: goal.color }} />
                        {goal.name}
                      </h3>
                      {goal.notes && (
                        <p className="text-sm text-muted-foreground">{goal.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(goal)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {currentAmount.toFixed(2)}
                          {hasTarget && ` of ${targetAmount.toFixed(2)}`}
                        </span>
                      </div>
                      {hasTarget && (
                        <span className="font-semibold" style={{ color: goal.color }}>
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {hasTarget && (
                      <Progress
                        value={Math.min(percentage, 100)}
                        className="h-2"
                        style={{
                          // @ts-expect-error - CSS custom property
                          '--progress-background': goal.color
                        }}
                      />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTransactionDialog(goal, true)}
                      className="flex-1"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Allocate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTransactionDialog(goal, false)}
                      className="flex-1"
                      disabled={currentAmount <= 0}
                    >
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Deallocate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

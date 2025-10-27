"use client";

import { useState, useEffect } from 'react';
import { reminderApi, transactionApi, categoryApi, tagApi } from '@/lib/api';
import { Reminder, ReminderRecurrence, TransactionType, TransactionCreate, Category, Tag } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Check, X, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DueRemindersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderProcessed?: () => void;
}

export default function DueRemindersDialog({
  open,
  onOpenChange,
  onReminderProcessed
}: DueRemindersDialogProps) {
  const { user } = useAuth();
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingReminder, setProcessingReminder] = useState<Reminder | null>(null);
  const [editedAmount, setEditedAmount] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedCategoryId, setEditedCategoryId] = useState<number | undefined>(undefined);
  const [editedType, setEditedType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [editedTagIds, setEditedTagIds] = useState<number[]>([]);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open) {
      loadDueReminders();
      loadCategories();
      loadTags();
    }
  }, [open]);

  const loadDueReminders = async () => {
    try {
      setLoading(true);
      const data = await reminderApi.getDue();
      setDueReminders(data);
    } catch (error) {
      console.error('Failed to load due reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const data = await tagApi.getAll();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleProcessClick = (reminder: Reminder) => {
    setProcessingReminder(reminder);
    setEditedAmount(reminder.amount.toString());
    setEditedDescription(reminder.description || reminder.name);
    setEditedCategoryId(reminder.category_id);
    setEditedType(reminder.type);
    setEditedTagIds(reminder.tags?.map(tag => tag.id) || []);
    setTransactionDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmPayment = async () => {
    if (!processingReminder || !user) return;

    try {
      // Create the transaction with edited values
      const newTransaction: TransactionCreate = {
        account_id: processingReminder.account_id,
        category_id: editedCategoryId || 0,
        type: editedType,
        amount: parseFloat(editedAmount),
        description: editedDescription,
        date: transactionDate,
        user_id: user.id,
        tags: editedTagIds
      };

      const createdTransaction = await transactionApi.create(newTransaction);

      // Handle recurrence
      if (processingReminder.recurrence !== ReminderRecurrence.NONE) {
        // Calculate next reminder date based on recurrence
        const currentDate = new Date(processingReminder.reminder_date);
        const nextDate = new Date(currentDate);

        switch (processingReminder.recurrence) {
          case ReminderRecurrence.DAILY:
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case ReminderRecurrence.WEEKLY:
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case ReminderRecurrence.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case ReminderRecurrence.YEARLY:
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Update the reminder with the new date
        await reminderApi.update(processingReminder.id, {
          reminder_date: nextDate.toISOString().split('T')[0],
          transaction_id: createdTransaction.id
        });
      } else {
        // Mark the reminder as completed
        await reminderApi.update(processingReminder.id, {
          is_completed: true,
          transaction_id: createdTransaction.id
        });
      }

      // Reset state and reload
      setProcessingReminder(null);
      await loadDueReminders();

      if (onReminderProcessed) {
        onReminderProcessed();
      }

      // If no more due reminders, close the dialog
      const remainingReminders = dueReminders.filter(r => r.id !== processingReminder.id);
      if (remainingReminders.length === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to process reminder:', error);
      alert('Failed to create transaction from reminder');
    }
  };

  const handleDismiss = async (reminder: Reminder) => {
    if (!confirm('Dismiss this reminder without creating a transaction?')) {
      return;
    }

    try {
      // Handle recurrence
      if (reminder.recurrence !== ReminderRecurrence.NONE) {
        const currentDate = new Date(reminder.reminder_date);
        const nextDate = new Date(currentDate);

        switch (reminder.recurrence) {
          case ReminderRecurrence.DAILY:
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case ReminderRecurrence.WEEKLY:
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case ReminderRecurrence.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case ReminderRecurrence.YEARLY:
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        await reminderApi.update(reminder.id, {
          reminder_date: nextDate.toISOString().split('T')[0]
        });
      } else {
        await reminderApi.update(reminder.id, {
          is_completed: true
        });
      }

      await loadDueReminders();

      if (onReminderProcessed) {
        onReminderProcessed();
      }

      // If no more due reminders, close the dialog
      const remainingReminders = dueReminders.filter(r => r.id !== reminder.id);
      if (remainingReminders.length === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
      alert('Failed to dismiss reminder');
    }
  };

  if (processingReminder) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Reminder</DialogTitle>
            <DialogDescription>
              Confirm payment and create transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                Reminder: <span className="font-semibold">{processingReminder.name}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Edit the transaction details below before confirming
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={editedType}
                  onValueChange={(value) => setEditedType(value as TransactionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                    <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Transaction description"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editedCategoryId?.toString() || ''}
                  onValueChange={(value) => setEditedCategoryId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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

              <div className="grid gap-2">
                <Label>Tags (Optional)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const isSelected = editedTagIds.includes(tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? tag.color : undefined,
                          borderColor: tag.color,
                        }}
                        onClick={() => {
                          setEditedTagIds(
                            isSelected
                              ? editedTagIds.filter(id => id !== tag.id)
                              : [...editedTagIds, tag.id]
                          );
                        }}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                  {tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags available</p>
                  )}
                </div>
              </div>
            </div>

            {processingReminder.recurrence !== ReminderRecurrence.NONE && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  This is a recurring reminder. After processing, it will be scheduled for the next occurrence.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessingReminder(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment}>
              <Check className="mr-2 h-4 w-4" />
              Confirm & Create Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Due Reminders
          </DialogTitle>
          <DialogDescription>
            You have {dueReminders.length} reminder{dueReminders.length !== 1 ? 's' : ''} that {dueReminders.length !== 1 ? 'are' : 'is'} due
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : dueReminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No due reminders</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {dueReminders.map((reminder) => (
              <Card key={reminder.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {reminder.type === TransactionType.INCOME ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        {reminder.name}
                      </CardTitle>
                      {reminder.description && (
                        <CardDescription className="mt-1">{reminder.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={reminder.type === TransactionType.INCOME ? "default" : "destructive"}>
                      {reminder.type === TransactionType.INCOME ? '+' : '-'}€{Number(reminder.amount).toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <div className="font-medium">{getCategoryName(reminder.category_id)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(reminder.reminder_date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleProcessClick(reminder)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      I Paid This
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDismiss(reminder)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

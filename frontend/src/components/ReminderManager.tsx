"use client";

import { useState, useEffect } from 'react';
import { reminderApi, categoryApi, tagApi } from '@/lib/api';
import { Reminder, ReminderCreate, ReminderRecurrence, TransactionType, Category, Tag } from '@/lib/types';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Trash2, Bell, Pencil, Calendar } from 'lucide-react';

interface ReminderManagerProps {
  accountId: number;
  onReminderChange?: () => void;
}

export default function ReminderManager({
  accountId,
  onReminderChange
}: ReminderManagerProps) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: TransactionType.EXPENSE,
    amount: '',
    reminder_date: new Date().toISOString().split('T')[0],
    category_id: '',
    recurrence: ReminderRecurrence.NONE,
    tag_ids: [] as number[]
  });

  useEffect(() => {
    loadReminders();
    loadCategories();
    loadTags();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await reminderApi.getAll();
      // Filter reminders for this account
      setReminders(data.filter(r => r.account_id === accountId));
    } catch (error) {
      console.error('Failed to load reminders:', error);
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

  const loadTags = async () => {
    try {
      const data = await tagApi.getAll();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      name: reminder.name,
      description: reminder.description || '',
      type: reminder.type,
      amount: reminder.amount.toString(),
      reminder_date: reminder.reminder_date.split('T')[0],
      category_id: reminder.category_id?.toString() || '',
      recurrence: reminder.recurrence,
      tag_ids: reminder.tags?.map((tag: any) => tag.id) || []
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      if (editingReminder) {
        // Update existing reminder
        const updatedData = {
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          amount: parseFloat(formData.amount),
          reminder_date: formData.reminder_date,
          category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
          recurrence: formData.recurrence,
          tags: formData.tag_ids
        };

        await reminderApi.update(editingReminder.id, updatedData);
      } else {
        // Create new reminder
        const newReminder: ReminderCreate = {
          account_id: accountId,
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          amount: parseFloat(formData.amount),
          reminder_date: formData.reminder_date,
          category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
          recurrence: formData.recurrence,
          user_id: user.id,
          tags: formData.tag_ids
        };

        await reminderApi.create(newReminder);
      }

      // Reload reminders and close dialog
      await loadReminders();
      setDialogOpen(false);
      resetForm();

      if (onReminderChange) {
        onReminderChange();
      }
    } catch (error) {
      console.error('Failed to save reminder:', error);
      alert('Failed to save reminder');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      await reminderApi.delete(id);
      await loadReminders();

      if (onReminderChange) {
        onReminderChange();
      }
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      alert('Failed to delete reminder');
    }
  };

  const resetForm = () => {
    setEditingReminder(null);
    setFormData({
      name: '',
      description: '',
      type: TransactionType.EXPENSE,
      amount: '',
      reminder_date: new Date().toISOString().split('T')[0],
      category_id: categories.length > 0 ? categories[0].id.toString() : '',
      recurrence: ReminderRecurrence.NONE,
      tag_ids: []
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatRecurrence = (recurrence: ReminderRecurrence) => {
    const labels = {
      [ReminderRecurrence.NONE]: 'Once',
      [ReminderRecurrence.DAILY]: 'Daily',
      [ReminderRecurrence.WEEKLY]: 'Weekly',
      [ReminderRecurrence.MONTHLY]: 'Monthly',
      [ReminderRecurrence.YEARLY]: 'Yearly'
    };
    return labels[recurrence];
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const activeReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reminders</h2>
          <p className="text-muted-foreground">Set up recurring payment reminders</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle>
              <DialogDescription>
                Set up a reminder for recurring payments or expenses
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Pay Tax, Rent Payment"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Additional details (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}
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

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reminder_date">Reminder Date *</Label>
                    <Input
                      id="reminder_date"
                      type="date"
                      value={formData.reminder_date}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recurrence">Recurrence</Label>
                    <Select
                      value={formData.recurrence}
                      onValueChange={(value) => setFormData({ ...formData, recurrence: value as ReminderRecurrence })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReminderRecurrence.NONE}>Once</SelectItem>
                        <SelectItem value={ReminderRecurrence.DAILY}>Daily</SelectItem>
                        <SelectItem value={ReminderRecurrence.WEEKLY}>Weekly</SelectItem>
                        <SelectItem value={ReminderRecurrence.MONTHLY}>Monthly</SelectItem>
                        <SelectItem value={ReminderRecurrence.YEARLY}>Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Tags (Optional)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const isSelected = formData.tag_ids.includes(tag.id);
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
                            setFormData({
                              ...formData,
                              tag_ids: isSelected
                                ? formData.tag_ids.filter(id => id !== tag.id)
                                : [...formData.tag_ids, tag.id]
                            });
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">{editingReminder ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No reminders yet</p>
          <p className="text-sm">Create a reminder to get notified about recurring payments</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeReminders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Active Reminders</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeReminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reminder.name}</div>
                        {reminder.description && (
                          <div className="text-sm text-muted-foreground">{reminder.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reminder.type === TransactionType.INCOME ? "default" : "destructive"}>
                        {reminder.type === TransactionType.INCOME ? '+' : '-'}€{Number(reminder.amount).toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCategoryName(reminder.category_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(reminder.reminder_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatRecurrence(reminder.recurrence)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reminder)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {completedReminders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Completed Reminders</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedReminders.map((reminder) => (
                    <TableRow key={reminder.id} className="opacity-60">
                      <TableCell>
                        <div>
                          <div className="font-medium">{reminder.name}</div>
                          {reminder.description && (
                            <div className="text-sm text-muted-foreground">{reminder.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={reminder.type === TransactionType.INCOME ? "default" : "destructive"}>
                          {reminder.type === TransactionType.INCOME ? '+' : '-'}€{Number(reminder.amount).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCategoryName(reminder.category_id)}</TableCell>
                      <TableCell>{formatDate(reminder.reminder_date)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

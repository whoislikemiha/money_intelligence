"use client";

import { useState, useEffect } from 'react';
import { transactionApi, categoryApi, tagApi } from '@/lib/api';
import { Transaction, TransactionCreate, TransactionType, Category, Tag } from '@/lib/types';
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
import { Plus, Trash2, TrendingUp, TrendingDown, Pencil, X } from 'lucide-react';
import TransactionFiltersComponent, { TransactionFilters } from './TransactionFilters';
import AiTransactionInput from './AiTransactionInput';

interface TransactionManagerProps {
  accountId: number;
  onTransactionChange?: () => void;
  initialFilters?: TransactionFilters;
  showHeader?: boolean;
  customTitle?: string;
  onClose?: () => void;
}

export default function TransactionManager({
  accountId,
  onTransactionChange,
  initialFilters,
  showHeader = true,
  customTitle,
  onClose
}: TransactionManagerProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagData, setNewTagData] = useState({ name: '', color: '#3b82f6' });
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {
    startDate: '',
    endDate: '',
    categoryIds: [],
    tagIds: []
  });
  const [formData, setFormData] = useState({
    type: TransactionType.EXPENSE,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    tag_ids: [] as number[]
  });

  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadTags();
  }, []);

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionApi.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
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

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: transaction.date.split('T')[0],
      category_id: transaction.category_id.toString(),
      tag_ids: transaction.tags?.map((tag: any) => tag.id) || []
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      if (editingTransaction) {
        // Update existing transaction
        const updatedData = {
          category_id: parseInt(formData.category_id),
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          date: formData.date,
          tags: formData.tag_ids
        };
        await transactionApi.update(editingTransaction.id, updatedData);
      } else {
        // Create new transaction
        const transactionData: TransactionCreate = {
          account_id: accountId,
          category_id: parseInt(formData.category_id),
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          user_id: user.id,
          tags: formData.tag_ids
        };
        await transactionApi.create(transactionData);
      }

      setFormData({
        type: TransactionType.EXPENSE,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: categories[0]?.id.toString() || '',
        tag_ids: []
      });
      setEditingTransaction(null);
      setDialogOpen(false);

      await loadTransactions();
      if (onTransactionChange) {
        onTransactionChange();
      }
    } catch (error) {
      console.error(`Failed to ${editingTransaction ? 'update' : 'create'} transaction:`, error);
      alert(`Failed to ${editingTransaction ? 'update' : 'create'} transaction`);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Delay reset until after dialog animation completes
      setTimeout(() => {
        setEditingTransaction(null);
        setFormData({
          type: TransactionType.EXPENSE,
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category_id: categories[0]?.id.toString() || '',
          tag_ids: []
        });
      }, 200);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionApi.delete(id);
      await loadTransactions();
      if (onTransactionChange) {
        onTransactionChange();
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !newTagData.name.trim()) return;

    try {
      const newTag = await tagApi.create({
        name: newTagData.name.trim(),
        color: newTagData.color,
        user_id: user.id
      });
      await loadTags();
      setNewTagData({ name: '', color: '#3b82f6' });
      setTagDialogOpen(false);
      // Auto-select the newly created tag
      setFormData({
        ...formData,
        tag_ids: [...formData.tag_ids, newTag.id]
      });
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag');
    }
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      // Date filter
      if (filters.startDate && transaction.date < filters.startDate) return false;
      if (filters.endDate && transaction.date > filters.endDate) return false;

      // Type filter
      if (filters.type && transaction.type !== filters.type) return false;

      // Category filter - transaction must have one of the selected categories
      if (filters.categoryIds.length > 0) {
        if (!filters.categoryIds.includes(transaction.category_id)) return false;
      }

      // Tag filter - transaction must have at least one of the selected tags
      if (filters.tagIds.length > 0) {
        const transactionTagIds = transaction.tags?.map((tag: any) => tag.id) || [];
        const hasMatchingTag = filters.tagIds.some(tagId => transactionTagIds.includes(tagId));
        if (!hasMatchingTag) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date first (most recent first)
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      // If same date, sort by creation time (most recently created first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="flex flex-col h-full space-y-4">
      {customTitle && (
        <div className="flex items-center justify-between flex-shrink-0 border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">{customTitle}</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
      {showHeader && (
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              Manage your income and expenses
            </p>
          </div>
          <div className="flex gap-2">
            <AiTransactionInput
              accountId={accountId}
              categories={categories}
              tags={tags}
              onTransactionsCreated={async () => {
                await loadTransactions();
                if (onTransactionChange) {
                  onTransactionChange();
                }
              }}
            />
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                <DialogDescription>
                  {editingTransaction ? 'Update your transaction details' : 'Create a new income or expense transaction'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.EXPENSE}>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Expense
                        </div>
                      </SelectItem>
                      <SelectItem value={TransactionType.INCOME}>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Income
                        </div>
                      </SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
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
                    <div className="flex items-center justify-between">
                      <Label>Tags (Optional)</Label>
                      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" size="icon" variant="ghost" className="h-6 w-6">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                          <form onSubmit={handleCreateTag}>
                            <DialogHeader>
                              <DialogTitle>Create Tag</DialogTitle>
                              <DialogDescription>
                                Add a new tag to organize your transactions
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="tag-name">Name</Label>
                                <Input
                                  id="tag-name"
                                  value={newTagData.name}
                                  onChange={(e) => setNewTagData({ ...newTagData, name: e.target.value })}
                                  placeholder="e.g., Work, Personal, Urgent"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tag-color">Color</Label>
                                <div className="flex gap-2 items-center">
                                  <Input
                                    id="tag-color"
                                    type="color"
                                    value={newTagData.color}
                                    onChange={(e) => setNewTagData({ ...newTagData, color: e.target.value })}
                                    className="w-20 h-10"
                                  />
                                  <Badge style={{ backgroundColor: newTagData.color }}>
                                    {newTagData.name || 'Preview'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit">Create Tag</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => {
                        const isSelected = formData.tag_ids.includes(tag.id);
                        return (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'ring-2 ring-primary ring-offset-1 bg-primary/10'
                                : 'hover:bg-accent'
                            }`}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                tag_ids: isSelected
                                  ? formData.tag_ids.filter(id => id !== tag.id)
                                  : [...formData.tag_ids, tag.id]
                              });
                            }}
                          >
                            {isSelected && <span className="mr-1">✓</span>}
                            {tag.name}
                          </Badge>
                        );
                      })}
                      {tags.length === 0 && (
                        <p className="text-xs text-muted-foreground">No tags available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a note..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingTransaction ? 'Update Transaction' : 'Create Transaction'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 ">
        <TransactionFiltersComponent
          filters={filters}
          categories={categories}
          tags={tags}
          onFiltersChange={setFilters}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading transactions...</div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">
              {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
            </p>
            {transactions.length === 0 ? (
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first transaction
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setFilters({ startDate: '', endDate: '', categoryIds: [], tagIds: [] })}>
                Clear filters
              </Button>
            )}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No transactions yet</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first transaction
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table className="bg-card">
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const category = categories.find(c => c.id === transaction.category_id);
                  const isIncome = transaction.type === TransactionType.INCOME;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {category ? (
                          <span
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-full border-1 text-background"
                            style={{ borderColor: category.color, backgroundColor: category.color }}
                          >
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {transaction.tags && transaction.tags.length > 0 ? (
                            transaction.tags.map((tag: any) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs"
                                style={{ backgroundColor: tag.color || undefined }}
                              >
                                {tag.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isIncome ? '+' : '-'}{Number(transaction.amount).toFixed(2)} 
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

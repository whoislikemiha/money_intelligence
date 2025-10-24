"use client";

import { useState, useEffect } from 'react';
import { transactionApi, categoryApi, tagApi } from '@/lib/api';
import { TransactionCreate, TransactionType, Category, Tag } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import AiTransactionInput from './AiTransactionInput';

interface TransactionActionsProps {
  accountId: number;
  onTransactionCreated?: () => void;
}

export default function TransactionActions({ accountId, onTransactionCreated }: TransactionActionsProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagData, setNewTagData] = useState({ name: '', color: '#3b82f6' });
  const [formData, setFormData] = useState({
    type: TransactionType.EXPENSE,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    tag_ids: [] as number[]
  });

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
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

      setFormData({
        type: TransactionType.EXPENSE,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: categories[0]?.id.toString() || '',
        tag_ids: []
      });
      setDialogOpen(false);

      if (onTransactionCreated) {
        onTransactionCreated();
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to create transaction');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => {
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

  return (
    <div className="flex gap-2">
      <AiTransactionInput
        accountId={accountId}
        categories={categories}
        tags={tags}
        onTransactionsCreated={onTransactionCreated}
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
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Create a new income or expense transaction
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
              <Button type="submit">Create Transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { categoryApi, tagApi, accountApi, Account } from '@/lib/api';
import { Category, CategoryCreate, Tag, TagCreate } from '@/lib/types';
import { AuthAPI, UserUpdate } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: '',
    color: '#3b82f6'
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagFormData, setTagFormData] = useState({
    name: '',
    color: '#3b82f6'
  });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Account state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountFormData, setAccountFormData] = useState({
    name: '',
    initial_balance: '0',
    currency: 'EUR'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !loading) {
      loadCategories();
      loadTags();
      loadAccounts();
    }
  }, [user, loading]);

  // Categories functions
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryData: CategoryCreate = {
        name: categoryFormData.name,
        icon: categoryFormData.icon || undefined,
        color: categoryFormData.color || undefined,
      };

      if (editingCategory) {
        await categoryApi.update(editingCategory.id, categoryData);
      } else {
        await categoryApi.create(categoryData);
      }

      setCategoryFormData({ name: '', icon: '', color: '#3b82f6' });
      setEditingCategory(null);
      await loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#3b82f6'
    });
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryApi.delete(id);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleCancelCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', icon: '', color: '#3b82f6' });
  };

  // Tags functions
  const loadTags = async () => {
    try {
      setTagsLoading(true);
      const data = await tagApi.getAll();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setTagsLoading(false);
    }
  };

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user_id = parseInt(localStorage.getItem('user_id') || '0');
      const tagData: TagCreate = {
        name: tagFormData.name,
        color: tagFormData.color || undefined,
        user_id
      };

      if (editingTag) {
        await tagApi.update(editingTag.id, {
          name: tagData.name,
          color: tagData.color
        });
      } else {
        await tagApi.create(tagData);
      }

      setTagFormData({ name: '', color: '#3b82f6' });
      setEditingTag(null);
      await loadTags();
    } catch (error) {
      console.error('Failed to save tag:', error);
      alert('Failed to save tag');
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagFormData({
      name: tag.name,
      color: tag.color || '#3b82f6'
    });
  };

  const handleDeleteTag = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await tagApi.delete(id);
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag');
    }
  };

  const handleCancelTag = () => {
    setEditingTag(null);
    setTagFormData({ name: '', color: '#3b82f6' });
  };

  // Account functions
  const loadAccounts = async () => {
    try {
      setAccountLoading(true);
      const accountsData = await accountApi.getAll();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const balance = parseFloat(accountFormData.initial_balance);
      if (isNaN(balance)) {
        alert('Please enter a valid balance');
        return;
      }

      if (editingAccount) {
        await accountApi.update(editingAccount.id, {
          name: accountFormData.name,
          initial_balance: balance,
          currency: accountFormData.currency
        });
      } else {
        await accountApi.create({
          name: accountFormData.name,
          initial_balance: balance,
          currency: accountFormData.currency
        });
      }

      setAccountFormData({ name: '', initial_balance: '0', currency: 'EUR' });
      setEditingAccount(null);
      await loadAccounts();
    } catch (error) {
      console.error('Failed to save account:', error);
      alert('Failed to save account');
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountFormData({
      name: account.name,
      initial_balance: account.initial_balance.toString(),
      currency: account.currency
    });
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account? All transactions will be deleted.')) return;
    try {
      await accountApi.delete(id);
      await loadAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    }
  };

  const handleCancelAccount = () => {
    setEditingAccount(null);
    setAccountFormData({ name: '', initial_balance: '0', currency: 'EUR' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto py-8 px-4 flex-1">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Categories</h2>

              {/* Category Form */}
              <form onSubmit={handleCategorySubmit} className="space-y-4 mb-8 p-6 border rounded-lg">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="category-name">Name *</Label>
                    <Input
                      id="category-name"
                      type="text"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      required
                      maxLength={100}
                      placeholder="e.g., Food, Transport"
                    />
                  </div>

                  <div className="w-32">
                    <Label htmlFor="category-icon">Icon</Label>
                    <Input
                      id="category-icon"
                      type="text"
                      value={categoryFormData.icon}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                      maxLength={50}
                      placeholder="🍔"
                    />
                  </div>

                  <div className="w-24">
                    <Label htmlFor="category-color">Color</Label>
                    <Input
                      id="category-color"
                      type="color"
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Add'}
                  </Button>

                  {editingCategory && (
                    <Button type="button" variant="outline" onClick={handleCancelCategory}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>

              {/* Categories List */}
              {categoriesLoading ? (
                <div className="text-center py-8">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No categories yet</div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {category.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                        <div>
                          <div className="font-medium">{category.name}</div>
                          {category.color && (
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-xs text-muted-foreground">{category.color}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Tags</h2>

              {/* Tag Form */}
              <form onSubmit={handleTagSubmit} className="space-y-4 mb-8 p-6 border rounded-lg">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="tag-name">Name *</Label>
                    <Input
                      id="tag-name"
                      type="text"
                      value={tagFormData.name}
                      onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
                      required
                      maxLength={50}
                      placeholder="e.g., Important, Recurring"
                    />
                  </div>

                  <div className="w-24">
                    <Label htmlFor="tag-color">Color</Label>
                    <Input
                      id="tag-color"
                      type="color"
                      value={tagFormData.color}
                      onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <Button type="submit">
                    {editingTag ? 'Update' : 'Add'}
                  </Button>

                  {editingTag && (
                    <Button type="button" variant="outline" onClick={handleCancelTag}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>

              {/* Tags List */}
              {tagsLoading ? (
                <div className="text-center py-8">Loading tags...</div>
              ) : tags.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No tags yet</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center gap-2 px-4 py-2 border rounded-full hover:bg-accent/50 transition-colors"
                    >
                      {tag.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      <span className="font-medium">{tag.name}</span>
                      <div className="flex gap-1 ml-2 pl-2 border-l">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditTag(tag)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

              <div className="space-y-6">
                {/* Accounts Management */}
                <div className="p-6 border rounded-lg">
                  <h3 className="font-medium mb-4">Accounts</h3>

                  {/* Account Form */}
                  <form onSubmit={handleAccountSubmit} className="space-y-4 mb-6 p-4 bg-accent/50 rounded-lg">
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label htmlFor="account-name">Account Name *</Label>
                        <Input
                          id="account-name"
                          type="text"
                          value={accountFormData.name}
                          onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                          required
                          placeholder="e.g., Main Account, Savings"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="initial-balance">Initial Balance *</Label>
                        <Input
                          id="initial-balance"
                          type="number"
                          step="0.01"
                          value={accountFormData.initial_balance}
                          onChange={(e) => setAccountFormData({ ...accountFormData, initial_balance: e.target.value })}
                          required
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-40">
                        <Label htmlFor="account-currency">Currency *</Label>
                        <Select value={accountFormData.currency} onValueChange={(value) => setAccountFormData({ ...accountFormData, currency: value })}>
                          <SelectTrigger id="account-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="RSD">RSD (дин)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit">
                        {editingAccount ? 'Update' : 'Add'}
                      </Button>
                      {editingAccount && (
                        <Button type="button" variant="outline" onClick={handleCancelAccount}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </form>

                  {/* Accounts List */}
                  {accountLoading ? (
                    <div className="text-center py-8">Loading accounts...</div>
                  ) : accounts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No accounts yet. Create one above.</div>
                  ) : (
                    <div className="space-y-2">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-lg">{account.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Initial: {Number(account.initial_balance).toFixed(2)} {account.currency} • Current: {Number(account.current_balance).toFixed(2)} {account.currency}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

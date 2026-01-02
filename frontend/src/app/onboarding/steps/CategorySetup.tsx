"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit2, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { OnboardingCategory } from '../page';

interface CategorySetupProps {
  onComplete: (categories: OnboardingCategory[], categoryIds: number[]) => void;
}

interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
}

export function CategorySetup({ onComplete }: CategorySetupProps) {
  const [categories, setCategories] = useState<OnboardingCategory[]>([]);
  const [suggestions, setSuggestions] = useState<DefaultCategory[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [customColor, setCustomColor] = useState('#A0A0A0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDefaultCategories();
    loadSuggestions();
  }, []);

  const loadDefaultCategories = async () => {
    try {
      const defaults = await apiClient.get<DefaultCategory[]>('/onboarding/default-categories');
      setCategories(defaults.map(cat => ({ ...cat, is_selected: true })));
    } catch (err) {
      setError('Failed to load default categories');
    }
  };

  const loadSuggestions = async () => {
    try {
      const sug = await apiClient.get<DefaultCategory[]>('/onboarding/category-suggestions');
      setSuggestions(sug);
    } catch (err) {
      console.error('Failed to load suggestions');
    }
  };

  const toggleCategory = (index: number) => {
    const updated = [...categories];
    updated[index].is_selected = !updated[index].is_selected;
    setCategories(updated);
  };

  const startEditing = (index: number) => {
    const cat = categories[index];
    setEditingIndex(index);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditColor(cat.color);
  };

  const saveEditing = () => {
    if (editingIndex !== null) {
      const updated = [...categories];
      updated[editingIndex] = {
        ...updated[editingIndex],
        name: editName,
        icon: editIcon,
        color: editColor,
      };
      setCategories(updated);
      setEditingIndex(null);
    }
  };

  const cancelEditing = () => {
    setEditingIndex(null);
  };

  const addCustomCategory = () => {
    if (!customName.trim()) return;

    const newCat: OnboardingCategory = {
      name: customName,
      icon: customIcon || '📝',
      color: customColor,
      is_selected: true,
    };

    setCategories([...categories, newCat]);
    setCustomName('');
    setCustomIcon('');
    setCustomColor('#A0A0A0');
    setShowSuggestions(false);
  };

  const addSuggestion = (suggestion: DefaultCategory) => {
    const newCat: OnboardingCategory = {
      ...suggestion,
      is_selected: true,
    };
    setCategories([...categories, newCat]);
  };

  const handleContinue = async () => {
    const selectedCategories = categories.filter(cat => cat.is_selected);

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, check if user already has categories
      const existingCategories = await apiClient.get<{ id: number; name: string; icon: string; color: string }[]>('/category');

      if (existingCategories && existingCategories.length > 0) {
        // User already has categories, just use those IDs
        const categoryIds = existingCategories.map(cat => cat.id);
        onComplete(selectedCategories, categoryIds);
        return;
      }

      // No existing categories, create new ones
      const response = await apiClient.post<{ id: number; name: string; icon: string; color: string }[]>(
        '/onboarding/categories',
        selectedCategories
      );

      // Get the created category IDs
      const categoryIds = response.map(cat => cat.id);

      onComplete(selectedCategories, categoryIds);
    } catch (err: any) {
      console.error('Category creation error:', err);
      setError(err?.response?.data?.detail || 'Failed to create categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = categories.filter(cat => cat.is_selected).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Categories</h2>
        <p className="text-muted-foreground">
          Select the categories you want to track. You can customize names, icons, and colors.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Selected: {selectedCount} category{selectedCount !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category, index) => (
          <div
            key={index}
            className={`
              border rounded-lg p-4 transition-all
              ${category.is_selected ? 'border-primary bg-primary/5' : 'border-border bg-background'}
            `}
          >
            {editingIndex === index ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Icon (emoji)</Label>
                    <Input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="h-8"
                      placeholder="🍽"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEditing} className="flex-1">
                    <Check className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing} className="flex-1">
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={category.is_selected}
                    onCheckedChange={() => toggleCategory(index)}
                  />
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{category.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs text-muted-foreground">{category.color}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(index)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Custom Category */}
      <div className="border-t pt-6">
        <Button
          variant="outline"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Category
        </Button>

        {showSuggestions && (
          <div className="mt-4 space-y-4">
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => addSuggestion(sug)}
                      className="flex items-center gap-2"
                    >
                      <span>{sug.icon}</span>
                      <span>{sug.name}</span>
                      <Plus className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Input */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-medium mb-3 block">Create Your Own</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Category Name</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Car Maintenance"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Icon (emoji)</Label>
                    <Input
                      value={customIcon}
                      onChange={(e) => setCustomIcon(e.target.value)}
                      placeholder="🚗"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={addCustomCategory}
                  disabled={!customName.trim()}
                  className="w-full"
                >
                  Add Category
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={isLoading || selectedCount === 0}
          size="lg"
        >
          {isLoading ? 'Creating categories...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

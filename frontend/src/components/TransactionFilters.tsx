"use client";

import { useState } from 'react';
import { Category, Tag } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export interface TransactionFilters {
  startDate: string;
  endDate: string;
  categoryIds: number[];
  tagIds: number[];
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  categories: Category[];
  tags: Tag[];
  onFiltersChange: (filters: TransactionFilters) => void;
}

export default function TransactionFiltersComponent({
  filters,
  categories,
  tags,
  onFiltersChange,
}: TransactionFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = filters.startDate || filters.endDate || filters.categoryIds.length > 0 || filters.tagIds.length > 0;

  const handleAddCategory = (value: string) => {
    if (value && value !== 'select') {
      const categoryId = parseInt(value);
      if (!filters.categoryIds.includes(categoryId)) {
        onFiltersChange({
          ...filters,
          categoryIds: [...filters.categoryIds, categoryId]
        });
      }
    }
  };

  const handleAddTag = (value: string) => {
    if (value && value !== 'select') {
      const tagId = parseInt(value);
      if (!filters.tagIds.includes(tagId)) {
        onFiltersChange({
          ...filters,
          tagIds: [...filters.tagIds, tagId]
        });
      }
    }
  };

  const handleRemoveCategory = (categoryId: number) => {
    onFiltersChange({
      ...filters,
      categoryIds: filters.categoryIds.filter(id => id !== categoryId)
    });
  };

  const handleRemoveTag = (tagId: number) => {
    onFiltersChange({
      ...filters,
      tagIds: filters.tagIds.filter(id => id !== tagId)
    });
  };

  const handleClearAll = () => {
    onFiltersChange({ startDate: '', endDate: '', categoryIds: [], tagIds: [] });
  };

  return (
    <div className="border rounded-lg  bg-card">
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <h3 className="text-sm font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {filtersOpen && hasActiveFilters && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </div>

      {filtersOpen && (
        <div className="p-4 pt-2 border-t space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Date Range */}
            <div className="flex gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            {/* Add Category */}
            <div className="space-y-2">
              <Label className="text-xs">Add Category</Label>
              <Select value="select" onValueChange={handleAddCategory}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select category</SelectItem>
                  {categories
                    .filter(cat => !filters.categoryIds.includes(cat.id))
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Tag */}
            <div className="space-y-2">
              <Label className="text-xs">Add Tag</Label>
              <Select value="select" onValueChange={handleAddTag}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select tag</SelectItem>
                  {tags
                    .filter(tag => !filters.tagIds.includes(tag.id))
                    .map((tag) => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <Label className="text-xs">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.startDate && (
                  <Badge variant="outline" className="gap-1">
                    Start: {new Date(filters.startDate).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => onFiltersChange({ ...filters, startDate: '' })}
                      className="hover:bg-accent rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.endDate && (
                  <Badge variant="outline" className="gap-1">
                    End: {new Date(filters.endDate).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => onFiltersChange({ ...filters, endDate: '' })}
                      className="hover:bg-accent rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.categoryIds.map((categoryId) => {
                  const category = categories.find(c => c.id === categoryId);
                  if (!category) return null;
                  return (
                    <Badge key={categoryId} variant="outline" className="gap-1">
                      {category.icon} {category.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(categoryId)}
                        className="hover:bg-accent rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {filters.tagIds.map((tagId) => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tagId}
                      variant="outline"
                      className="gap-1"
                      style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tagId)}
                        className="hover:bg-accent rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

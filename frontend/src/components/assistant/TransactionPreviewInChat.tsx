"use client";

import { useState } from 'react';
import { TransactionPreview, Category, Tag, TransactionType } from '@/lib/types';
import { transactionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface TransactionPreviewInChatProps {
  transactions: TransactionPreview[];
  accountId: number;
  categories: Category[];
  tags: Tag[];
  onComplete: () => void;
  onDismiss: () => void;
}

export default function TransactionPreviewInChat({
  transactions,
  accountId,
  categories,
  tags,
  onComplete,
  onDismiss
}: TransactionPreviewInChatProps) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(transactions.map((_, idx) => idx))
  );

  const getCategoryById = (id: number) => categories.find(c => c.id === id);
  const getTagById = (id: number) => tags.find(t => t.id === id);

  const toggleTransaction = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleConfirm = async () => {
    if (!user || selectedIndices.size === 0) return;

    try {
      setCreating(true);

      const transactionsToCreate = transactions.filter((_, idx) => selectedIndices.has(idx));

      for (const preview of transactionsToCreate) {
        await transactionApi.create({
          account_id: accountId,
          category_id: preview.category_id,
          type: preview.type,
          amount: preview.amount,
          description: preview.description,
          date: preview.date,
          user_id: user.id,
          tags: preview.tags || [],
        });
      }

      onComplete();
    } catch (error) {
      console.error('Failed to create transactions:', error);
      alert('Failed to create transactions. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="p-4 bg-accent/50 border-2 border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">
            Review Transactions ({selectedIndices.size} of {transactions.length} selected)
          </h4>
          <Button variant="ghost" size="sm" onClick={onDismiss} disabled={creating}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {transactions.map((preview, index) => {
            const category = getCategoryById(preview.category_id);
            const isSelected = selectedIndices.has(index);
            const isIncome = preview.type === TransactionType.INCOME;

            return (
              <div
                key={index}
                onClick={() => toggleTransaction(index)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-background border-primary shadow-sm'
                    : 'bg-background/50 border-border opacity-60'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded border-2 flex-shrink-0 ${
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground'
                }`}>
                  {isSelected && <Check className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isIncome ? (
                      <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className={`font-semibold ${
                      isIncome ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isIncome ? '+' : '-'}${Number(preview.amount).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground truncate">
                    {preview.description || 'No description'}
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {category && (
                      <Badge variant="outline" className="text-xs">
                        {category.icon} {category.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(preview.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleConfirm}
            disabled={creating || selectedIndices.size === 0}
            className="flex-1"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Confirm ${selectedIndices.size} Transaction${selectedIndices.size !== 1 ? 's' : ''}`
            )}
          </Button>
          <Button variant="outline" onClick={onDismiss} disabled={creating}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

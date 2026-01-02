"use client";

import { useState, useEffect } from 'react';
import { agentApi, transactionApi } from '@/lib/api';
import { TransactionPreview, Category, Tag, TransactionType } from '@/lib/types';
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
import { Sparkles, Check, X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface AiTransactionInputProps {
  accountId: number;
  categories: Category[];
  tags: Tag[];
  onTransactionsCreated?: () => void;
}

export default function AiTransactionInput({
  accountId,
  categories,
  tags,
  onTransactionsCreated
}: AiTransactionInputProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState('');
  const [previews, setPreviews] = useState<TransactionPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedPreviews, setSelectedPreviews] = useState<Set<number>>(new Set());
  const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);
  const [plannedCount, setPlannedCount] = useState<number>(0);
  const [processingPhase, setProcessingPhase] = useState<'idle' | 'thinking' | 'making' | 'done'>('idle');
  const [showPreviewSection, setShowPreviewSection] = useState(false);

  // Cleanup stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamCleanup) {
        streamCleanup();
      }
    };
  }, [streamCleanup]);

  const handleProcess = () => {
    if (!text.trim()) return;

    setLoading(true);
    setShowPreviewSection(true);
    setPreviews([]);
    setSelectedPreviews(new Set());
    setPlannedCount(0);
    setProcessingPhase('thinking');

    // Buffer to collect all transactions
    const transactionBuffer: TransactionPreview[] = [];

    const cleanup = agentApi.processTextStream(
      {
        text: text.trim(),
        account_id: accountId,
      },
      (event) => {
        switch (event.type) {
          case 'planning':
            console.log(`Agent planning ${event.count} transactions`);
            setPlannedCount(event.count);
            setProcessingPhase('making');
            break;

          case 'transaction':
            // Collect transactions in buffer (they arrive instantly)
            transactionBuffer.push(event.data);
            break;

          case 'done':
            // All transactions collected, now display them one by one
            setLoading(false);
            setStreamCleanup(null);

            if (transactionBuffer.length > 0) {
              displayTransactionsStaggered(transactionBuffer);
            } else {
              setProcessingPhase('done');
            }
            break;

          case 'error':
            console.error('Stream error:', event.message);
            alert('Failed to process text. Please try again.');
            setLoading(false);
            setStreamCleanup(null);
            setProcessingPhase('idle');
            break;
        }
      }
    );

    setStreamCleanup(() => cleanup);
  };

  // Display transactions one by one with a staggered delay
  const displayTransactionsStaggered = (transactions: TransactionPreview[]) => {
    const INITIAL_DELAY = 400; // Wait 500ms before starting to show transactions
    const STAGGER_DELAY = 400; // 500ms between each transaction
    const FINAL_DELAY = 200; // Keep message visible for 300ms after last transaction
    const newSelectedPreviews = new Set<number>();

    transactions.forEach((transaction, index) => {
      setTimeout(() => {
        setPreviews(prev => [...prev, transaction]);
        newSelectedPreviews.add(index);
        setSelectedPreviews(new Set(newSelectedPreviews));

        // Last transaction - wait a bit before marking as done
        if (index === transactions.length - 1) {
          setTimeout(() => {
            setProcessingPhase('done');
          }, FINAL_DELAY);
        }
      }, INITIAL_DELAY + (index * STAGGER_DELAY));
    });
  };

  const handleCreateTransactions = async () => {
    if (!user || selectedPreviews.size === 0) return;

    try {
      setCreating(true);

      // Create only selected transactions
      const transactionsToCreate = previews.filter((_, idx) => selectedPreviews.has(idx));

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

      // Reset state
      setText('');
      setPreviews([]);
      setSelectedPreviews(new Set());
      setDialogOpen(false);

      if (onTransactionsCreated) {
        onTransactionsCreated();
      }
    } catch (error) {
      console.error('Failed to create transactions:', error);
      alert('Failed to create transactions. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const togglePreview = (index: number) => {
    const newSelected = new Set(selectedPreviews);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPreviews(newSelected);
  };

  const getCategoryById = (id: number) => categories.find(c => c.id === id);
  const getTagById = (id: number) => tags.find(t => t.id === id);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Button
        variant="default"
        onClick={() => setDialogOpen(true)}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        AI Input
      </Button>

      <DialogContent className="min-w-[800px]">
        <DialogHeader>
          <DialogTitle>AI Transaction Input</DialogTitle>
          <DialogDescription>
            Describe your transactions in natural language
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ai-input">What did you spend or earn?</Label>
            <div className="flex gap-2">
              <Input
                id="ai-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g., Spent $50 on groceries yesterday, coffee for $5 today"
                className="flex-1"
                disabled={showPreviewSection}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleProcess();
                  }
                }}
              />
              {!showPreviewSection && (
                <Button
                  onClick={handleProcess}
                  disabled={loading || !text.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process'
                  )}
                </Button>
              )}
            </div>
          </div>

          {showPreviewSection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {processingPhase === 'thinking' && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-medium">Thinking...</span>
                    </div>
                  )}
                  {processingPhase === 'making' && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-medium">Making {plannedCount} transaction{plannedCount !== 1 ? 's' : ''}...</span>
                    </div>
                  )}
                  {processingPhase === 'done' && previews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Done! Created {previews.length} transaction{previews.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setText('');
                    setPreviews([]);
                    setSelectedPreviews(new Set());
                    setShowPreviewSection(false);
                    setProcessingPhase('idle');
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>

              <div className="border rounded-lg max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previews.map((preview, index) => {
                      const category = getCategoryById(preview.category_id);
                      const isSelected = selectedPreviews.has(index);
                      const isIncome = preview.type === TransactionType.INCOME;

                      return (
                        <TableRow
                          key={index}
                          className={`cursor-pointer transition-all duration-300 ${isSelected ? 'bg-accent/50' : 'opacity-50'
                            }`}
                          onClick={() => togglePreview(index)}
                        >
                          <TableCell>
                            <div className={`flex items-center justify-center w-6 h-6 rounded border-2 ${isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground'
                              }`}>
                              {isSelected && <Check className="h-4 w-4" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(preview.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {isIncome ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {isIncome ? '+' : '-'}{Number(preview.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {category ? (
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: category.color,
                                  color: 'background',
                                  borderColor: category.color
                                }}
                              >
                                {category.icon} {category.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(preview.tags || []).map(tagId => {
                                const tag = getTagById(tagId);
                                return tag ? (
                                  <Badge
                                    key={tagId}
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {preview.description || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {loading && previews.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {previews.length > 0 && (
            <Button
              onClick={handleCreateTransactions}
              disabled={creating || selectedPreviews.size === 0}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${selectedPreviews.size} Transaction${selectedPreviews.size !== 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

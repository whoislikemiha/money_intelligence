"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface TransactionSetupProps {
  onComplete: () => void;
  onBack?: () => void;
}

interface TransactionPreview {
  description: string;
  amount: number;
  date: string;
  category?: string;
  type: 'income' | 'expense';
}

export function TransactionSetup({ onComplete, onBack }: TransactionSetupProps) {
  const [input, setInput] = useState('');
  const [transactions, setTransactions] = useState<TransactionPreview[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [error, setError] = useState('');

  const parseTransactions = async () => {
    if (!input.trim()) {
      setError('Please describe your transactions');
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      // Call transaction parser agent
      const response = await apiClient.post<{ transactions: TransactionPreview[] }>(
        '/agent/parse',
        { message: input }
      );

      if (response.transactions && response.transactions.length > 0) {
        setTransactions([...transactions, ...response.transactions]);
        setInput('');
        setShowInput(false);
      } else {
        setError('No transactions found in your message. Please try again with more details.');
      }
    } catch (err) {
      setError('Failed to parse transactions. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const submitAllTransactions = async () => {
    if (transactions.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get user's first account ID
      const accounts = await apiClient.get<{ id: number }[]>('/account');
      if (accounts.length === 0) {
        setError('No account found. Please complete onboarding first.');
        return;
      }

      const accountId = accounts[0].id;

      // Create each transaction
      // Note: These are already paid transactions, so they don't affect the initial balance
      for (const txn of transactions) {
        await apiClient.post('/transaction', {
          account_id: accountId,
          description: txn.description,
          amount: Math.abs(txn.amount),
          date: txn.date,
          type: txn.type,
          category: txn.category,
        });
      }

      onComplete();
    } catch (err) {
      setError('Failed to create transactions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMore = () => {
    setShowInput(true);
    setInput('');
  };

  const skip = () => {
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Add Existing Transactions</h2>
        <p className="text-muted-foreground mb-3">
          Describe transactions you've already made this month to get better tracking for the current month.
        </p>
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-md text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Important Note</p>
            <p className="text-sm mt-1">
              These transactions won't be deducted from your set initial balance. They're already paid and are just for tracking purposes this month.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* AI Input */}
      {showInput && (
        <div className="border-2 border-dashed rounded-lg p-6 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Describe Your Transactions</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Tell our AI about your transactions in natural language. For example: "Coffee at Starbucks $5, Grocery shopping at Whole Foods $120 on Monday, Netflix subscription $15.99"
          </p>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="I spent $50 on groceries yesterday, paid my $100 electricity bill, and bought coffee for $4.50..."
            rows={5}
            className="mb-4"
          />

          <div className="flex gap-2">
            <Button
              onClick={parseTransactions}
              disabled={isParsing || !input.trim()}
              className="flex-1"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse Transactions
                </>
              )}
            </Button>
            {transactions.length > 0 && (
              <Button variant="outline" onClick={() => setShowInput(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Transaction Previews */}
      {transactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Transaction Previews ({transactions.length})</h3>
            {!showInput && (
              <Button size="sm" variant="outline" onClick={addMore}>
                <Plus className="w-4 h-4 mr-1" />
                Add More
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            {transactions.map((txn, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{txn.description}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          txn.type === 'income'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {txn.type}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Amount: ${Math.abs(txn.amount).toFixed(2)}</span>
                      <span>Date: {new Date(txn.date).toLocaleDateString()}</span>
                      {txn.category && <span>Category: {txn.category}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          {transactions.length === 0 ? (
            <Button variant="outline" onClick={skip} size="lg">
              Skip for Now
            </Button>
          ) : (
            <>
              {!showInput && (
                <Button variant="outline" onClick={addMore} size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add More
                </Button>
              )}
              <Button
                onClick={submitAllTransactions}
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `Submit All (${transactions.length})`
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

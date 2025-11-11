"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';

interface DailySpending {
  date: string;
  income: number;
  expense: number;
  net: number;
}

interface SpendingTimelineChartProps {
  accountId: number;
  currency: string;
  balancesVisible?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  currency: string;
}

type Period = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'last_year';

const PERIOD_LABELS: Record<Period, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  this_year: 'This Year',
  last_year: 'Last Year',
};

const CustomTooltip = ({ active, payload, label, currency }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value.toFixed(2)} {currency}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const getDateRange = (period: Period): { start: string; end: string } => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'last_3_months':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export default function SpendingTimelineChart({
  accountId,
  currency,
  balancesVisible = true
}: SpendingTimelineChartProps) {
  const [data, setData] = useState<DailySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('this_month');

  const loadData = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange(selectedPeriod);
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/analytics/spending-timeline`);
      url.searchParams.append('account_id', accountId.toString());
      url.searchParams.append('start_date', start);
      url.searchParams.append('end_date', end);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch spending timeline');
      }

      const result: DailySpending[] = await response.json();
      setData(result);
    } catch (err) {
      // Ignore abort errors - they happen when component unmounts or dependencies change
      if (signal.aborted) {
        return;
      }

      console.error('Error loading spending timeline:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [accountId, selectedPeriod]);

  useEffect(() => {
    const abortController = new AbortController();

    loadData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadData]);

  const totals = useMemo(() => {
    return {
      income: data.reduce((sum, item) => sum + item.income, 0),
      expense: data.reduce((sum, item) => sum + item.expense, 0),
      net: data.reduce((sum, item) => sum + item.net, 0),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Spending Timeline</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Spending Timeline</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Daily Spending Timeline - {PERIOD_LABELS[selectedPeriod]}
          </h3>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {PERIOD_LABELS[period]}
            </Button>
          ))}
        </div>

        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No transaction data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Daily Spending Timeline - {PERIOD_LABELS[selectedPeriod]}
        </h3>
      </div>

      {/* Period Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {PERIOD_LABELS[period]}
          </Button>
        ))}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={balancesVisible ? (value) => value.toFixed(0) : () => '•••'}
            />
            {balancesVisible && (
              <Tooltip content={<CustomTooltip currency={currency} />} />
            )}
            <Legend />
            <Bar
              dataKey="income"
              name="Income"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
            <Bar
              dataKey="expense"
              name="Expenses"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {balancesVisible && (
        <div className="mt-4 border-t pt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {totals.income.toFixed(2)} {currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {totals.expense.toFixed(2)} {currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net</p>
            <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totals.net.toFixed(2)} {currency}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';

interface CategorySpending {
  category_id: number;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  total: number;
  percentage: number;
}

interface SpendingBreakdownChartProps {
  accountId: number;
  currency: string;
  balancesVisible?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategorySpending;
  }>;
  currency: string;
}

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percentage: number;
}

type Period = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'last_year';

const PERIOD_LABELS: Record<Period, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  this_year: 'This Year',
  last_year: 'Last Year',
};

const DEFAULT_COLOR = '#94a3b8'; // Fallback color if category has no color

const CustomTooltip = ({ active, payload, currency }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold">
          {data.category_icon} {data.category_name}
        </p>
        <p className="text-sm text-muted-foreground">
          {data.total.toFixed(2)} {currency}
        </p>
        <p className="text-sm font-medium">
          {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: LabelProps) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percentage < 5) return null; // Don't show labels for small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${percentage.toFixed(0)}%`}
    </text>
  );
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

export default function SpendingBreakdownChart({
  accountId,
  currency,
  balancesVisible = true
}: SpendingBreakdownChartProps) {
  const [data, setData] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('this_month');

  const loadData = useCallback(async (signal: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange(selectedPeriod);
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/analytics/spending-breakdown`);
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
        throw new Error('Failed to fetch spending breakdown');
      }

      const result: CategorySpending[] = await response.json();
      setData(result);
    } catch (err) {
      // Ignore abort errors - they happen when component unmounts or dependencies change
      if (signal.aborted) {
        return;
      }

      console.error('Error loading spending breakdown:', err);
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

  const totalSpending = useMemo(() => {
    return data.reduce((sum, item) => sum + item.total, 0);
  }, [data]);

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Category Spending Breakdown</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Category Spending Breakdown</h3>
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
            Category Spending Breakdown - {PERIOD_LABELS[selectedPeriod]}
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
          <p className="text-muted-foreground">No spending data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 h-fit">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">
          Expenses per Category - {PERIOD_LABELS[selectedPeriod]}
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

      <div className="h-80 flex flex-col">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={balancesVisible ? (CustomLabel as any) : false}
              outerRadius={120}
              innerRadius={20}
              fill="#8884d8"
              dataKey="total"
              nameKey="category_name"
              animationDuration={400}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.category_id}-${index}`}
                  fill={entry.category_color || DEFAULT_COLOR}
                />
              ))}
            </Pie>
            {balancesVisible && (
              <Tooltip content={<CustomTooltip currency={currency} />} />
            )}
            <Legend
              verticalAlign="middle"
              align="right"
              layout='vertical'
              formatter={(value: string) => {
                const item = data.find(d => d.category_name === value);
                if (!item) return value;
                return `${item.category_icon || ''} ${value}`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {balancesVisible && (
          <div className="text-left w-full border-t pt-4">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-sm font-bold">
              {totalSpending.toFixed(2)} {currency}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

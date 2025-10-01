"use client";

import { useState, useEffect } from 'react';
import { budgetApi, categoryApi } from '@/lib/api';
import { Budget, BudgetCreate, Category } from '@/lib/types';

interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category_id: 0,
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetApi.getAllWithSpending();
      setBudgets(data as BudgetWithSpending[]);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user_id = parseInt(localStorage.getItem('user_id') || '0');
      const budgetData: BudgetCreate = {
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        notes: formData.notes || undefined,
        user_id
      };

      if (editingBudget) {
        await budgetApi.update(editingBudget.id, {
          amount: budgetData.amount,
          notes: budgetData.notes
        });
      } else {
        await budgetApi.create(budgetData);
      }

      // Reset form
      setFormData({
        category_id: 0,
        amount: '',
        notes: ''
      });
      setShowForm(false);
      setEditingBudget(null);

      // Reload budgets
      await loadBudgets();
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      notes: budget.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await budgetApi.delete(id);
      await loadBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert('Failed to delete budget');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({
      category_id: 0,
      amount: '',
      notes: ''
    });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Budgets</h3>
          <p className="text-sm text-gray-500">Tracking for {getCurrentMonthName()}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          {showForm ? 'Cancel' : 'Add Budget'}
        </button>
      </div>

      {/* Budget Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                required
                disabled={!!editingBudget}
              >
                <option value={0}>Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                required
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              {editingBudget ? 'Update Budget' : 'Create Budget'}
            </button>
            {editingBudget && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Budgets List */}
      {loading ? (
        <div className="text-center py-4">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No budgets yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const budgetAmount = Number(budget.amount);
            const statusColor =
              budget.percentage >= 100 ? 'text-red-600' :
              budget.percentage >= 80 ? 'text-yellow-600' :
              'text-green-600';

            const progressColor =
              budget.percentage >= 100 ? 'bg-red-500' :
              budget.percentage >= 80 ? 'bg-yellow-500' :
              'bg-green-500';

            return (
              <div
                key={budget.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {budget.category?.name || getCategoryName(budget.category_id)}
                    </h4>
                  </div>

                  {/* Budget amount */}
                  <div className="text-sm text-gray-600 mb-1">
                    Monthly Budget: <span className="font-semibold text-gray-900">${budgetAmount.toFixed(2)}</span>
                  </div>

                  {/* Spent and Remaining */}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      Spent: <span className={`font-semibold ${statusColor}`}>${budget.spent.toFixed(2)}</span>
                    </span>
                    <span className="text-gray-600">
                      Remaining: <span className={`font-semibold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${budget.remaining.toFixed(2)}
                      </span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className={`h-2.5 rounded-full ${progressColor} transition-all`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>

                  {/* Percentage */}
                  <div className={`text-xs font-medium ${statusColor}`}>
                    {budget.percentage.toFixed(1)}% used
                    {budget.percentage >= 100 && ' - Over budget!'}
                  </div>

                  {budget.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{budget.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

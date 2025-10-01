"use client";

import { useState, useEffect } from 'react';
import { categoryApi } from '@/lib/api';
import { Category, CategoryCreate } from '@/lib/types';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#000000'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const categoryData: CategoryCreate = {
        name: formData.name,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
      };

      if (editingCategory) {
        await categoryApi.update(editingCategory.id, categoryData);
      } else {
        await categoryApi.create(categoryData);
      }

      // Reset form
      setFormData({
        name: '',
        icon: '',
        color: '#000000'
      });
      setShowForm(false);
      setEditingCategory(null);

      // Reload categories
      await loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#000000'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryApi.delete(id);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: '',
      color: '#000000'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                required
                maxLength={100}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                placeholder="e.g., 🍔, 🚗, 💰"
                maxLength={50}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 h-10 text-black"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
            {editingCategory && (
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

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-4">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No categories yet</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex-1 min-w-[250px] max-w-[350px]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {category.icon && (
                    <span className="text-2xl">{category.icon}</span>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    {category.color && (
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-xs text-gray-500">{category.color}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
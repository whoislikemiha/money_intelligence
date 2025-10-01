"use client";

import { useState, useEffect } from 'react';
import { tagApi } from '@/lib/api';
import { Tag, TagCreate } from '@/lib/types';

export default function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#000000'
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagApi.getAll();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user_id = parseInt(localStorage.getItem('user_id') || '0');
      const tagData: TagCreate = {
        name: formData.name,
        color: formData.color || undefined,
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

      // Reset form
      setFormData({
        name: '',
        color: '#000000'
      });
      setShowForm(false);
      setEditingTag(null);

      // Reload tags
      await loadTags();
    } catch (error) {
      console.error('Failed to save tag:', error);
      alert('Failed to save tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || '#000000'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await tagApi.delete(id);
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTag(null);
    setFormData({
      name: '',
      color: '#000000'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Tags</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          {showForm ? 'Cancel' : 'Add Tag'}
        </button>
      </div>

      {/* Tag Form */}
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
              {editingTag ? 'Update Tag' : 'Create Tag'}
            </button>
            {editingTag && (
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

      {/* Tags List */}
      {loading ? (
        <div className="text-center py-4">Loading tags...</div>
      ) : tags.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No tags yet</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 hover:shadow-md transition-shadow"
            >
              {tag.color && (
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: tag.color }}
                ></div>
              )}
              <span className="font-medium text-gray-900">{tag.name}</span>
              <div className="flex gap-1 ml-2 border-l border-gray-300 pl-2">
                <button
                  onClick={() => handleEdit(tag)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

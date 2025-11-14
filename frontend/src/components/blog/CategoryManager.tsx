/**
 * Category Manager Component
 * Dropdown with existing categories and inline creation
 */

import React, { useState } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CategoryManagerProps {
  value: string;
  onChange: (category: string) => void;
}

// Default categories (can be fetched from API in production)
const DEFAULT_CATEGORIES = [
  'Tips & Panduan',
  'Review Mobil',
  'Berita Otomotif',
  'Perawatan Mobil',
  'Teknologi Mobil',
  'Lifestyle',
];

export function CategoryManager({ value, onChange }: CategoryManagerProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const handleCreateCategory = () => {
    if (newCategory.trim()) {
      const trimmedCategory = newCategory.trim();

      // Check if category already exists
      if (categories.includes(trimmedCategory)) {
        alert('Category already exists!');
        return;
      }

      // Add new category
      setCategories(prev => [...prev, trimmedCategory]);
      onChange(trimmedCategory);
      setNewCategory('');
      setIsCreatingNew(false);
    }
  };

  return (
    <div>
      <Label htmlFor="category">Category</Label>

      {!isCreatingNew ? (
        <div className="flex gap-2 mt-1">
          <select
            id="category"
            value={value}
            onChange={(e) => {
              if (e.target.value === '__create_new__') {
                setIsCreatingNew(true);
              } else {
                onChange(e.target.value);
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select a category...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__create_new__" className="font-medium text-orange-600">
              + Create New Category
            </option>
          </select>
        </div>
      ) : (
        <div className="mt-1 space-y-2">
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category name..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateCategory();
                }
              }}
              autoFocus
            />
            <Button
              type="button"
              onClick={handleCreateCategory}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Create
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreatingNew(false);
                setNewCategory('');
              }}
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Press Enter to create or click Create button
          </p>
        </div>
      )}

      {/* Selected Category Preview */}
      {value && !isCreatingNew && (
        <div className="mt-2">
          <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
            <span className="mr-2">📁</span>
            {value}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Admin Blog Editor Page
 * Two-column layout with editor and live preview
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminBlogAPI } from '../services/adminBlogApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MarkdownEditor } from '../components/blog/MarkdownEditor';
import { AIContentGenerator } from '../components/blog/AIContentGenerator';
import { CategoryManager } from '../components/blog/CategoryManager';
import { SEOScoreIndicator } from '../components/blog/SEOScoreIndicator';

interface BlogFormData {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
}

export function AdminBlogEditorPage() {
  const { user } = useAdminAuth();
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    category: '',
    tags: [],
    content: '',
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    ogImage: '',
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('blog_draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('blog_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (confirm('Found a saved draft. Would you like to restore it?')) {
          setFormData(parsed);
        }
      } catch (e) {
        console.error('Failed to parse draft:', e);
      }
    }
  }, []);

  const handleSave = async (publishNow = false) => {
    try {
      setSaving(true);

      const dataToSave = {
        ...formData,
        status: publishNow ? 'published' : formData.status,
      };

      await adminBlogAPI.createPost(dataToSave);
      localStorage.removeItem('blog_draft');

      alert('Blog post saved successfully!');
      window.location.href = '/admin/blog';
    } catch (err) {
      alert('Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  const handleAIContentInsert = (generatedContent: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${generatedContent}` : generatedContent,
    }));
    setShowAIGenerator(false);
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleKeywordAdd = (keyword: string) => {
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword],
      }));
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Blog Post</h1>
          <p className="text-gray-500 mt-1">Write premium content with AI assistance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter blog title..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Slug: <span className="text-orange-600">/{formData.slug || 'auto-generated'}</span>
                </p>
              </div>

              <CategoryManager
                value={formData.category}
                onChange={(category) => setFormData(prev => ({ ...prev, category }))}
              />

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="Add tag and press Enter..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagAdd(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Content</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIGenerator(!showAIGenerator)}
              >
                {showAIGenerator ? 'Hide AI Generator' : 'AI Generate'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAIGenerator && (
                <AIContentGenerator onInsert={handleAIContentInsert} />
              )}

              <MarkdownEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              />
            </CardContent>
          </Card>

          {/* SEO Optimization */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO-optimized title..."
                  maxLength={60}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Compelling description for search results..."
                  maxLength={160}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {formData.keywords.map(keyword => (
                    <span
                      key={keyword}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {keyword}
                      <button
                        onClick={() => handleKeywordRemove(keyword)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="Add keyword and press Enter..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleKeywordAdd(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  value={formData.ogImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, ogImage: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>

              <SEOScoreIndicator
                title={formData.metaTitle || formData.title}
                description={formData.metaDescription}
                content={formData.content}
                keywords={formData.keywords}
              />
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    status: e.target.value as 'draft' | 'scheduled' | 'published',
                  }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Live Preview</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''} border rounded-lg p-6 bg-white`}>
                {/* Preview Header */}
                <div className="mb-6">
                  {formData.category && (
                    <span className="text-sm text-orange-600 font-medium">
                      {formData.category}
                    </span>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mt-2">
                    {formData.title || 'Untitled Post'}
                  </h1>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>By {user?.name}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {formData.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview Content */}
                <div className="prose prose-sm max-w-none">
                  {formData.content ? (
                    <div dangerouslySetInnerHTML={{
                      __html: formData.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/^(.+)$/, '<p>$1</p>')
                    }} />
                  ) : (
                    <p className="text-gray-400 italic">Start writing to see preview...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

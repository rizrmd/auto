# Blog Management System - Developer Quick Reference

Quick reference guide for developers working with the blog management system.

---

## File Structure

```
frontend/src/
├── pages/
│   ├── AdminBlogPage.tsx              # Main blog list (/admin/blog)
│   └── AdminBlogEditorPage.tsx        # Create/Edit (/admin/blog/new, /admin/blog/:id/edit)
│
├── components/
│   ├── admin/
│   │   └── AdminSidebar.tsx           # Navigation (updated with Blog menu)
│   │
│   └── blog/
│       ├── AIContentGenerator.tsx     # AI content generation panel
│       ├── MarkdownEditor.tsx         # Rich Markdown editor
│       ├── CategoryManager.tsx        # Category dropdown + inline creation
│       └── SEOScoreIndicator.tsx      # SEO scoring widget
│
└── services/
    └── adminBlogApi.ts                # API client for all blog operations
```

---

## Component API Reference

### 1. AdminBlogPage
```tsx
// No props - standalone page
import { AdminBlogPage } from '@/pages/AdminBlogPage';

// Renders at: /admin/blog
```

**State Management**:
- `posts` - Array of blog posts
- `statusFilter` - Filter by status ('all' | 'draft' | 'published' | 'scheduled' | 'archived')
- `categoryFilter` - Filter by category string
- `searchQuery` - Search by title
- `currentPage` - Pagination page number

**Key Functions**:
- `loadPosts()` - Fetch posts with current filters
- `handleDelete(id)` - Delete post with confirmation
- `handlePublishToggle(id, status)` - Publish/unpublish post

---

### 2. AdminBlogEditorPage
```tsx
// No props - uses URL params for edit mode
import { AdminBlogEditorPage } from '@/pages/AdminBlogEditorPage';

// Renders at:
// - /admin/blog/new (create mode)
// - /admin/blog/:id/edit (edit mode - future)
```

**State Management**:
- `formData: BlogFormData` - All blog post fields
- `showAIGenerator` - Toggle AI generator panel
- `previewMode` - 'desktop' | 'mobile'
- `saving` - Save/publish loading state

**Key Functions**:
- `handleSave(publishNow)` - Save draft or publish
- `handleAIContentInsert(content)` - Insert AI-generated content
- `handleTagAdd/Remove` - Tag chip management
- `handleKeywordAdd/Remove` - Keyword chip management

**Auto-Save**:
- Saves to `localStorage.getItem('blog_draft')` every 1 second
- Prompts to restore on page load

---

### 3. AIContentGenerator
```tsx
interface AIContentGeneratorProps {
  onInsert: (content: string) => void;  // Callback when content is inserted
}

// Usage:
<AIContentGenerator onInsert={(content) => setFormData({...formData, content})} />
```

**State**:
- `prompt` - User input for AI generation
- `tone` - 'professional' | 'casual' | 'balanced' | 'custom'
- `customTone` - Custom tone description (if tone === 'custom')
- `keywords` - Array of target keywords
- `selectedCars` - Array of car IDs (future)
- `generatedContent` - AI output before insertion

**API Call**:
```typescript
await adminBlogAPI.generateContent({
  prompt,
  tone: tone === 'custom' ? customTone : tone,
  keywords,
  carIds: selectedCars,
});
```

---

### 4. MarkdownEditor
```tsx
interface MarkdownEditorProps {
  value: string;              // Current Markdown content
  onChange: (value: string) => void;  // Content change callback
}

// Usage:
<MarkdownEditor value={content} onChange={setContent} />
```

**Toolbar Actions**:
- `insertFormatting(before, after)` - Wrap selection with Markdown syntax
- `insertLink()` - Prompt for URL and insert link
- `insertImage()` - Prompt for URL and insert image

**Keyboard Shortcuts**:
- Tab: Insert 2 spaces (indentation)
- Ctrl+S: Save reminder (handled by parent)

**Stats**:
- Word count (split by whitespace)
- Character count

---

### 5. CategoryManager
```tsx
interface CategoryManagerProps {
  value: string;                // Selected category
  onChange: (category: string) => void;  // Category change callback
}

// Usage:
<CategoryManager value={category} onChange={setCategory} />
```

**Default Categories**:
```typescript
const DEFAULT_CATEGORIES = [
  'Tips & Panduan',
  'Review Mobil',
  'Berita Otomotif',
  'Perawatan Mobil',
  'Teknologi Mobil',
  'Lifestyle',
];
```

**Create New**:
- Click "+ Create New Category" option
- Inline input appears
- Enter to create, duplicate check

---

### 6. SEOScoreIndicator
```tsx
interface SEOScoreIndicatorProps {
  title: string;          // Blog title or meta title
  description: string;    // Meta description
  content: string;        // Full blog content
  keywords: string[];     // Target keywords array
}

// Usage:
<SEOScoreIndicator
  title={formData.metaTitle || formData.title}
  description={formData.metaDescription}
  content={formData.content}
  keywords={formData.keywords}
/>
```

**SEO Checks** (with weights):
1. Title length optimal (50-60 chars) - 20%
2. Description length optimal (150-160 chars) - 20%
3. Keywords in title - 15%
4. Keywords in content - 15%
5. Content length sufficient (800+ words) - 20%
6. Uses headings for structure - 10%

**Score Calculation**:
```typescript
const score = (earnedWeight / totalWeight) * 100;
```

**Color Coding**:
- 80-100: Green (Excellent)
- 60-79: Yellow (Good)
- 0-59: Red (Needs Work)

---

## API Service Reference

### adminBlogAPI Methods

```typescript
import { adminBlogAPI } from '@/services/adminBlogApi';

// Get all posts with filters
const result = await adminBlogAPI.getAllPosts({
  status?: 'draft' | 'published' | 'scheduled' | 'archived',
  category?: string,
  search?: string,
  page?: number,
  limit?: number,
});
// Returns: { success, data: { posts, pagination } }

// Get single post
const post = await adminBlogAPI.getPost(id);
// Returns: { success, data: BlogPost }

// Create post
const newPost = await adminBlogAPI.createPost(data);
// Returns: { success, data: BlogPost }

// Update post
const updated = await adminBlogAPI.updatePost(id, data);
// Returns: { success, data: BlogPost }

// Delete post
await adminBlogAPI.deletePost(id);
// Returns: { success }

// Publish post
await adminBlogAPI.publishPost(id);
// Returns: { success, data: BlogPost }

// Unpublish post
await adminBlogAPI.unpublishPost(id);
// Returns: { success, data: BlogPost }

// Generate content with AI
const generated = await adminBlogAPI.generateContent({
  prompt: string,
  tone: string,
  keywords: string[],
  carIds?: number[],
});
// Returns: { success, data: { content, metadata } }

// Get categories list
const categories = await adminBlogAPI.getCategories();
// Returns: { success, data: string[] }

// Get blog analytics
const analytics = await adminBlogAPI.getBlogAnalytics(startDate, endDate);
// Returns: { success, data: { totalViews, totalPosts, topPosts, viewsByDate } }
```

---

## TypeScript Interfaces

### BlogPost
```typescript
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  authorId: number;
  authorName: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  views: number;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CreateBlogPostData
```typescript
interface CreateBlogPostData {
  title: string;
  slug?: string;  // Auto-generated if not provided
  content: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;  // Required if status === 'scheduled'
}
```

---

## Common Patterns

### 1. Adding/Removing Chips (Tags/Keywords)
```typescript
// Add
const handleAdd = (item: string) => {
  if (item && !items.includes(item)) {
    setItems(prev => [...prev, item]);
  }
};

// Remove
const handleRemove = (item: string) => {
  setItems(prev => prev.filter(i => i !== item));
};

// Enter key handler
<Input
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(e.currentTarget.value);
      e.currentTarget.value = '';
    }
  }}
/>
```

### 2. Auto-save to LocalStorage
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem('blog_draft', JSON.stringify(formData));
  }, 1000);
  return () => clearTimeout(timer);
}, [formData]);
```

### 3. Draft Recovery on Mount
```typescript
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
```

### 4. Slug Auto-generation
```typescript
useEffect(() => {
  if (formData.title) {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug }));
  }
}, [formData.title]);
```

### 5. Error Handling
```typescript
try {
  await adminBlogAPI.createPost(data);
  alert('Blog post saved successfully!');
  window.location.href = '/admin/blog';
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Failed to save';
  alert(errorMessage);
}
```

---

## Styling Utilities

### Status Badge Colors
```typescript
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'archived':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
```

### Date Formatting
```typescript
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
```

### Markdown Preview Rendering
```typescript
// Simple Markdown to HTML (for preview only)
const htmlContent = content
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
  .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
  .replace(/\n\n/g, '</p><p>')                        // Paragraphs
  .replace(/^(.+)$/, '<p>$1</p>');                    // Wrap in p

<div dangerouslySetInnerHTML={{ __html: htmlContent }} />
```

---

## Testing Checklist

### Component Tests
```typescript
// AdminBlogPage
- [ ] Loads posts on mount
- [ ] Filters by status
- [ ] Filters by category
- [ ] Searches by title
- [ ] Pagination works
- [ ] Delete confirmation shows
- [ ] Publish/unpublish toggles
- [ ] Empty state displays

// AdminBlogEditorPage
- [ ] Form data updates
- [ ] Slug auto-generates
- [ ] Tags add/remove
- [ ] Keywords add/remove
- [ ] Category changes
- [ ] AI generator toggles
- [ ] Preview updates live
- [ ] Mobile/desktop toggle
- [ ] Auto-save works
- [ ] Draft recovery works
- [ ] Save/publish buttons work

// AIContentGenerator
- [ ] Prompt updates
- [ ] Tone selection works
- [ ] Keywords add/remove
- [ ] Generate calls API
- [ ] Loading state shows
- [ ] Error displays
- [ ] Insert callback fires
- [ ] Regenerate works

// MarkdownEditor
- [ ] Toolbar buttons work
- [ ] Link insertion works
- [ ] Image insertion works
- [ ] Word/char count updates
- [ ] Tab inserts spaces
- [ ] Cursor position preserved

// CategoryManager
- [ ] Dropdown works
- [ ] Create new toggles
- [ ] New category adds
- [ ] Duplicate check works
- [ ] Preview shows

// SEOScoreIndicator
- [ ] Score calculates
- [ ] Checks update
- [ ] Tips display
- [ ] Recommendations show
- [ ] Colors change by score
```

---

## Debugging Tips

### Common Issues

1. **API calls fail**:
   - Check `localStorage.getItem('admin_token')` exists
   - Verify backend is running
   - Check network tab for errors

2. **Auto-save not working**:
   - Check `useEffect` dependency array
   - Verify `localStorage` is enabled
   - Check timer cleanup in useEffect

3. **SEO score not updating**:
   - Verify all props are passed correctly
   - Check `useMemo` dependencies
   - Console.log the checks array

4. **Preview not rendering**:
   - Check Markdown regex patterns
   - Verify `dangerouslySetInnerHTML` is used
   - Check for invalid HTML

5. **Slug not generating**:
   - Verify `useEffect` dependency is `[formData.title]`
   - Check regex patterns for slug generation

---

## Performance Tips

1. **Debounce search input**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  loadPosts();
}, [debouncedSearch]);
```

2. **Memoize SEO checks**:
```typescript
const seoChecks = useMemo(() => {
  // Expensive calculations
}, [title, description, content, keywords]);
```

3. **Lazy load preview**:
```typescript
const [showPreview, setShowPreview] = useState(false);

// Only render when visible
{showPreview && <LivePreview />}
```

4. **Virtualize long lists**:
```typescript
// For large blog post lists, use react-window
import { FixedSizeList } from 'react-window';
```

---

## Future Enhancements

### Planned Features:
- [ ] Rich text editor (WYSIWYG mode)
- [ ] Image upload to cloud storage
- [ ] Car inventory picker for AI generation
- [ ] Bulk operations (delete, change category)
- [ ] Blog post scheduling calendar view
- [ ] Analytics integration (page views, engagement)
- [ ] Comment moderation (future)
- [ ] Related posts suggestions
- [ ] Social media sharing preview
- [ ] A/B testing for titles/descriptions

---

## Contact

For questions or issues with the blog system:
- Check `PHASE4_ADMIN_BLOG_UI_SUMMARY.md` for implementation details
- Check `BLOG_UI_DESCRIPTIONS.md` for visual reference
- Review API endpoint documentation in Phase 2

---

**Last Updated**: 2025-11-14
**Phase**: 4 (Frontend Complete)
**Status**: Ready for Backend Integration

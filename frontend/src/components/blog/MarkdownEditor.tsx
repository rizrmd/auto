/**
 * Markdown Editor Component
 * Rich text editor with formatting toolbar and syntax highlighting
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const words = value.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    setCharCount(value.length);
  }, [value]);

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Link text (optional):') || url;
      insertFormatting(`[${text}](`, ')');
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const alt = prompt('Alt text (optional):') || 'image';
      insertFormatting(`![${alt}](${url})`, '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save (prevent default browser save)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      // Save will be handled by parent component
    }

    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ', '');
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-2 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('**', '**')}
          title="Bold"
          className="hover:bg-gray-200"
        >
          <strong>B</strong>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('*', '*')}
          title="Italic"
          className="hover:bg-gray-200"
        >
          <em>I</em>
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('# ', '')}
          title="Heading 1"
          className="hover:bg-gray-200"
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('## ', '')}
          title="Heading 2"
          className="hover:bg-gray-200"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('### ', '')}
          title="Heading 3"
          className="hover:bg-gray-200"
        >
          H3
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('- ', '')}
          title="Bullet List"
          className="hover:bg-gray-200"
        >
          • List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('1. ', '')}
          title="Numbered List"
          className="hover:bg-gray-200"
        >
          1. List
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          title="Insert Link"
          className="hover:bg-gray-200"
        >
          Link
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertImage}
          title="Insert Image"
          className="hover:bg-gray-200"
        >
          Image
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('```\n', '\n```')}
          title="Code Block"
          className="hover:bg-gray-200"
        >
          {'</>'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('> ', '')}
          title="Quote"
          className="hover:bg-gray-200"
        >
          "
        </Button>
      </div>

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start writing your blog content here... Use Markdown for formatting.

Example:
# Heading 1
## Heading 2

**bold text** and *italic text*

- Bullet point 1
- Bullet point 2

[Link text](https://example.com)
"
          className="w-full min-h-[500px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm resize-y"
          style={{ lineHeight: '1.6' }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex gap-4">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
        <div className="text-xs">
          <span className="text-gray-400">Ctrl+S to save • Tab to indent</span>
        </div>
      </div>

      {/* Markdown Tips */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
          Markdown Quick Reference
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <code className="text-purple-600">**bold**</code> = <strong>bold</strong>
            </div>
            <div>
              <code className="text-purple-600">*italic*</code> = <em>italic</em>
            </div>
            <div>
              <code className="text-purple-600"># Heading 1</code>
            </div>
            <div>
              <code className="text-purple-600">## Heading 2</code>
            </div>
            <div>
              <code className="text-purple-600">- List item</code>
            </div>
            <div>
              <code className="text-purple-600">1. Numbered item</code>
            </div>
            <div>
              <code className="text-purple-600">[Link](url)</code>
            </div>
            <div>
              <code className="text-purple-600">![Image](url)</code>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

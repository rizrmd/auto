/**
 * MarkdownRenderer - Renders Markdown content to HTML with styling
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '../../lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-slate max-w-none',
        // Headings
        'prose-headings:font-bold prose-headings:tracking-tight',
        'prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8',
        'prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:border-b prose-h2:pb-2',
        'prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6',
        'prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4',
        // Paragraphs and text
        'prose-p:text-base prose-p:leading-7 prose-p:mb-4',
        'prose-p:text-foreground/90',
        // Links
        'prose-a:text-primary prose-a:no-underline prose-a:font-medium',
        'hover:prose-a:underline hover:prose-a:text-primary/80',
        // Lists
        'prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6',
        'prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6',
        'prose-li:my-2',
        // Blockquotes
        'prose-blockquote:border-l-4 prose-blockquote:border-primary/30',
        'prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6',
        'prose-blockquote:text-muted-foreground',
        // Code
        'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5',
        'prose-code:rounded prose-code:text-sm prose-code:font-mono',
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:p-4',
        'prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-6',
        // Images
        'prose-img:rounded-lg prose-img:shadow-md prose-img:my-6',
        'prose-img:w-full prose-img:h-auto',
        // Tables
        'prose-table:my-6 prose-table:border-collapse',
        'prose-th:border prose-th:border-border prose-th:bg-muted',
        'prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold',
        'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2',
        // Strong and emphasis
        'prose-strong:font-bold prose-strong:text-foreground',
        'prose-em:italic',
        // Horizontal rule
        'prose-hr:my-8 prose-hr:border-border',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom heading component with IDs for anchor links
          h1: ({ node, ...props }) => {
            const id = props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return <h1 id={id} {...props} />;
          },
          h2: ({ node, ...props }) => {
            const id = props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return <h2 id={id} {...props} />;
          },
          h3: ({ node, ...props }) => {
            const id = props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return <h3 id={id} {...props} />;
          },
          // Auto-linkify external links with target="_blank"
          a: ({ node, href, ...props }) => {
            const isExternal = href?.startsWith('http') || href?.startsWith('//');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              />
            );
          },
          // Add loading="lazy" to images
          img: ({ node, ...props }) => (
            <img loading="lazy" {...props} alt={props.alt || ''} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

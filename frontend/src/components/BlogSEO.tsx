/**
 * BlogSEO - Dynamic SEO meta tags for blog posts
 * Updates document head with appropriate meta tags for search engines and social media
 */

import { useEffect } from 'react';

interface BlogSEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string | null;
  url: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  type?: 'article' | 'website';
}

export function BlogSEO({
  title,
  description,
  keywords = [],
  ogImage,
  url,
  publishedAt,
  updatedAt,
  author,
  type = 'article',
}: BlogSEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    if (keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '));
    }

    // OpenGraph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', url, true);

    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('og:image:alt', title, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    if (ogImage) {
      updateMetaTag('twitter:image', ogImage);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Schema.org structured data for articles
    if (type === 'article' && publishedAt) {
      let schemaScript = document.querySelector('script[type="application/ld+json"]');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(schemaScript);
      }

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: description,
        image: ogImage || undefined,
        datePublished: publishedAt,
        dateModified: updatedAt || publishedAt,
        author: author ? {
          '@type': 'Person',
          name: author,
        } : undefined,
        publisher: {
          '@type': 'Organization',
          name: 'AutoLeads',
          logo: {
            '@type': 'ImageObject',
            url: window.location.origin + '/logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
      };

      schemaScript.textContent = JSON.stringify(schema);
    }

    // Cleanup function to reset title on unmount
    return () => {
      document.title = 'AutoLeads - Showroom Mobil Bekas Terpercaya';
    };
  }, [title, description, keywords, ogImage, url, publishedAt, updatedAt, author, type]);

  // This component doesn't render anything
  return null;
}

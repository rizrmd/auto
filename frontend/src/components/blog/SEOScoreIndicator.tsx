/**
 * SEO Score Indicator Component
 * Visual score with checklist for SEO optimization
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SEOScoreIndicatorProps {
  title: string;
  description: string;
  content: string;
  keywords: string[];
}

interface SEOCheck {
  label: string;
  passed: boolean;
  weight: number;
  tip?: string;
}

export function SEOScoreIndicator({ title, description, content, keywords }: SEOScoreIndicatorProps) {
  const seoChecks = useMemo(() => {
    const checks: SEOCheck[] = [];

    // Title length check (50-60 chars optimal)
    const titleLength = title.length;
    checks.push({
      label: 'Title length optimal (50-60 chars)',
      passed: titleLength >= 50 && titleLength <= 60,
      weight: 20,
      tip: titleLength < 50 ? 'Title is too short' : titleLength > 60 ? 'Title is too long' : undefined,
    });

    // Description length check (150-160 chars optimal)
    const descLength = description.length;
    checks.push({
      label: 'Description length optimal (150-160 chars)',
      passed: descLength >= 150 && descLength <= 160,
      weight: 20,
      tip: descLength < 150 ? 'Description is too short' : descLength > 160 ? 'Description is too long' : undefined,
    });

    // Keywords in title
    const titleLower = title.toLowerCase();
    const hasKeywordInTitle = keywords.some(k => titleLower.includes(k.toLowerCase()));
    checks.push({
      label: 'Keywords included in title',
      passed: hasKeywordInTitle,
      weight: 15,
      tip: !hasKeywordInTitle ? 'Add at least one keyword to your title' : undefined,
    });

    // Keywords in content
    const contentLower = content.toLowerCase();
    const keywordsInContent = keywords.filter(k => contentLower.includes(k.toLowerCase()));
    const hasKeywordsInContent = keywordsInContent.length > 0;
    checks.push({
      label: 'Keywords included in content',
      passed: hasKeywordsInContent,
      weight: 15,
      tip: !hasKeywordsInContent ? 'Include your target keywords in the content' : `${keywordsInContent.length}/${keywords.length} keywords found`,
    });

    // Content length check (>800 words)
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const hasSufficientLength = wordCount >= 800;
    checks.push({
      label: 'Content length sufficient (>800 words)',
      passed: hasSufficientLength,
      weight: 20,
      tip: !hasSufficientLength ? `Currently ${wordCount} words. Need ${800 - wordCount} more.` : `${wordCount} words`,
    });

    // Has headings
    const hasHeadings = content.includes('#') || content.includes('##');
    checks.push({
      label: 'Uses headings for structure',
      passed: hasHeadings,
      weight: 10,
      tip: !hasHeadings ? 'Add headings (# or ##) to structure your content' : undefined,
    });

    return checks;
  }, [title, description, content, keywords]);

  const score = useMemo(() => {
    const totalWeight = seoChecks.reduce((sum, check) => sum + check.weight, 0);
    const earnedWeight = seoChecks
      .filter(check => check.passed)
      .reduce((sum, check) => sum + check.weight, 0);
    return Math.round((earnedWeight / totalWeight) * 100);
  }, [seoChecks]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreRing = (score: number) => {
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SEO Score</h3>
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className={`w-20 h-20 rounded-full border-4 ${getScoreRing(score)} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-sm font-medium ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {seoChecks.map((check, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              check.passed ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'
            }`}
          >
            <div className={`text-xl ${check.passed ? 'text-green-600' : 'text-gray-400'}`}>
              {check.passed ? '✓' : '○'}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${check.passed ? 'text-green-900' : 'text-gray-700'}`}>
                {check.label}
              </div>
              {check.tip && (
                <div className="text-xs text-gray-500 mt-1">
                  {check.tip}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {score < 80 && (
        <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">💡</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Recommendations</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                {!seoChecks[0].passed && (
                  <li>• Adjust title to 50-60 characters for better SEO</li>
                )}
                {!seoChecks[1].passed && (
                  <li>• Optimize meta description to 150-160 characters</li>
                )}
                {!seoChecks[2].passed && (
                  <li>• Include target keywords in your title</li>
                )}
                {!seoChecks[4].passed && (
                  <li>• Write more content (aim for 800+ words)</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

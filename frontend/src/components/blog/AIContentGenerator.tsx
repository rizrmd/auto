/**
 * AI Content Generator Component
 * Expandable panel for AI-powered blog content generation
 */

import React, { useState } from 'react';
import { adminBlogAPI } from '../../services/adminBlogApi';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface AIContentGeneratorProps {
  onInsert: (content: string) => void;
}

export function AIContentGenerator({ onInsert }: AIContentGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'balanced' | 'custom'>('balanced');
  const [customTone, setCustomTone] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedCars, setSelectedCars] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await adminBlogAPI.generateContent({
        prompt,
        tone: tone === 'custom' ? customTone : tone,
        keywords,
        carIds: selectedCars,
      });

      setGeneratedContent(response.data.content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedContent) {
      onInsert(generatedContent);
      setGeneratedContent('');
      setPrompt('');
    }
  };

  const handleKeywordAdd = (keyword: string) => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords(prev => [...prev, keyword]);
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">✨</span>
        <h3 className="text-lg font-semibold text-gray-900">AI Content Generator</h3>
      </div>

      {/* Prompt */}
      <div>
        <Label htmlFor="ai-prompt">What would you like to write about?</Label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Contoh: Tulis artikel tentang tips membeli mobil bekas yang berkualitas..."
          rows={3}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Tone Selector */}
      <div>
        <Label>Tone</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['professional', 'casual', 'balanced', 'custom'].map((t) => (
            <button
              key={t}
              onClick={() => setTone(t as typeof tone)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tone === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tone === 'custom' && (
          <Input
            value={customTone}
            onChange={(e) => setCustomTone(e.target.value)}
            placeholder="Describe your custom tone..."
            className="mt-2"
          />
        )}
      </div>

      {/* Target Keywords */}
      <div>
        <Label>Target Keywords</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {keywords.map(keyword => (
            <span
              key={keyword}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2"
            >
              {keyword}
              <button
                onClick={() => handleKeywordRemove(keyword)}
                className="text-purple-600 hover:text-purple-800"
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

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {generating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Generating...
          </>
        ) : (
          <>
            <span className="mr-2">✨</span>
            Generate with AI
          </>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <Label className="text-sm font-medium text-gray-700 mb-2">Generated Content:</Label>
            <div className="prose prose-sm max-w-none mt-2">
              <p className="text-gray-800 whitespace-pre-wrap">{generatedContent}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleInsert}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <span className="mr-2">✓</span>
              Insert to Editor
            </Button>
            <Button
              onClick={handleGenerate}
              variant="outline"
              className="flex-1"
            >
              <span className="mr-2">🔄</span>
              Regenerate
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        AI-generated content will be based on your prompt, tone, and keywords
      </p>
    </div>
  );
}

/**
 * Stats Card Component
 *
 * Reusable card component for displaying statistics with icon,
 * title, value, and trend information.
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    period: string;
  };
  description?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-600/10',
    text: 'text-blue-400',
    border: 'border-blue-600/20'
  },
  green: {
    bg: 'bg-green-600',
    bgLight: 'bg-green-600/10',
    text: 'text-green-400',
    border: 'border-green-600/20'
  },
  yellow: {
    bg: 'bg-yellow-600',
    bgLight: 'bg-yellow-600/10',
    text: 'text-yellow-400',
    border: 'border-yellow-600/20'
  },
  red: {
    bg: 'bg-red-600',
    bgLight: 'bg-red-600/10',
    text: 'text-red-400',
    border: 'border-red-600/20'
  },
  purple: {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-600/10',
    text: 'text-purple-400',
    border: 'border-purple-600/20'
  },
  indigo: {
    bg: 'bg-indigo-600',
    bgLight: 'bg-indigo-600/10',
    text: 'text-indigo-400',
    border: 'border-indigo-600/20'
  }
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'blue',
  loading = false,
  onClick
}: StatsCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-700 rounded-lg" />
            <div className="w-16 h-4 bg-slate-700 rounded" />
          </div>
          <div className="w-24 h-8 bg-slate-700 rounded mb-2" />
          <div className="w-32 h-4 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-400';
    if (trend.value < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const TrendIcon = getTrendIcon();

  return (
    <div
      className={`
        bg-slate-800 border border-slate-700 rounded-xl p-6
        hover:border-slate-600 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`
          w-12 h-12 ${colors.bgLight} rounded-lg flex items-center justify-center
        `}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {TrendIcon && <TrendIcon className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className="text-white text-2xl font-bold mb-2">{value}</p>
        {description && (
          <p className="text-slate-500 text-xs">{description}</p>
        )}
        {trend && (
          <p className="text-slate-500 text-xs mt-1">
            {trend.period}
          </p>
        )}
      </div>
    </div>
  );
}
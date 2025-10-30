/**
 * Analytics Chart Component
 *
 * Reusable chart component for displaying various analytics data
 * with support for line charts, bar charts, and area charts.
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export type ChartType = 'line' | 'bar' | 'area' | 'pie';

export interface ChartDataPoint {
  name: string;
  value?: number;
  [key: string]: any;
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: 'monotone' | 'linear' | 'step';
}

interface AnalyticsChartProps {
  type: ChartType;
  data: ChartDataPoint[];
  series?: ChartSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

const defaultColors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

const pieColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // gray
];

export function AnalyticsChart({
  type,
  data,
  series = [],
  title,
  subtitle,
  height = 300,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  colors = defaultColors,
  valueFormatter = (value) => value.toString(),
  className = ''
}: AnalyticsChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      stroke: '#64748b',
      fontSize: 12,
      tickLine: false,
      axisLine: false
    };

    const tooltipProps = {
      contentStyle: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        color: '#f1f5f9'
      },
      labelStyle: { color: '#cbd5e1' }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} tickFormatter={valueFormatter} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend wrapperStyle={{ color: '#cbd5e1' }} />}
            {series.map((s, index) => (
              <Line
                key={s.key}
                type={s.type || 'monotone'}
                dataKey={s.key}
                name={s.name}
                stroke={s.color || colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: s.color || colors[index % colors.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} tickFormatter={valueFormatter} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend wrapperStyle={{ color: '#cbd5e1' }} />}
            {series.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color || colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} tickFormatter={valueFormatter} />
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend wrapperStyle={{ color: '#cbd5e1' }} />}
            {series.map((s, index) => (
              <Area
                key={s.key}
                type={s.type || 'monotone'}
                dataKey={s.key}
                name={s.name}
                stroke={s.color || colors[index % colors.length]}
                fill={s.color || colors[index % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip {...tooltipProps} />}
            {showLegend && <Legend wrapperStyle={{ color: '#cbd5e1' }} />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          {subtitle && (
            <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-slate-400">No data available</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Pre-configured chart types for common use cases
export function TenantGrowthChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <AnalyticsChart
      type="line"
      title="Tenant Growth"
      subtitle="Monthly new tenant registrations"
      data={data}
      series={[{ key: 'tenants', name: 'New Tenants', color: '#3b82f6' }]}
      height={250}
    />
  );
}

export function RevenueChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <AnalyticsChart
      type="area"
      title="Revenue Trends"
      subtitle="Monthly revenue breakdown"
      data={data}
      series={[
        { key: 'revenue', name: 'Revenue', color: '#10b981' },
        { key: 'growth', name: 'Growth Rate', color: '#f59e0b' }
      ]}
      height={250}
      valueFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
    />
  );
}

export function LeadSourcesChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <AnalyticsChart
      type="pie"
      title="Lead Sources"
      subtitle="Distribution of lead sources"
      data={data}
      height={300}
    />
  );
}

export function PerformanceMetricsChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <AnalyticsChart
      type="bar"
      title="Performance Metrics"
      subtitle="Key performance indicators"
      data={data}
      series={[
        { key: 'conversion', name: 'Conversion Rate', color: '#8b5cf6' },
        { key: 'response', name: 'Response Time', color: '#ef4444' }
      ]}
      height={250}
    />
  );
}